import React, { useState } from 'react';
import { Vocabulary, Grammar, VocabTag } from '../types';
import { BookOpen, Library, Search, Edit2, Trash2, Plus, X, Save, Wand2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { VocabDetailModal, GrammarDetailModal } from './DetailModals';
import { ConfirmModal } from './ConfirmModal';
import { GoogleGenAI, Type } from '@google/genai';

interface StudyCenterProps {
  vocabList: Vocabulary[];
  grammarList: Grammar[];
  initialFilter?: { type: 'vocab' | 'grammar', tag: VocabTag | 'all' };
  onAddVocab: (vocab: Omit<Vocabulary, 'id' | 'createdAt' | 'lastReviewed' | 'uid'>) => void;
  onUpdateVocabTag: (id: string, tag: VocabTag) => void;
  onDeleteVocab: (id: string) => void;
  onEditVocab: (id: string, updates: Partial<Vocabulary>) => void;
  onAddGrammar: (grammar: Omit<Grammar, 'id' | 'createdAt' | 'lastReviewed' | 'uid'>) => void;
  onUpdateGrammarTag: (id: string, tag: VocabTag) => void;
  onDeleteGrammar: (id: string) => void;
  onEditGrammar: (id: string, updates: Partial<Grammar>) => void;
  apiKey?: string;
  apiBaseUrl?: string;
  apiModelName?: string;
}

export function StudyCenter({
  vocabList,
  grammarList,
  initialFilter,
  onAddVocab,
  onUpdateVocabTag,
  onDeleteVocab,
  onEditVocab,
  onAddGrammar,
  onUpdateGrammarTag,
  onDeleteGrammar,
  onEditGrammar,
  apiKey,
  apiBaseUrl,
  apiModelName
}: StudyCenterProps) {
  const [activeTab, setActiveTab] = useState<'vocab' | 'grammar'>(initialFilter?.type || 'vocab');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<VocabTag | 'all'>(initialFilter?.tag || 'all');
  
  const [editingVocab, setEditingVocab] = useState<Vocabulary | null>(null);
  const [editingGrammar, setEditingGrammar] = useState<Grammar | null>(null);

  const [isAddingVocab, setIsAddingVocab] = useState(false);
  const [isAddingGrammar, setIsAddingGrammar] = useState(false);
  const [newVocab, setNewVocab] = useState<Partial<Vocabulary>>({ word: '', reading: '', pitchAccent: '', meaning: '', notes: '', tag: 'learning', sourceUrl: '' });
  const [newGrammar, setNewGrammar] = useState<Partial<Grammar>>({ pattern: '', meaning: '', example: '', notes: '', tag: 'learning', sourceUrl: '' });
  
  const [isLookingUp, setIsLookingUp] = useState(false);

  const handleVocabAILookup = async (word: string, isEditing = false) => {
    if (!word.trim() || isLookingUp) return;
    
    setIsLookingUp(true);
    try {
      const response = await fetch('/api/vocab-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, apiKey, apiBaseUrl, apiModelName })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'AI Lookup failed');
      }
      const data = await response.json();
      
      if (isEditing && editingVocab) {
        setEditingVocab({
          ...editingVocab,
          reading: data.reading || editingVocab.reading,
          pitchAccent: data.pitchAccent || editingVocab.pitchAccent,
          meaning: data.meaning || editingVocab.meaning,
          notes: data.notes || editingVocab.notes
        });
      } else {
        setNewVocab({
          ...newVocab,
          reading: data.reading || newVocab.reading,
          pitchAccent: data.pitchAccent || newVocab.pitchAccent,
          meaning: data.meaning || newVocab.meaning,
          notes: data.notes || newVocab.notes
        });
      }
    } catch (error: any) {
      console.error("AI Lookup failed:", error);
      alert(error.message || 'AI Lookup failed');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleGrammarAILookup = async (pattern: string, isEditing = false) => {
    if (!pattern.trim() || isLookingUp) return;
    
    setIsLookingUp(true);
    try {
      const response = await fetch('/api/grammar-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pattern, apiKey, apiBaseUrl, apiModelName })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'AI Lookup failed');
      }
      const data = await response.json();

      if (isEditing && editingGrammar) {
        setEditingGrammar({
          ...editingGrammar,
          meaning: data.meaning || editingGrammar.meaning,
          example: data.example || editingGrammar.example,
          notes: data.notes || editingGrammar.notes
        });
      } else {
        setNewGrammar({
          ...newGrammar,
          meaning: data.meaning || newGrammar.meaning,
          example: data.example || newGrammar.example,
          notes: data.notes || newGrammar.notes
        });
      }
    } catch (error: any) {
      console.error("AI Lookup failed:", error);
      alert(error.message || 'AI Lookup failed');
    } finally {
      setIsLookingUp(false);
    }
  };
  
  const [selectedVocab, setSelectedVocab] = useState<Vocabulary | null>(null);
  const [selectedGrammar, setSelectedGrammar] = useState<Grammar | null>(null);

  const [deleteVocabId, setDeleteVocabId] = useState<string | null>(null);
  const [deleteGrammarId, setDeleteGrammarId] = useState<string | null>(null);

  const filteredVocab = vocabList.filter(v => 
    (filterTag === 'all' || v.tag === filterTag) &&
    (v.word.includes(searchQuery) || 
    v.reading.includes(searchQuery) || 
    v.meaning.includes(searchQuery))
  );

  const filteredGrammar = grammarList.filter(g => 
    (filterTag === 'all' || g.tag === filterTag) &&
    (g.pattern.includes(searchQuery) || 
    g.meaning.includes(searchQuery))
  );

  const handleSaveVocab = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingVocab) {
      onEditVocab(editingVocab.id, {
        word: editingVocab.word,
        reading: editingVocab.reading,
        pitchAccent: editingVocab.pitchAccent,
        meaning: editingVocab.meaning,
        notes: editingVocab.notes,
        sourceUrl: editingVocab.sourceUrl,
      });
      setEditingVocab(null);
    }
  };

  const handleSaveGrammar = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGrammar) {
      onEditGrammar(editingGrammar.id, {
        pattern: editingGrammar.pattern,
        meaning: editingGrammar.meaning,
        example: editingGrammar.example,
        notes: editingGrammar.notes,
        sourceUrl: editingGrammar.sourceUrl,
      });
      setEditingGrammar(null);
    }
  };

  const handleAddVocabSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newVocab.word && newVocab.reading && newVocab.meaning) {
      onAddVocab({
        word: newVocab.word,
        reading: newVocab.reading,
        pitchAccent: newVocab.pitchAccent || '',
        meaning: newVocab.meaning,
        notes: newVocab.notes,
        tag: newVocab.tag as VocabTag || 'learning',
        sourceUrl: newVocab.sourceUrl || '',
      });
      setIsAddingVocab(false);
      setNewVocab({ word: '', reading: '', pitchAccent: '', meaning: '', notes: '', tag: 'learning', sourceUrl: '' });
    }
  };

  const handleAddGrammarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGrammar.pattern && newGrammar.meaning) {
      onAddGrammar({
        pattern: newGrammar.pattern,
        meaning: newGrammar.meaning,
        example: newGrammar.example || '',
        notes: newGrammar.notes,
        tag: newGrammar.tag as VocabTag || 'learning',
        sourceUrl: newGrammar.sourceUrl || '',
      });
      setIsAddingGrammar(false);
      setNewGrammar({ pattern: '', meaning: '', example: '', notes: '', tag: 'learning', sourceUrl: '' });
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border-4 border-sky-100 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-sky-50 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-b-2 border-sky-100">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-sky-100">
            <button
              onClick={() => { setActiveTab('vocab'); setFilterTag('all'); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors ${
                activeTab === 'vocab' ? 'bg-sky-100 text-sky-700' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <BookOpen size={18} /> 词汇库 ({vocabList.length})
            </button>
            <button
              onClick={() => { setActiveTab('grammar'); setFilterTag('all'); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors ${
                activeTab === 'grammar' ? 'bg-sky-100 text-sky-700' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Library size={18} /> 语法库 ({grammarList.length})
            </button>
          </div>
          <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-sky-100 overflow-x-auto">
            <button
              onClick={() => setFilterTag('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
                filterTag === 'all' ? 'bg-sky-500 text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setFilterTag('learning')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
                filterTag === 'learning' ? 'bg-rose-500 text-white' : 'text-rose-500 hover:bg-rose-50'
              }`}
            >
              完全没学会
            </button>
            <button
              onClick={() => setFilterTag('review')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
                filterTag === 'review' ? 'bg-amber-500 text-white' : 'text-amber-500 hover:bg-amber-50'
              }`}
            >
              需要复习
            </button>
            <button
              onClick={() => setFilterTag('mastered')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
                filterTag === 'mastered' ? 'bg-emerald-500 text-white' : 'text-emerald-500 hover:bg-emerald-50'
              }`}
            >
              完全学会
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="搜索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border-2 border-sky-100 focus:border-sky-300 focus:outline-none transition-colors"
            />
          </div>
          <button
            onClick={() => activeTab === 'vocab' ? setIsAddingVocab(true) : setIsAddingGrammar(true)}
            className="bg-sky-500 hover:bg-sky-600 text-white p-2 rounded-xl shadow-sm transition-colors flex-shrink-0"
            title={activeTab === 'vocab' ? "添加词汇" : "添加语法"}
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 bg-gray-50/50">
        {activeTab === 'vocab' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVocab.map(vocab => (
              <div 
                key={vocab.id} 
                className="bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-sm hover:border-sky-200 transition-colors group cursor-pointer"
                onClick={() => setSelectedVocab(vocab)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-xl font-black text-gray-800">{vocab.word}</h3>
                    <p className="text-sm text-sky-600 font-medium">{vocab.reading}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setEditingVocab(vocab)} className="p-1.5 text-gray-400 hover:text-sky-500 hover:bg-sky-50 rounded-lg">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => setDeleteVocabId(vocab.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-gray-600 mb-3 whitespace-pre-wrap">{vocab.meaning}</p>
                {vocab.notes && (
                  <div className="bg-amber-50 p-2 rounded-lg text-sm text-amber-800 mb-3 border border-amber-100 whitespace-pre-wrap">
                    <span className="font-bold">笔记：</span>{vocab.notes}
                  </div>
                )}
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span className={`px-2 py-1 rounded-md font-bold ${
                    vocab.tag === 'mastered' ? 'bg-emerald-100 text-emerald-700' :
                    vocab.tag === 'learning' ? 'bg-amber-100 text-amber-700' :
                    'bg-rose-100 text-rose-700'
                  }`}>
                    {vocab.tag === 'mastered' ? '已掌握' : vocab.tag === 'learning' ? '学习中' : '需复习'}
                  </span>
                  <span>添加于 {format(vocab.createdAt, 'MM-dd')}</span>
                </div>
              </div>
            ))}
            {filteredVocab.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400">
                没有找到匹配的词汇
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGrammar.map(grammar => (
              <div 
                key={grammar.id} 
                className="bg-white p-5 rounded-2xl border-2 border-gray-100 shadow-sm hover:border-sky-200 transition-colors group cursor-pointer"
                onClick={() => setSelectedGrammar(grammar)}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-black text-sky-700">{grammar.pattern}</h3>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setEditingGrammar(grammar)} className="p-1.5 text-gray-400 hover:text-sky-500 hover:bg-sky-50 rounded-lg">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => setDeleteGrammarId(grammar.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-gray-700 font-medium mb-3 whitespace-pre-wrap">{grammar.meaning}</p>
                <div className="bg-gray-50 p-3 rounded-xl text-gray-600 text-sm mb-3 whitespace-pre-wrap">
                  {grammar.example}
                </div>
                {grammar.notes && (
                  <div className="bg-amber-50 p-3 rounded-xl text-sm text-amber-800 border border-amber-100 mb-3 whitespace-pre-wrap">
                    <span className="font-bold block mb-1">笔记：</span>
                    {grammar.notes}
                  </div>
                )}
                <div className="flex justify-between items-center text-xs text-gray-400 mt-auto pt-2 border-t border-gray-50">
                  <span className={`px-2 py-1 rounded-md font-bold ${
                    grammar.tag === 'mastered' ? 'bg-emerald-100 text-emerald-700' :
                    grammar.tag === 'learning' ? 'bg-amber-100 text-amber-700' :
                    'bg-rose-100 text-rose-700'
                  }`}>
                    {grammar.tag === 'mastered' ? '已掌握' : grammar.tag === 'learning' ? '学习中' : '需复习'}
                  </span>
                  <span>添加于 {format(grammar.createdAt, 'MM-dd')}</span>
                </div>
              </div>
            ))}
            {filteredGrammar.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400">
                没有找到匹配的语法
              </div>
            )}
          </div>
        )}
      </div>

      {selectedVocab && (
        <VocabDetailModal 
          vocab={selectedVocab} 
          onClose={() => setSelectedVocab(null)} 
        />
      )}

      {selectedGrammar && (
        <GrammarDetailModal 
          grammar={selectedGrammar} 
          onClose={() => setSelectedGrammar(null)} 
        />
      )}

      {/* Add Vocab Modal */}
      {isAddingVocab && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-sky-50 px-6 py-4 flex justify-between items-center border-b border-sky-100">
              <h3 className="font-bold text-sky-800">添加词汇</h3>
              <button onClick={() => setIsAddingVocab(false)} className="text-sky-400 hover:text-sky-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddVocabSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">单词</label>
                <div className="relative">
                  <input
                    type="text"
                    value={newVocab.word}
                    onChange={e => setNewVocab({...newVocab, word: e.target.value})}
                    className="w-full border-2 border-gray-200 rounded-xl p-2 focus:border-sky-400 focus:outline-none pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleVocabAILookup(newVocab.word || '')}
                    disabled={!newVocab.word?.trim() || isLookingUp}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-sky-500 hover:bg-sky-100 rounded-lg transition-colors disabled:opacity-50"
                    title="AI 智能补全"
                  >
                    {isLookingUp ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">读音 (假名)</label>
                  <input
                    type="text"
                    value={newVocab.reading}
                    onChange={e => setNewVocab({...newVocab, reading: e.target.value})}
                    className="w-full border-2 border-gray-200 rounded-xl p-2 focus:border-sky-400 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">声调</label>
                  <input
                    type="text"
                    value={newVocab.pitchAccent}
                    onChange={e => setNewVocab({...newVocab, pitchAccent: e.target.value})}
                    className="w-full border-2 border-gray-200 rounded-xl p-2 focus:border-sky-400 focus:outline-none"
                    placeholder="如: 0, 1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">含义</label>
                <textarea
                  value={newVocab.meaning}
                  onChange={e => setNewVocab({...newVocab, meaning: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-xl p-2 focus:border-sky-400 focus:outline-none resize-none h-20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">个人笔记</label>
                <textarea
                  value={newVocab.notes || ''}
                  onChange={e => setNewVocab({...newVocab, notes: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-xl p-2 focus:border-sky-400 focus:outline-none min-h-[80px]"
                  placeholder="添加一些记忆技巧或例句..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">来源链接</label>
                <input
                  type="url"
                  value={newVocab.sourceUrl}
                  onChange={e => setNewVocab({...newVocab, sourceUrl: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-xl p-2 focus:border-sky-400 focus:outline-none"
                  placeholder="e.g. YouTube URL"
                />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddingVocab(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-xl font-medium">取消</button>
                <button type="submit" className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold flex items-center gap-2">
                  <Plus size={18} /> 添加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Grammar Modal */}
      {isAddingGrammar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-sky-50 px-6 py-4 flex justify-between items-center border-b border-sky-100">
              <h3 className="font-bold text-sky-800">添加语法</h3>
              <button onClick={() => setIsAddingGrammar(false)} className="text-sky-400 hover:text-sky-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddGrammarSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">语法句型</label>
                <div className="relative">
                  <input
                    type="text"
                    value={newGrammar.pattern}
                    onChange={e => setNewGrammar({...newGrammar, pattern: e.target.value})}
                    className="w-full border-2 border-gray-200 rounded-xl p-2 focus:border-sky-400 focus:outline-none pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleGrammarAILookup(newGrammar.pattern || '')}
                    disabled={!newGrammar.pattern?.trim() || isLookingUp}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-sky-500 hover:bg-sky-100 rounded-lg transition-colors disabled:opacity-50"
                    title="AI 智能补全"
                  >
                    {isLookingUp ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">含义</label>
                <textarea
                  value={newGrammar.meaning}
                  onChange={e => setNewGrammar({...newGrammar, meaning: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-xl p-2 focus:border-sky-400 focus:outline-none resize-none h-20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">例句</label>
                <textarea
                  value={newGrammar.example}
                  onChange={e => setNewGrammar({...newGrammar, example: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-xl p-2 focus:border-sky-400 focus:outline-none min-h-[80px]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">个人笔记</label>
                <textarea
                  value={newGrammar.notes || ''}
                  onChange={e => setNewGrammar({...newGrammar, notes: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-xl p-2 focus:border-sky-400 focus:outline-none min-h-[80px]"
                  placeholder="添加一些使用注意点..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">来源链接</label>
                <input
                  type="url"
                  value={newGrammar.sourceUrl}
                  onChange={e => setNewGrammar({...newGrammar, sourceUrl: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-xl p-2 focus:border-sky-400 focus:outline-none"
                  placeholder="e.g. YouTube URL"
                />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddingGrammar(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-xl font-medium">取消</button>
                <button type="submit" className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold flex items-center gap-2">
                  <Plus size={18} /> 添加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Vocab Modal */}
      {editingVocab && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-sky-50 px-6 py-4 flex justify-between items-center border-b border-sky-100">
              <h3 className="font-bold text-sky-800">编辑词汇</h3>
              <button onClick={() => setEditingVocab(null)} className="text-sky-400 hover:text-sky-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveVocab} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">单词</label>
                <div className="relative">
                  <input
                    type="text"
                    value={editingVocab.word}
                    onChange={e => setEditingVocab({...editingVocab, word: e.target.value})}
                    className="w-full border-2 border-gray-200 rounded-xl p-2 focus:border-sky-400 focus:outline-none pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleVocabAILookup(editingVocab.word, true)}
                    disabled={!editingVocab.word.trim() || isLookingUp}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-sky-500 hover:bg-sky-100 rounded-lg transition-colors disabled:opacity-50"
                    title="AI 智能补全"
                  >
                    {isLookingUp ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">读音 (假名)</label>
                  <input
                    type="text"
                    value={editingVocab.reading}
                    onChange={e => setEditingVocab({...editingVocab, reading: e.target.value})}
                    className="w-full border-2 border-gray-200 rounded-xl p-2 focus:border-sky-400 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">声调</label>
                  <input
                    type="text"
                    value={editingVocab.pitchAccent || ''}
                    onChange={e => setEditingVocab({...editingVocab, pitchAccent: e.target.value})}
                    className="w-full border-2 border-gray-200 rounded-xl p-2 focus:border-sky-400 focus:outline-none"
                    placeholder="如: 0, 1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">含义</label>
                <textarea
                  value={editingVocab.meaning}
                  onChange={e => setEditingVocab({...editingVocab, meaning: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-xl p-2 focus:border-sky-400 focus:outline-none resize-none h-20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">个人笔记</label>
                <textarea
                  value={editingVocab.notes || ''}
                  onChange={e => setEditingVocab({...editingVocab, notes: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-xl p-2 focus:border-sky-400 focus:outline-none min-h-[80px]"
                  placeholder="添加一些记忆技巧或例句..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">来源链接</label>
                <input
                  type="url"
                  value={editingVocab.sourceUrl || ''}
                  onChange={e => setEditingVocab({...editingVocab, sourceUrl: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-xl p-2 focus:border-sky-400 focus:outline-none"
                  placeholder="e.g. YouTube URL"
                />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setEditingVocab(null)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-xl font-medium">取消</button>
                <button type="submit" className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold flex items-center gap-2">
                  <Save size={18} /> 保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Grammar Modal */}
      {editingGrammar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-sky-50 px-6 py-4 flex justify-between items-center border-b border-sky-100">
              <h3 className="font-bold text-sky-800">编辑语法</h3>
              <button onClick={() => setEditingGrammar(null)} className="text-sky-400 hover:text-sky-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveGrammar} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">语法句型</label>
                <div className="relative">
                  <input
                    type="text"
                    value={editingGrammar.pattern}
                    onChange={e => setEditingGrammar({...editingGrammar, pattern: e.target.value})}
                    className="w-full border-2 border-gray-200 rounded-xl p-2 focus:border-sky-400 focus:outline-none pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleGrammarAILookup(editingGrammar.pattern, true)}
                    disabled={!editingGrammar.pattern.trim() || isLookingUp}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-sky-500 hover:bg-sky-100 rounded-lg transition-colors disabled:opacity-50"
                    title="AI 智能补全"
                  >
                    {isLookingUp ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">含义</label>
                <textarea
                  value={editingGrammar.meaning}
                  onChange={e => setEditingGrammar({...editingGrammar, meaning: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-xl p-2 focus:border-sky-400 focus:outline-none resize-none h-20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">例句</label>
                <textarea
                  value={editingGrammar.example}
                  onChange={e => setEditingGrammar({...editingGrammar, example: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-xl p-2 focus:border-sky-400 focus:outline-none min-h-[80px]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">个人笔记</label>
                <textarea
                  value={editingGrammar.notes || ''}
                  onChange={e => setEditingGrammar({...editingGrammar, notes: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-xl p-2 focus:border-sky-400 focus:outline-none min-h-[80px]"
                  placeholder="添加一些使用注意点..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">来源链接</label>
                <input
                  type="url"
                  value={editingGrammar.sourceUrl || ''}
                  onChange={e => setEditingGrammar({...editingGrammar, sourceUrl: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-xl p-2 focus:border-sky-400 focus:outline-none"
                  placeholder="e.g. YouTube URL"
                />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setEditingGrammar(null)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-xl font-medium">取消</button>
                <button type="submit" className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold flex items-center gap-2">
                  <Save size={18} /> 保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteVocabId}
        onCancel={() => setDeleteVocabId(null)}
        onConfirm={() => {
          if (deleteVocabId) {
            onDeleteVocab(deleteVocabId);
            setDeleteVocabId(null);
          }
        }}
        title="删除词汇"
        message="确定要删除这个词汇吗？此操作无法撤销。"
      />

      <ConfirmModal
        isOpen={!!deleteGrammarId}
        onCancel={() => setDeleteGrammarId(null)}
        onConfirm={() => {
          if (deleteGrammarId) {
            onDeleteGrammar(deleteGrammarId);
            setDeleteGrammarId(null);
          }
        }}
        title="删除语法"
        message="确定要删除这个语法吗？此操作无法撤销。"
      />
    </div>
  );
}
