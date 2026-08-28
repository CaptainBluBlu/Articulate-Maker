import express from 'express';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = 3001;
const DB_PATH = path.resolve(__dirname, 'database.sqlite');

let db: Database;

async function initDB() {
  db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      text TEXT NOT NULL
    )
  `);
}

app.get('/api/cards', async (req, res) => {
  try {
    const rows = await db.all('SELECT category, text FROM cards');
    
    // Group by category to match frontend state
    const data: Record<string, string[]> = {
      Person: [],
      World: [],
      Object: [],
      Action: [],
      Nature: [],
      Random: [],
    };

    for (const row of rows) {
      if (data[row.category]) {
        data[row.category].push(row.text);
      }
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/cards', async (req, res) => {
  try {
    const entries: Record<string, string> = req.body;
    const categories = ['Person', 'World', 'Object', 'Action', 'Nature', 'Random'];

    // Start a transaction if possible, or just insert them sequentially
    const stmt = await db.prepare('INSERT INTO cards (category, text) VALUES (?, ?)');
    
    for (const cat of categories) {
      if (entries[cat] && typeof entries[cat] === 'string' && entries[cat].trim().length > 0) {
        await stmt.run(cat, entries[cat].trim());
      }
    }
    
    await stmt.finalize();

    // Return the updated data (or just success)
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving cards:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`API Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
});
