import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useStore } from '../store';
import { CATEGORIES, Category, CATEGORY_COLORS } from '../types';
import { 
  Upload, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Search, 
  FileText, 
  Download, 
  Database,
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export default function DatabasePage() {
  const { deckId } = useParams<{ deckId: string }>();
  const {
    rawCards,
    fetchRawCards,
    uploadBulkCards,
    addSingleCard,
    updateCard,
    deleteCard,
    loading
  } = useStore(deckId);

  // Local states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ category: Category; text: string }>({
    category: 'Person',
    text: '',
  });

  // Adding single card row state
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [newCardForm, setNewCardForm] = useState<{ category: Category; text: string }>({
    category: 'Person',
    text: '',
  });

  // CSV Upload states
  const [isDragging, setIsDragging] = useState(false);
  const [parsedCards, setParsedCards] = useState<Array<{ category: Category; text: string }>>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchRawCards();
  }, [fetchRawCards]);

  // CSV Parsing Helper
  const parseCSV = (csvText: string) => {
    setParseError(null);
    setUploadStatus(null);
    try {
      const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length === 0) {
        setParseError('The uploaded file is empty.');
        return;
      }

      const splitCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"' || char === "'") {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim().replace(/^["']|["']$/g, ''));
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim().replace(/^["']|["']$/g, ''));
        return result;
      };

      // Check header
      const headerLine = lines[0].toLowerCase();
      let startIndex = 0;
      let catCol = 0;
      let textCol = 1;

      if (headerLine.includes('category') || headerLine.includes('text') || headerLine.includes('word') || headerLine.includes('item')) {
        startIndex = 1;
        const headers = splitCSVLine(lines[0]).map(h => h.toLowerCase());
        catCol = headers.findIndex(h => h.includes('cat'));
        textCol = headers.findIndex(h => h.includes('text') || h.includes('word') || h.includes('item') || h.includes('card'));
        if (catCol === -1) catCol = 0;
        if (textCol === -1) textCol = 1;
      }

      const validCategoriesMap: Record<string, Category> = {
        person: 'Person',
        world: 'World',
        object: 'Object',
        action: 'Action',
        nature: 'Nature',
        random: 'Random',
      };

      const extracted: Array<{ category: Category; text: string }> = [];
      const invalidRows: number[] = [];

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i];
        const parts = splitCSVLine(line);
        
        const rawCat = (parts[catCol] || '').toLowerCase().trim();
        const rawText = (parts[textCol] || parts.slice(textCol).join(',')).trim();

        const matchedCategory = validCategoriesMap[rawCat];
        if (matchedCategory && rawText) {
          extracted.push({
            category: matchedCategory,
            text: rawText,
          });
        } else {
          invalidRows.push(i + 1);
        }
      }

      if (extracted.length === 0) {
        setParseError('No valid card entries found. Ensure format is: category,text (e.g. Person,Einstein)');
        setParsedCards([]);
      } else {
        setParsedCards(extracted);
        if (invalidRows.length > 0) {
          setParseError(`Parsed ${extracted.length} cards. Note: Skipped ${invalidRows.length} invalid rows.`);
        }
      }
    } catch (err) {
      console.error(err);
      setParseError('Failed to parse CSV file. Please check the file formatting.');
      setParsedCards([]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        parseCSV(text);
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        parseCSV(text);
      };
      reader.readAsText(file);
    }
  };

  const handleBulkUpload = async () => {
    if (parsedCards.length === 0) return;
    setIsUploading(true);
    try {
      await uploadBulkCards(parsedCards);
      setUploadStatus({
        type: 'success',
        message: `Successfully uploaded ${parsedCards.length} cards!`,
      });
      setParsedCards([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      setUploadStatus({
        type: 'error',
        message: 'Failed to upload cards to database.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadSampleCSV = () => {
    const sample = `category,text
Person,Albert Einstein
Person,Marie Curie
World,Great Wall of China
World,Amazon Rainforest
Object,Telescope
Object,Electric Guitar
Action,Skydiving
Action,Baking a Cake
Nature,Aurora Borealis
Nature,Coral Reef
Random,Artificial Intelligence
Random,Time Travel`;
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'articulate_cards_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Edit Card Handlers
  const startEditing = (card: { id: number; category: Category; text: string }) => {
    setEditingId(card.id);
    setEditForm({ category: card.category, text: card.text });
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const saveEditing = async (id: number) => {
    if (!editForm.text.trim()) return;
    await updateCard(id, editForm.category, editForm.text.trim());
    setEditingId(null);
  };

  // Add Card Handlers
  const handleAddNewCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardForm.text.trim()) return;
    await addSingleCard(newCardForm.category, newCardForm.text.trim());
    setNewCardForm({ category: 'Person', text: '' });
    setIsAddingRow(false);
  };

  // Filtered list
  const filteredCards = rawCards.filter((card) => {
    const matchesSearch = card.text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || card.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Calculate category stats
  const categoryCounts = rawCards.reduce((acc, card) => {
    acc[card.category] = (acc[card.category] || 0) + 1;
    return acc;
  }, {} as Record<Category, number>);

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto max-w-6xl mx-auto w-full gap-6 animate-in fade-in duration-300">
      
      {/* Top Banner / Stats Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-rose-50 text-[#E11D48] rounded-2xl">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Database & Mass Upload</h1>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Manage, inspect, and bulk import cards for your game</p>
            </div>
          </div>
        </div>

        {/* Category counters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-gray-900 text-white font-mono text-xs font-bold shadow-sm">
            Total: {rawCards.length}
          </div>
          {CATEGORIES.map((cat) => (
            <div
              key={cat}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shadow-sm flex items-center gap-1.5 ${CATEGORY_COLORS[cat]}`}
            >
              <span>{cat}</span>
              <span className="opacity-90 font-mono font-extrabold">{categoryCounts[cat] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2-Column or Stacked Section: Mass Upload + CSV Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CSV Upload Dropzone */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-gray-700" />
                <h2 className="font-bold text-gray-900 text-base sm:text-lg">Mass Upload (CSV)</h2>
              </div>
              <button
                onClick={downloadSampleCSV}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Sample Template
              </button>
            </div>

            {/* Drop area */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-rose-500 bg-rose-50/50 scale-[0.99]'
                  : 'border-gray-300 hover:border-gray-400 bg-gray-50/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="p-3 bg-white shadow-md rounded-2xl text-rose-600 mb-3">
                <FileText className="w-8 h-8" />
              </div>
              <p className="text-sm sm:text-base font-bold text-gray-800">
                Click to browse or drag & drop a CSV file
              </p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm">
                Columns required: <span className="font-mono text-gray-600">category, text</span>. Categories must be Person, World, Object, Action, Nature, or Random.
              </p>
            </div>

            {/* Status alerts */}
            {parseError && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{parseError}</span>
              </div>
            )}

            {uploadStatus && (
              <div className={`mt-3 p-3 rounded-xl text-xs flex items-start gap-2 ${
                uploadStatus.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}>
                {uploadStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{uploadStatus.message}</span>
              </div>
            )}
          </div>

          {/* Parsed Preview and Upload Action */}
          {parsedCards.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-gray-600 font-medium">
                Ready to import <span className="font-bold text-gray-900 font-mono text-sm">{parsedCards.length}</span> cards from file
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => { setParsedCards([]); setParseError(null); }}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Clear
                </button>
                <button
                  onClick={handleBulkUpload}
                  disabled={isUploading}
                  className="flex-1 sm:flex-initial px-6 py-2 bg-[#E11D48] hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-200 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                  {isUploading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>Upload {parsedCards.length} Cards</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CSV Format Quick Guide */}
        <div className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-2">CSV Format Guide</h3>
            <p className="text-xs text-gray-500 mb-3">
              Create a spreadsheet with two columns:
            </p>
            <div className="bg-gray-900 text-gray-100 rounded-xl p-3 text-[11px] font-mono leading-relaxed overflow-x-auto shadow-inner">
              <div className="text-gray-400">category,text</div>
              <div>Person,Leonardo da Vinci</div>
              <div>World,Mount Everest</div>
              <div>Object,Smartphone</div>
              <div>Action,Juggle 3 balls</div>
              <div>Nature,Sunflower</div>
              <div>Random,Quantum Physics</div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>Supported categories: 6</span>
            <span className="font-mono">UTF-8 .csv</span>
          </div>
        </div>
      </div>

      {/* Database Table Section */}
      <section className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden flex flex-col">
        
        {/* Table Controls Header */}
        <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          
          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search words..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter & Actions */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            {/* Category selector */}
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm overflow-x-auto max-w-full">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  selectedCategory === 'ALL'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                All ({rawCards.length})
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-rose-50 text-[#E11D48] border border-rose-200'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Add New Row Button */}
            <button
              onClick={() => setIsAddingRow(prev => !prev)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                isAddingRow
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
              }`}
            >
              {isAddingRow ? (
                <>
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Add Row
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Add Row Form (Expandable) */}
        {isAddingRow && (
          <form
            onSubmit={handleAddNewCard}
            className="p-4 bg-emerald-50/70 border-b border-emerald-100 flex flex-col sm:flex-row items-center gap-3 animate-in slide-in-from-top-2 duration-200"
          >
            <div className="w-full sm:w-48 shrink-0">
              <select
                value={newCardForm.category}
                onChange={(e) => setNewCardForm(prev => ({ ...prev, category: e.target.value as Category }))}
                className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="w-full flex-1">
              <input
                type="text"
                placeholder="Enter word / phrase (e.g. Marie Curie)..."
                value={newCardForm.text}
                onChange={(e) => setNewCardForm(prev => ({ ...prev, text: e.target.value }))}
                autoFocus
                className="w-full bg-white border border-emerald-300 rounded-xl px-4 py-2 text-xs sm:text-sm text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={!newCardForm.text.trim()}
              className="w-full sm:w-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Save Card
            </button>
          </form>
        )}

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-4 sm:px-6 w-16">ID</th>
                <th className="py-3 px-4 sm:px-6 w-36">Category</th>
                <th className="py-3 px-4 sm:px-6">Word / Text</th>
                <th className="py-3 px-4 sm:px-6 w-28 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs sm:text-sm font-medium text-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-300" />
                    Loading database...
                  </td>
                </tr>
              ) : filteredCards.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-400">
                    No cards found. Try uploading a CSV or adding a card!
                  </td>
                </tr>
              ) : (
                filteredCards.map((card) => {
                  const isEditing = editingId === card.id;

                  return (
                    <tr 
                      key={card.id}
                      className={`hover:bg-gray-50/70 transition-colors ${
                        isEditing ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      {/* ID */}
                      <td className="py-3.5 px-4 sm:px-6 font-mono text-[11px] text-gray-400">
                        #{card.id}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 sm:px-6">
                        {isEditing ? (
                          <select
                            value={editForm.category}
                            onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value as Category }))}
                            className="bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold text-gray-800 outline-none focus:border-rose-500"
                          >
                            {CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${CATEGORY_COLORS[card.category]}`}>
                            {card.category}
                          </span>
                        )}
                      </td>

                      {/* Word / Text */}
                      <td className="py-3.5 px-4 sm:px-6 font-semibold">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.text}
                            onChange={(e) => setEditForm(prev => ({ ...prev, text: e.target.value }))}
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1 text-xs sm:text-sm font-semibold outline-none focus:border-rose-500"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEditing(card.id);
                              if (e.key === 'Escape') cancelEditing();
                            }}
                          />
                        ) : (
                          <span className="text-gray-900">{card.text}</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => saveEditing(card.id)}
                                title="Save"
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={cancelEditing}
                                title="Cancel"
                                className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEditing(card)}
                                title="Edit Card"
                                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteCard(card.id)}
                                title="Delete Card"
                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
          <div>
            Showing <span className="font-bold text-gray-900 font-mono">{filteredCards.length}</span> of <span className="font-bold text-gray-900 font-mono">{rawCards.length}</span> cards
          </div>
          <button
            onClick={() => fetchRawCards()}
            className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 font-semibold cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </section>
    </div>
  );
}
