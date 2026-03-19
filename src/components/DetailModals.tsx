import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { Vocabulary, Grammar } from '../types';
import { format } from 'date-fns';

interface VocabDetailModalProps {
  vocab: Vocabulary;
  onClose: () => void;
}

export function VocabDetailModal({ vocab, onClose }: VocabDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-xl w-full md:w-fit md:min-w-[600px] max-w-[90vw] overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
          <h2 className="text-xl font-bold text-gray-800">词汇详情</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          <div>
            <div className="text-sm text-gray-500 font-medium mb-1 flex items-center gap-2 flex-wrap">
              <span>{vocab.reading}</span>
              {vocab.pitchAccent && (
                <span className="px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded text-xs font-bold border border-orange-200">
                  {vocab.pitchAccent}
                </span>
              )}
            </div>
            <div className="text-3xl font-black text-gray-800 break-words leading-tight">{vocab.word}</div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-400 mb-2">释义</h3>
            <div className="text-gray-700 whitespace-pre-wrap">{vocab.meaning}</div>
          </div>

          {vocab.notes && (
            <div>
              <h3 className="text-sm font-bold text-gray-400 mb-2">笔记</h3>
              <div className="bg-amber-50 p-4 rounded-xl text-amber-900 whitespace-pre-wrap border border-amber-100">
                {vocab.notes}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center text-xs text-gray-400 pt-4 border-t border-gray-50">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-md font-bold ${
                vocab.tag === 'mastered' ? 'bg-emerald-100 text-emerald-700' :
                vocab.tag === 'learning' ? 'bg-amber-100 text-amber-700' :
                'bg-rose-100 text-rose-700'
              }`}>
                {vocab.tag === 'mastered' ? '已掌握' : vocab.tag === 'learning' ? '学习中' : '需复习'}
              </span>
              {vocab.sourceUrl && (
                <a
                  href={vocab.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-600 bg-blue-50 px-2 py-1 rounded-md transition-colors"
                >
                  <ExternalLink size={12} />
                  来源
                </a>
              )}
            </div>
            <span>添加于 {format(vocab.createdAt, 'yyyy-MM-dd')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface GrammarDetailModalProps {
  grammar: Grammar;
  onClose: () => void;
}

export function GrammarDetailModal({ grammar, onClose }: GrammarDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-xl w-full md:w-fit md:min-w-[600px] max-w-[90vw] overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
          <h2 className="text-xl font-bold text-gray-800">语法详情</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          <div>
            <div className="text-3xl font-black text-sky-700 break-words leading-tight">{grammar.pattern}</div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-400 mb-2">释义</h3>
            <div className="text-gray-700 whitespace-pre-wrap">{grammar.meaning}</div>
          </div>

          {grammar.example && (
            <div>
              <h3 className="text-sm font-bold text-gray-400 mb-2">例句</h3>
              <div className="bg-sky-50 p-4 rounded-xl text-sky-900 whitespace-pre-wrap border border-sky-100">
                {grammar.example}
              </div>
            </div>
          )}

          {grammar.notes && (
            <div>
              <h3 className="text-sm font-bold text-gray-400 mb-2">笔记</h3>
              <div className="bg-amber-50 p-4 rounded-xl text-amber-900 whitespace-pre-wrap border border-amber-100">
                {grammar.notes}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center text-xs text-gray-400 pt-4 border-t border-gray-50">
            <span className={`px-2 py-1 rounded-md font-bold ${
              grammar.tag === 'mastered' ? 'bg-emerald-100 text-emerald-700' :
              grammar.tag === 'learning' ? 'bg-amber-100 text-amber-700' :
              'bg-rose-100 text-rose-700'
            }`}>
              {grammar.tag === 'mastered' ? '已掌握' : grammar.tag === 'learning' ? '学习中' : '需复习'}
            </span>
            <span>添加于 {format(grammar.createdAt, 'yyyy-MM-dd')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
