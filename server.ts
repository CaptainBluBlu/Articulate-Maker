import express, { Request, Response, NextFunction } from 'express';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { UAParser } from 'ua-parser-js';
import { nanoid } from 'nanoid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = 3001;
// db/ directory is mounted as a persistent volume in production (e.g. Coolify)
const DB_DIR = path.resolve(__dirname, 'db');
const DB_PATH = path.join(DB_DIR, 'database.sqlite');
// This ID was set during the nanoid migration — it is the Default Deck
const DEFAULT_DECK_ID = 'NXEAyPF7jsivUK42D-c2M';

let db: Database;

async function initDB() {
  // Ensure the db directory exists (important for fresh deployments)
  fs.mkdirSync(DB_DIR, { recursive: true });

  db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  });

  // Enable WAL mode for better concurrency
  await db.exec('PRAGMA journal_mode=WAL;');

  // Create decks table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS decks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create visitors table for fingerprinting
  await db.exec(`
    CREATE TABLE IF NOT EXISTS visitors (
      visitor_id TEXT PRIMARY KEY,
      ip_address TEXT,
      user_agent TEXT,
      browser_name TEXT,
      browser_version TEXT,
      os_name TEXT,
      os_version TEXT,
      device_type TEXT,
      device_vendor TEXT,
      device_model TEXT,
      first_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create deck activity logs
  await db.exec(`
    CREATE TABLE IF NOT EXISTS deck_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deck_id TEXT NOT NULL,
      visitor_id TEXT,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create cards table if it doesn't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deck_id TEXT NOT NULL DEFAULT '${DEFAULT_DECK_ID}',
      category TEXT NOT NULL,
      text TEXT NOT NULL
    )
  `);

  // Migration: Add deck_id column to cards if it doesn't have one
  const tableInfo = await db.all("PRAGMA table_info(cards)");
  const hasDeckId = tableInfo.some((col: { name: string }) => col.name === 'deck_id');
  if (!hasDeckId) {
    await db.exec(`ALTER TABLE cards ADD COLUMN deck_id TEXT NOT NULL DEFAULT '${DEFAULT_DECK_ID}'`);
    console.log('[Migration] Added deck_id column to cards table.');
  }

  // Migration: Ensure the default deck exists
  const defaultDeck = await db.get('SELECT id FROM decks WHERE id = ?', DEFAULT_DECK_ID);
  if (!defaultDeck) {
    await db.run('INSERT INTO decks (id, name) VALUES (?, ?)', DEFAULT_DECK_ID, 'Default Deck');
    console.log('[Migration] Created Default Deck.');
  }
}

// ─── Visitor Tracking Middleware ────────────────────────────────────────────

async function trackVisitor(req: Request, res: Response, next: NextFunction) {
  const visitorId = req.headers['x-visitor-id'] as string;
  if (!visitorId) return next();

  try {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '';
    const ua = req.headers['user-agent'] || '';
    const parser = new UAParser(ua);
    const result = parser.getResult();

    const existing = await db.get('SELECT visitor_id FROM visitors WHERE visitor_id = ?', visitorId);
    if (existing) {
      await db.run(
        'UPDATE visitors SET last_seen_at = CURRENT_TIMESTAMP, ip_address = ?, user_agent = ? WHERE visitor_id = ?',
        ip, ua, visitorId
      );
    } else {
      await db.run(
        `INSERT INTO visitors (visitor_id, ip_address, user_agent, browser_name, browser_version, os_name, os_version, device_type, device_vendor, device_model)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        visitorId,
        ip,
        ua,
        result.browser.name || null,
        result.browser.version || null,
        result.os.name || null,
        result.os.version || null,
        result.device.type || 'desktop',
        result.device.vendor || null,
        result.device.model || null
      );
    }
  } catch (e) {
    console.error('[Tracker] Failed to track visitor:', e);
  }
  next();
}

app.use(trackVisitor);

