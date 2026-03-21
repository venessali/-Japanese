import React, { useState } from 'react';
import { Grammar, VocabTag } from '../types';
import { Plus, BookOpen, ExternalLink, Trash2, CheckCircle2, Clock, XCircle, Wand2, Loader2 } from 'lucide-react';
import { GrammarDetailModal } from './DetailModals';
import { ConfirmModal } from './ConfirmModal';

interface GrammarSectionProps {
  grammarList: Grammar[];
  onAddGrammar: (grammar: Omit<Grammar, 'id' | 'createdAt' | 'lastReviewed' | 'uid'>) => void;
  onDeleteGrammar: (id: string) => void;
  onUpdateTag: (id: string, tag: VocabTag) => void;
  onViewAll?: () => void;
  onTagClick?: (tag: VocabTag) => void;
  apiKey?: string;
  apiBaseUrl?: string;
}

const TAG_CONFIG = {
  mastered: { label: '完全学会', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  review: { label: '需要复习', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
  learning: { label: '完全没学会', icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-200' },
};

export function GrammarSection({ grammarList, onAddGrammar, onDeleteGrammar, onUpdateTag, onViewAll, onTagClick, apiKey, apiBaseUrl }: GrammarSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newPattern, setNewPattern] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [newExample, setNewExample] = useState('');
  const [newSource, setNewSource] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [filterTag, setFilterTag] = useState<VocabTag | 'all'>('all');
  const [selectedGrammar, setSelectedGrammar] = useState<Grammar | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const handleAILookup = async () => {
    const patternToLookup = newPattern.trim();
    if (!patternToLookup || isLookingUp) return;
    
    setIsLookingUp(true);
    try {
      const response = await fetch('/api/grammar-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pattern: patternToLookup, apiKey, apiBaseUrl })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'AI Lookup failed');
      }

      const data = await response.json();
      if (data.meaning) setNewMeaning(data.meaning);
      if (data.example) setNewExample(data.example);
      if (data.notes) setNewNotes(data.notes);
    } catch (error: any) {
      console.error("AI Lookup failed:", error);
      alert(error.message || 'AI 补全失败，请检查网络或 API Key。');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPattern || !newMeaning) return;
    onAddGrammar({
      pattern: newPattern,
      meaning: newMeaning,
      example: newExample,
      sourceUrl: newSource,
      notes: newNotes,
      tag: 'learning',
    });
    setNewPattern('');
    setNewMeaning('');
    setNewExample('');
    setNewSource('');
    setNewNotes('');
    setIsAdding(false);
  };

  const filteredList = filterTag === 'all' ? grammarList : grammarList.filter(g => g.tag === filterTag);

  return (
    <div className="bg-white rounded-3xl shadow-sm border-4 border-lime-100 p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-lime-600">语法笔记</span>
          <span className="text-sm text-lime-500 font-medium bg-lime-50 px-2 py-1 rounded-full">Grammar</span>
        </div>
        <div className="flex items-center gap-2">
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-lime-500 hover:bg-lime-50 px-3 py-2 rounded-xl text-sm font-bold transition-colors"
            >
              查看全部
            </button>
          )}
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="bg-lime-500 hover:bg-lime-600 text-white p-2 rounded-xl shadow-sm transition-colors"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="mb-6 bg-lime-50 p-4 rounded-2xl border-2 border-lime-200 space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder="语法句型 (e.g. 〜てはいけません)"
              value={newPattern}
              onChange={(e) => setNewPattern(e.target.value)}
              className="px-3 py-2 rounded-xl border-2 border-white focus:border-lime-300 outline-none w-full font-bold text-lg pr-10"
              required
            />
            <button
              type="button"
              onClick={handleAILookup}
              disabled={!newPattern.trim() || isLookingUp}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-lime-500 hover:bg-lime-100 rounded-lg transition-colors disabled:opacity-50"
              title="AI 智能补全"
            >
              {isLookingUp ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
            </button>
          </div>
          <input
            type="text"
            placeholder="意思 (e.g. 不可以...)"
            value={newMeaning}
            onChange={(e) => setNewMeaning(e.target.value)}
            className="px-3 py-2 rounded-xl border-2 border-white focus:border-lime-300 outline-none w-full"
            required
          />
          <textarea
            placeholder="例句 (e.g. ここで写真を撮ってはいけません。)"
            value={newExample}
            onChange={(e) => setNewExample(e.target.value)}
            className="px-3 py-2 rounded-xl border-2 border-white focus:border-lime-300 outline-none w-full resize-none h-20"
          />
          <textarea
            placeholder="相关笔记 (可选)"
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            className="px-3 py-2 rounded-xl border-2 border-white focus:border-lime-300 outline-none w-full resize-none h-20"
          />
          <input
            type="url"
            placeholder="来源链接 (可选)"
            value={newSource}
            onChange={(e) => setNewSource(e.target.value)}
            className="px-3 py-2 rounded-xl border-2 border-white focus:border-lime-300 outline-none w-full text-sm"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-lime-500 text-white rounded-xl hover:bg-lime-600 transition-colors font-medium shadow-sm"
            >
              保存语法
            </button>
          </div>
        </form>
      )}

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 custom-scrollbar">
        <button
          onClick={() => setFilterTag('all')}
          className={`px-3 py-1.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${
            filterTag === 'all' ? 'bg-lime-500 text-white shadow-sm' : 'bg-lime-50 text-lime-600 hover:bg-lime-100'
          }`}
        >
          全部 ({grammarList.length})
        </button>
        {(Object.entries(TAG_CONFIG) as [VocabTag, typeof TAG_CONFIG[VocabTag]][]).map(([tag, config]) => {
          const count = grammarList.filter(g => g.tag === tag).length;
          return (
            <button
              key={tag}
              onClick={() => {
                setFilterTag(tag);
                if (onTagClick) onTagClick(tag);
              }}
              className={`px-3 py-1.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                filterTag === tag ? `${config.bg} ${config.color} border-2 ${config.border} shadow-sm` : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border-2 border-transparent'
              }`}
            >
              <config.icon size={14} />
              {config.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar min-h-0">
        {filteredList.map((grammar) => (
          <div 
            key={grammar.id} 
            className="bg-lime-50/50 p-5 rounded-2xl border-2 border-lime-100 hover:border-lime-300 transition-colors group relative cursor-pointer"
            onClick={() => setSelectedGrammar(grammar)}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="text-lime-500" size={20} />
                <h3 className="text-xl font-bold text-gray-800">{grammar.pattern}</h3>
              </div>
              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <select
                  value={grammar.tag || 'learning'}
                  onChange={(e) => onUpdateTag(grammar.id, e.target.value as VocabTag)}
                  className={`text-xs font-bold px-2 py-1 rounded-lg border-2 outline-none cursor-pointer appearance-none ${TAG_CONFIG[grammar.tag || 'learning'].bg} ${TAG_CONFIG[grammar.tag || 'learning'].color} ${TAG_CONFIG[grammar.tag || 'learning'].border}`}
                >
                  <option value="learning">完全没学会</option>
                  <option value="review">需要复习</option>
                  <option value="mastered">完全学会</option>
                </select>
                <button
                  onClick={() => setDeleteId(grammar.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <div className="text-gray-600 font-medium mb-3 pl-7 whitespace-pre-wrap">{grammar.meaning}</div>
            
            {grammar.example && (
              <div className="bg-white p-3 rounded-xl border border-lime-100 text-gray-700 text-sm mb-3 ml-7 shadow-sm whitespace-pre-wrap">
                <span className="text-lime-500 font-bold mr-2">例</span>
                {grammar.example}
              </div>
            )}

            {grammar.notes && (
              <div className="bg-lime-100/50 p-3 rounded-xl border border-lime-200 text-gray-700 text-sm mb-3 ml-7 shadow-sm whitespace-pre-wrap">
                <span className="text-lime-600 font-bold mr-2">笔记</span>
                {grammar.notes}
              </div>
            )}
            
            {grammar.sourceUrl && (
              <div className="ml-7" onClick={e => e.stopPropagation()}>
                <a
                  href={grammar.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 bg-blue-50 px-2 py-1 rounded-md"
                >
                  <ExternalLink size={12} />
                  参考资料
                </a>
              </div>
            )}
          </div>
        ))}
        
        {filteredList.length === 0 && !isAdding && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 border-2 border-dashed border-lime-200 rounded-3xl">
            <BookOpen size={48} className="text-lime-200 mb-4" />
            <p className="font-medium">还没有添加语法笔记哦</p>
            <p className="text-sm mt-1">点击右上角 + 号开始记录</p>
          </div>
        )}
      </div>

      {selectedGrammar && (
        <GrammarDetailModal 
          grammar={selectedGrammar} 
          onClose={() => setSelectedGrammar(null)} 
        />
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            onDeleteGrammar(deleteId);
            setDeleteId(null);
          }
        }}
        title="删除语法"
        message="确定要删除这个语法吗？此操作无法撤销。"
      />
    </div>
  );
}
