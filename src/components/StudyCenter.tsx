import React, { useState } from 'react';
import { Vocabulary, Grammar, VocabTag } from '../types';
import { BookOpen, Library, Search, Edit2, Trash2, Plus, X, Save } from 'lucide-react';
import { format } from 'date-fns';

interface StudyCenterProps {
  vocabList: Vocabulary[];
  grammarList: Grammar[];
  onAddVocab: (vocab: Omit<Vocabulary, 'id' | 'createdAt' | 'lastReviewed' | 'uid'>) => void;
  onUpdateVocabTag: (id: string, tag: VocabTag) => void;
  onDeleteVocab: (id: string) => void;
  onEditVocab: (id: string, updates: Partial<Vocabulary>) => void;
  onAddGrammar: (grammar: Omit<Grammar, 'id' | 'createdAt' | 'uid'>) => void;
  onDeleteGrammar: (id: string) => void;
  onEditGrammar: (id: string, updates: Partial<Grammar>) => void;
}

export function StudyCenter({
  vocabList,
  grammarList,
  onAddVocab,
  onUpdateVocabTag,
  onDeleteVocab,
  onEditVocab,
  onAddGrammar,
  onDeleteGrammar,
  onEditGrammar
}: StudyCenterProps) {
  const [activeTab, setActiveTab] = useState<'vocab' | 'grammar'>('vocab');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [editingVocab, setEditingVocab] = useState<Vocabulary | null>(null);
  const [editingGrammar, setEditingGrammar] = useState<Grammar | null>(null);

  const filteredVocab = vocabList.filter(v => 
    v.word.includes(searchQuery) || 
    v.reading.includes(searchQuery) || 
    v.meaning.includes(searchQuery)
  );

  const filteredGrammar = grammarList.filter(g => 
    g.pattern.includes(searchQuery) || 
    g.meaning.includes(searchQuery)
  );

  const handleSaveVocab = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingVocab) {
      onEditVocab(editingVocab.id, {
        word: editingVocab.word,
        reading: editingVocab.reading,
        meaning: editingVocab.meaning,
        notes: editingVocab.notes,
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
      });
      setEditingGrammar(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border-4 border-sky-100 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-sky-50 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-b-2 border-sky-100">
        <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-sky-100">
          <button
            onClick={() => setActiveTab('vocab')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors ${
              activeTab === 'vocab' ? 'bg-sky-100 text-sky-700' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <BookOpen size={18} /> 词汇库 ({vocabList.length})
          </button>
          <button
            onClick={() => setActiveTab('grammar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors ${
              activeTab === 'grammar' ? 'bg-sky-100 text-sky-700' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Library size={18} /> 语法库 ({grammarList.length})
          </button>
        </div>

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
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 bg-gray-50/50">
        {activeTab === 'vocab' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVocab.map(vocab => (
              <div key={vocab.id} className="bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-sm hover:border-sky-200 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-xl font-black text-gray-800">{vocab.word}</h3>
                    <p className="text-sm text-sky-600 font-medium">{vocab.reading}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingVocab(vocab)} className="p-1.5 text-gray-400 hover:text-sky-500 hover:bg-sky-50 rounded-lg">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => onDeleteVocab(vocab.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-gray-600 mb-3">{vocab.meaning}</p>
                {vocab.notes && (
                  <div className="bg-amber-50 p-2 rounded-lg text-sm text-amber-800 mb-3 border border-amber-100">
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
              <div key={grammar.id} className="bg-white p-5 rounded-2xl border-2 border-gray-100 shadow-sm hover:border-sky-200 transition-colors group">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-black text-sky-700">{grammar.pattern}</h3>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingGrammar(grammar)} className="p-1.5 text-gray-400 hover:text-sky-500 hover:bg-sky-50 rounded-lg">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => onDeleteGrammar(grammar.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-gray-700 font-medium mb-3">{grammar.meaning}</p>
                <div className="bg-gray-50 p-3 rounded-xl text-gray-600 text-sm mb-3">
                  {grammar.example}
                </div>
                {grammar.notes && (
                  <div className="bg-amber-50 p-3 rounded-xl text-sm text-amber-800 border border-amber-100">
                    <span className="font-bold block mb-1">笔记：</span>
                    {grammar.notes}
                  </div>
                )}
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
            <form onSubmit={handleSaveVocab} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">单词</label>
                <input
                  type="text"
                  value={editingVocab.word}
                  onChange={e => setEditingVocab({...editingVocab, word: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-xl p-2 focus:border-sky-400 focus:outline-none"
                  required
                />
              </div>
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
                <label className="block text-sm font-bold text-gray-700 mb-1">含义</label>
                <input
                  type="text"
                  value={editingVocab.meaning}
                  onChange={e => setEditingVocab({...editingVocab, meaning: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-xl p-2 focus:border-sky-400 focus:outline-none"
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
            <form onSubmit={handleSaveGrammar} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">语法句型</label>
                <input
                  type="text"
                  value={editingGrammar.pattern}
                  onChange={e => setEditingGrammar({...editingGrammar, pattern: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-xl p-2 focus:border-sky-400 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">含义</label>
                <input
                  type="text"
                  value={editingGrammar.meaning}
                  onChange={e => setEditingGrammar({...editingGrammar, meaning: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-xl p-2 focus:border-sky-400 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">例句</label>
                <textarea
                  value={editingGrammar.example}
                  onChange={e => setEditingGrammar({...editingGrammar, example: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-xl p-2 focus:border-sky-400 focus:outline-none min-h-[80px]"
                  required
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
    </div>
  );
}