// Helper to log a deck action
async function logAction(deckId: string, visitorId: string | undefined, action: string, details?: object) {
  try {
    await db.run(
      'INSERT INTO deck_logs (deck_id, visitor_id, action, details) VALUES (?, ?, ?, ?)',
      deckId,
      visitorId || null,
      action,
      details ? JSON.stringify(details) : null
    );
  } catch (e) {
    console.error('[Log] Failed to write log:', e);
  }
}

// ─── Deck Endpoints ──────────────────────────────────────────────────────────

// Create a new deck
app.post('/api/decks', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Deck name is required' });
    }
    const id = nanoid();
    await db.run('INSERT INTO decks (id, name) VALUES (?, ?)', id, name.trim());

    const visitorId = req.headers['x-visitor-id'] as string;
    await logAction(id, visitorId, 'CREATE_DECK', { name: name.trim() });

    res.json({ id, name: name.trim() });
  } catch (error) {
    console.error('Error creating deck:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get deck info by ID
app.get('/api/decks/:deckId', async (req: Request, res: Response) => {
  try {
    const { deckId } = req.params;
    const deck = await db.get('SELECT id, name, created_at FROM decks WHERE id = ?', deckId);
    if (!deck) return res.status(404).json({ error: 'Deck not found' });
    res.json(deck);
  } catch (error) {
    console.error('Error fetching deck:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get deck activity log
app.get('/api/decks/:deckId/logs', async (req: Request, res: Response) => {
  try {
    const { deckId } = req.params;
    const logs = await db.all(
      `SELECT dl.id, dl.action, dl.details, dl.created_at,
              v.browser_name, v.os_name, v.ip_address, v.visitor_id
       FROM deck_logs dl
       LEFT JOIN visitors v ON dl.visitor_id = v.visitor_id
       WHERE dl.deck_id = ?
       ORDER BY dl.created_at DESC
       LIMIT 200`,
      deckId
    );
    res.json(logs);
  } catch (error) {
    console.error('Error fetching deck logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Analytics Endpoints ─────────────────────────────────────────────────────

app.get('/api/analytics/visitors', async (_req: Request, res: Response) => {
  try {
    const visitors = await db.all(
      'SELECT * FROM visitors ORDER BY last_seen_at DESC'
    );
    res.json(visitors);
  } catch (error) {
    console.error('Error fetching visitors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/analytics/logs', async (_req: Request, res: Response) => {
  try {
    const logs = await db.all(
      `SELECT dl.*, d.name as deck_name, v.browser_name, v.os_name, v.ip_address
       FROM deck_logs dl
       LEFT JOIN decks d ON dl.deck_id = d.id
       LEFT JOIN visitors v ON dl.visitor_id = v.visitor_id
       ORDER BY dl.created_at DESC
       LIMIT 500`
    );
    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Cards Endpoints ─────────────────────────────────────────────────────────

// Get grouped cards for a deck
app.get('/api/decks/:deckId/cards', async (req: Request, res: Response) => {
  try {
    const { deckId } = req.params;
    const rows = await db.all('SELECT category, text FROM cards WHERE deck_id = ?', deckId);

    const data: Record<string, string[]> = {
      Person: [], World: [], Object: [], Action: [], Nature: [], Random: [],
    };
    for (const row of rows) {
      if (data[row.category]) data[row.category].push(row.text);
    }
    res.json(data);
  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get raw cards with IDs for a deck
app.get('/api/decks/:deckId/cards/raw', async (req: Request, res: Response) => {
  try {
    const { deckId } = req.params;
    const rows = await db.all(
      'SELECT id, category, text FROM cards WHERE deck_id = ? ORDER BY id DESC',
      deckId
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching raw cards:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add multiple cards to a deck (legacy multi-field form)
app.post('/api/decks/:deckId/cards', async (req: Request, res: Response) => {
  try {
    const { deckId } = req.params;
    const entries: Record<string, string> = req.body;
    const categories = ['Person', 'World', 'Object', 'Action', 'Nature', 'Random'];
    const visitorId = req.headers['x-visitor-id'] as string;

    const stmt = await db.prepare('INSERT INTO cards (deck_id, category, text) VALUES (?, ?, ?)');
    const added: string[] = [];
    for (const cat of categories) {
      if (entries[cat] && typeof entries[cat] === 'string' && entries[cat].trim().length > 0) {
        await stmt.run(deckId, cat, entries[cat].trim());
        added.push(cat);
      }
    }
    await stmt.finalize();
    await logAction(deckId, visitorId, 'ADD_CARDS', { categories: added });
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving cards:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add single card to a deck
app.post('/api/decks/:deckId/cards/single', async (req: Request, res: Response) => {
  try {
    const { deckId } = req.params;
    const { category, text } = req.body;
    const visitorId = req.headers['x-visitor-id'] as string;

    if (!category || !text || !text.trim()) {
      return res.status(400).json({ error: 'Category and text are required' });
    }
    const result = await db.run(
      'INSERT INTO cards (deck_id, category, text) VALUES (?, ?, ?)',
      deckId, category, text.trim()
    );
    await logAction(deckId, visitorId, 'ADD_CARD', { category, text: text.trim() });
    res.json({ id: result.lastID, deck_id: deckId, category, text: text.trim() });
  } catch (error) {
    console.error('Error creating single card:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk upload cards to a deck
app.post('/api/decks/:deckId/cards/bulk', async (req: Request, res: Response) => {
  try {
    const { deckId } = req.params;
    const visitorId = req.headers['x-visitor-id'] as string;
    const cards: Array<{ category: string; text: string }> = Array.isArray(req.body)
      ? req.body
      : req.body.cards || [];

    if (!cards.length) return res.status(400).json({ error: 'No cards provided' });

    await db.run('BEGIN TRANSACTION');
    const stmt = await db.prepare('INSERT INTO cards (deck_id, category, text) VALUES (?, ?, ?)');
    let insertedCount = 0;

    for (const card of cards) {
      if (card.category && card.text && card.text.trim().length > 0) {
        await stmt.run(deckId, card.category.trim(), card.text.trim());
        insertedCount++;
      }
    }
    await stmt.finalize();
    await db.run('COMMIT');

    await logAction(deckId, visitorId, 'BULK_UPLOAD', { count: insertedCount });
    res.json({ success: true, count: insertedCount });
  } catch (error) {
    await db.run('ROLLBACK').catch(() => {});
    console.error('Error bulk uploading cards:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a card (checks it belongs to the deck)
app.put('/api/decks/:deckId/cards/:id', async (req: Request, res: Response) => {
  try {
    const { deckId, id } = req.params;
    const { category, text } = req.body;
    const visitorId = req.headers['x-visitor-id'] as string;

    if (!category || !text || !text.trim()) {
      return res.status(400).json({ error: 'Category and text are required' });
    }
    await db.run(
      'UPDATE cards SET category = ?, text = ? WHERE id = ? AND deck_id = ?',
      category, text.trim(), id, deckId
    );
    await logAction(deckId, visitorId, 'EDIT_CARD', { id: Number(id), category, text: text.trim() });
    res.json({ success: true, card: { id: Number(id), category, text: text.trim() } });
  } catch (error) {
    console.error('Error updating card:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a card
app.delete('/api/decks/:deckId/cards/:id', async (req: Request, res: Response) => {
  try {
    const { deckId, id } = req.params;
    const visitorId = req.headers['x-visitor-id'] as string;

    // Get card text before deleting for log
    const card = await db.get('SELECT category, text FROM cards WHERE id = ? AND deck_id = ?', id, deckId);
    await db.run('DELETE FROM cards WHERE id = ? AND deck_id = ?', id, deckId);
    await logAction(deckId, visitorId, 'DELETE_CARD', card || { id });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting card:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Legacy Fallback Routes (keep for backward compat during migration) ──────

app.get('/api/cards', async (_req: Request, res: Response) => {
  res.redirect(`/api/decks/${DEFAULT_DECK_ID}/cards`);
});

app.get('/api/cards/raw', async (_req: Request, res: Response) => {
  res.redirect(`/api/decks/${DEFAULT_DECK_ID}/cards/raw`);
});

// ─── Boot ─────────────────────────────────────────────────────────────────────

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`API Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
});
