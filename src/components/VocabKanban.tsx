import React, { useState } from 'react';
import { Vocabulary, VocabTag } from '../types';
import { Plus, CheckCircle2, Clock, XCircle, ExternalLink, Trash2, Wand2, Loader2 } from 'lucide-react';
import { VocabDetailModal } from './DetailModals';
import { ConfirmModal } from './ConfirmModal';

interface VocabKanbanProps {
  vocabList: Vocabulary[];
  onAddVocab: (vocab: Omit<Vocabulary, 'id' | 'createdAt' | 'lastReviewed'>) => void;
  onUpdateTag: (id: string, tag: VocabTag) => void;
  onDeleteVocab: (id: string) => void;
  onViewAll?: () => void;
  onTagClick?: (tag: VocabTag) => void;
}

const TAG_CONFIG = {
  mastered: { label: '完全学会', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  review: { label: '需要复习', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
  learning: { label: '完全没学会', icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-200' },
};

export function VocabKanban({ vocabList, onAddVocab, onUpdateTag, onDeleteVocab, onViewAll, onTagClick }: VocabKanbanProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newReading, setNewReading] = useState('');
  const [newPitchAccent, setNewPitchAccent] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newSource, setNewSource] = useState('');
  const [selectedVocab, setSelectedVocab] = useState<Vocabulary | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const handleAILookup = async () => {
    const wordToLookup = newWord.trim();
    if (!wordToLookup || isLookingUp) return;
    
    setIsLookingUp(true);
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `请为日语单词 "${wordToLookup}" 提供详细解释。
          要求：
          1. 必须使用中文回答。
          2. 返回 JSON 格式。
          3. 字段说明：
             - reading: 单词的假名读音。
             - pitchAccent: 单词的声调（如 0, 1, 2 等）。
             - meaning: 单词的中文意思。
             - notes: 包含一个简短的日语例句及其对应的中文翻译。
          4. 严禁在任何字段中包含 "AI生成"、"根据查询" 等类似字样，直接输出内容。` }] }],
          responseMimeType: 'application/json'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'AI Lookup failed');
      }

      const result = await response.json();
      const data = JSON.parse(result.text);
      if (data.reading) setNewReading(data.reading);
      if (data.pitchAccent) setNewPitchAccent(data.pitchAccent);
      if (data.meaning) setNewMeaning(data.meaning);
      if (data.notes) setNewNotes(data.notes);
    } catch (error) {
      console.error("AI Lookup failed:", error);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord || !newMeaning) return;
    onAddVocab({
      word: newWord,
      reading: newReading,
      pitchAccent: newPitchAccent,
      meaning: newMeaning,
      tag: 'learning',
      sourceUrl: newSource,
      notes: newNotes,
    });
    setNewWord('');
    setNewReading('');
    setNewPitchAccent('');
    setNewMeaning('');
    setNewSource('');
    setNewNotes('');
    setIsAdding(false);
  };

  const renderColumn = (tag: VocabTag) => {
    const items = vocabList.filter((v) => v.tag === tag);
    const config = TAG_CONFIG[tag];
    const Icon = config.icon;

    return (
      <div className={`flex-1 min-w-[160px] rounded-3xl p-3 border-4 ${config.border} ${config.bg} flex flex-col h-full`}>
        <div 
          className={`flex items-center gap-2 mb-4 px-2 ${onTagClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
          onClick={() => onTagClick && onTagClick(tag)}
        >
          <Icon className={config.color} size={20} />
          <h3 className={`font-bold text-base ${config.color}`}>{config.label}</h3>
          <span className="ml-auto bg-white px-2 py-0.5 rounded-full text-xs font-bold text-gray-500 shadow-sm">
            {items.length}
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
          {items.map((vocab) => (
            <div 
              key={vocab.id} 
              className="bg-white p-3 rounded-2xl shadow-sm border-2 border-transparent hover:border-gray-100 transition-all group relative flex flex-col cursor-pointer"
              onClick={() => setSelectedVocab(vocab)}
            >
              <div className="mb-1">
                <div className="text-xs text-gray-400 font-medium mb-1 flex items-center gap-1 flex-wrap">
                  <span>{vocab.reading}</span>
                  {vocab.pitchAccent && (
                    <span className="px-1 py-0.5 bg-orange-100 text-orange-600 rounded text-[10px] font-bold border border-orange-200">
                      {vocab.pitchAccent}
                    </span>
                  )}
                </div>
                <div className="text-xl font-bold text-gray-800 break-words leading-tight">{vocab.word}</div>
              </div>
              <div className="text-gray-600 text-sm mb-2 whitespace-pre-wrap">{vocab.meaning}</div>
              
              <div className="mt-auto pt-2 border-t border-gray-50 flex items-center justify-between" onClick={e => e.stopPropagation()}>
                {vocab.sourceUrl ? (
                  <a
                    href={vocab.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded"
                  >
                    <ExternalLink size={10} />
                    来源
                  </a>
                ) : <div />}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <select
                    value={vocab.tag}
                    onChange={(e) => onUpdateTag(vocab.id, e.target.value as VocabTag)}
                    className="text-[10px] bg-gray-50 border border-gray-200 rounded px-1 py-0.5 outline-none text-gray-600 cursor-pointer"
                  >
                    <option value="learning">没学会</option>
                    <option value="review">需复习</option>
                    <option value="mastered">已学会</option>
                  </select>
                  <button onClick={() => setDeleteId(vocab.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-center text-gray-400 text-sm py-8 border-2 border-dashed border-gray-200 rounded-2xl">
              空空如也 ~
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border-4 border-sky-100 p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-sky-600">词汇看板</span>
          <span className="text-sm text-sky-400 font-medium bg-sky-50 px-2 py-1 rounded-full">Vocabulary</span>
        </div>
        <div className="flex items-center gap-2">
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-sky-500 hover:bg-sky-50 px-3 py-2 rounded-xl text-sm font-bold transition-colors"
            >
              查看全部
            </button>
          )}
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="bg-sky-500 hover:bg-sky-600 text-white p-2 rounded-xl shadow-sm transition-colors"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="mb-6 bg-sky-50 p-4 rounded-2xl border-2 border-sky-200 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="单词 (e.g. 食べる)"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                className="px-3 py-2 rounded-xl border-2 border-white focus:border-sky-300 outline-none w-full pr-10"
                required
              />
              <button
                type="button"
                onClick={handleAILookup}
                disabled={!newWord.trim() || isLookingUp}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-sky-500 hover:bg-sky-100 rounded-lg transition-colors disabled:opacity-50"
                title="AI 智能补全"
              >
                {isLookingUp ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
              </button>
            </div>
            <input
              type="text"
              placeholder="读音 (e.g. たべる)"
              value={newReading}
              onChange={(e) => setNewReading(e.target.value)}
              className="px-3 py-2 rounded-xl border-2 border-white focus:border-sky-300 outline-none w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="声调 (如: 0, 1, 平板)"
              value={newPitchAccent}
              onChange={(e) => setNewPitchAccent(e.target.value)}
              className="px-3 py-2 rounded-xl border-2 border-white focus:border-sky-300 outline-none w-full"
            />
            <input
              type="text"
              placeholder="意思 (e.g. 吃)"
              value={newMeaning}
              onChange={(e) => setNewMeaning(e.target.value)}
              className="px-3 py-2 rounded-xl border-2 border-white focus:border-sky-300 outline-none w-full"
              required
            />
          </div>
          <textarea
            placeholder="相关笔记 (可选)"
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            className="px-3 py-2 rounded-xl border-2 border-white focus:border-sky-300 outline-none w-full resize-none h-20"
          />
          <input
            type="url"
            placeholder="来源链接 (可选, e.g. YouTube URL)"
            value={newSource}
            onChange={(e) => setNewSource(e.target.value)}
            className="px-3 py-2 rounded-xl border-2 border-white focus:border-sky-300 outline-none w-full text-sm"
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
              className="px-4 py-2 bg-sky-500 text-white rounded-xl hover:bg-sky-600 transition-colors font-medium shadow-sm"
            >
              添加词汇
            </button>
          </div>
        </form>
      )}

      <div className="flex gap-4 overflow-x-auto pb-2 flex-1 min-h-0">
        {renderColumn('learning')}
        {renderColumn('review')}
        {renderColumn('mastered')}
      </div>

      {selectedVocab && (
        <VocabDetailModal 
          vocab={selectedVocab} 
          onClose={() => setSelectedVocab(null)} 
        />
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            onDeleteVocab(deleteId);
            setDeleteId(null);
          }
        }}
        title="删除词汇"
        message="确定要删除这个词汇吗？此操作无法撤销。"
      />
    </div>
  );
}
