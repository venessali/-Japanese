import React, { useState, useEffect, useMemo } from 'react';
import { Vocabulary, VocabTag } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, CheckCircle2, XCircle, Trophy } from 'lucide-react';

interface VocabMatchProps {
  vocabList: Vocabulary[];
  onUpdateVocabTag: (id: string, tag: VocabTag) => void;
}

interface Card {
  id: string;
  vocabId: string;
  text: string;
  type: 'word' | 'meaning';
  isMatched: boolean;
  isError: boolean;
  isSelected: boolean;
}

const BATCH_SIZE = 5;

export function VocabMatch({ vocabList, onUpdateVocabTag }: VocabMatchProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [mistakes, setMistakes] = useState<Set<string>>(new Set());

  // SRS Selection Logic
  const selectBatch = () => {
    const now = Date.now();
    
    // 1. Prioritize 'learning' and 'review'
    const learning = vocabList.filter(v => v.tag === 'learning');
    const review = vocabList.filter(v => v.tag === 'review');
    
    // 2. Bring back 'mastered' words that haven't been reviewed recently (e.g., > 3 days)
    const mastered = vocabList.filter(v => {
      if (v.tag !== 'mastered') return false;
      const daysSinceReview = (now - v.lastReviewed) / (1000 * 60 * 60 * 24);
      return daysSinceReview > 3; // Ebbinghaus return
    });

    // Mix them up
    let pool = [...learning, ...review];
    
    // Add some mastered words for review (up to 20% of the batch)
    if (mastered.length > 0) {
      const numMastered = Math.min(Math.ceil(BATCH_SIZE * 0.2), mastered.length);
      const shuffledMastered = [...mastered].sort(() => Math.random() - 0.5).slice(0, numMastered);
      pool = [...pool, ...shuffledMastered];
    }

    // If pool is still empty, just take any words
    if (pool.length === 0) {
      pool = [...vocabList];
    }

    // Shuffle and pick BATCH_SIZE
    const selectedVocab = [...pool].sort(() => Math.random() - 0.5).slice(0, BATCH_SIZE);

    // Create cards
    const newCards: Card[] = [];
    selectedVocab.forEach(v => {
      newCards.push({
        id: `${v.id}-word`,
        vocabId: v.id,
        text: v.word,
        type: 'word',
        isMatched: false,
        isError: false,
        isSelected: false,
      });
      newCards.push({
        id: `${v.id}-meaning`,
        vocabId: v.id,
        text: v.meaning,
        type: 'meaning',
        isMatched: false,
        isError: false,
        isSelected: false,
      });
    });

    // Shuffle cards
    setCards(newCards.sort(() => Math.random() - 0.5));
    setSelectedCards([]);
    setMistakes(new Set());
  };

  useEffect(() => {
    if (vocabList.length > 0 && cards.length === 0) {
      selectBatch();
    }
  }, [vocabList]);

  const handleCardClick = (card: Card) => {
    if (isProcessing || card.isMatched || card.isSelected) return;

    const newSelected = [...selectedCards, card];
    
    // Update card selection state visually
    setCards(cards.map(c => c.id === card.id ? { ...c, isSelected: true } : c));
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setIsProcessing(true);
      const [first, second] = newSelected;

      if (first.vocabId === second.vocabId && first.type !== second.type) {
        // Match!
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.vocabId === first.vocabId ? { ...c, isMatched: true, isSelected: false } : c
          ));
          setScore(s => s + 10 + combo * 2);
          setCombo(c => c + 1);
          setIsProcessing(false);
          setSelectedCards([]);

          // SRS Update: If matched correctly on first try, upgrade tag
          if (!mistakes.has(first.vocabId)) {
            const vocab = vocabList.find(v => v.id === first.vocabId);
            if (vocab) {
              if (vocab.tag === 'learning') onUpdateVocabTag(vocab.id, 'review');
              else if (vocab.tag === 'review') onUpdateVocabTag(vocab.id, 'mastered');
              else onUpdateVocabTag(vocab.id, 'mastered'); // Just update lastReviewed
            }
          }
        }, 500);
      } else {
        // Mismatch!
        setMistakes(prev => new Set(prev).add(first.vocabId).add(second.vocabId));
        
        // SRS Update: Downgrade to 'review' if mistaken
        const firstVocab = vocabList.find(v => v.id === first.vocabId);
        const secondVocab = vocabList.find(v => v.id === second.vocabId);
        if (firstVocab && firstVocab.tag === 'mastered') onUpdateVocabTag(firstVocab.id, 'review');
        if (secondVocab && secondVocab.tag === 'mastered') onUpdateVocabTag(secondVocab.id, 'review');

        setCards(prev => prev.map(c => 
          c.id === first.id || c.id === second.id ? { ...c, isError: true } : c
        ));
        setCombo(0);

        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.id === first.id || c.id === second.id ? { ...c, isError: false, isSelected: false } : c
          ));
          setIsProcessing(false);
          setSelectedCards([]);
        }, 800);
      }
    }
  };

  const isComplete = cards.length > 0 && cards.every(c => c.isMatched);

  if (vocabList.length < BATCH_SIZE) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border-4 border-indigo-100 p-8 text-center h-full flex flex-col items-center justify-center">
        <div className="bg-indigo-50 p-6 rounded-full mb-4">
          <Trophy className="text-indigo-300" size={48} />
        </div>
        <h2 className="text-2xl font-black text-indigo-800 mb-2">词汇量不足</h2>
        <p className="text-gray-500 font-medium">
          需要至少 {BATCH_SIZE} 个词汇才能开始配对游戏。<br/>
          快去添加更多词汇吧！
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border-4 border-indigo-100 p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-indigo-800 flex items-center gap-2">
            <RefreshCw className="text-indigo-500" />
            记忆配对
          </h2>
          <p className="text-sm font-bold text-indigo-400 mt-1">基于遗忘曲线的智能复习</p>
        </div>
        <div className="flex gap-4 text-right">
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">分数</div>
            <div className="text-xl font-black text-indigo-600">{score}</div>
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">连击</div>
            <div className="text-xl font-black text-orange-500">{combo} x</div>
          </div>
        </div>
      </div>

      <div className="flex-1 relative flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {isComplete ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-indigo-50/50 rounded-3xl border-2 border-dashed border-indigo-200"
            >
              <div className="bg-white p-6 rounded-full shadow-sm border-4 border-indigo-100 mb-6">
                <Trophy className="text-yellow-500" size={64} />
              </div>
              <h3 className="text-3xl font-black text-indigo-800 mb-2">太棒了！</h3>
              <p className="text-indigo-600 font-medium mb-8">你完成了这一组词汇的复习</p>
              <button
                onClick={selectBatch}
                className="px-8 py-4 bg-indigo-500 text-white rounded-2xl font-bold text-lg hover:bg-indigo-600 transition-all shadow-md hover:shadow-lg hover:-translate-y-1 active:translate-y-0 flex items-center gap-2"
              >
                <RefreshCw size={20} />
                下一组
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
            >
              {cards.map(card => (
                <motion.button
                  key={card.id}
                  layout
                  onClick={() => handleCardClick(card)}
                  disabled={card.isMatched || isComplete}
                  className={`
                    relative aspect-[4/3] rounded-2xl p-4 flex items-center justify-center text-center transition-all duration-300
                    ${card.isMatched ? 'opacity-0 pointer-events-none scale-90' : 'opacity-100 scale-100'}
                    ${card.isSelected ? 'bg-indigo-500 text-white shadow-md -translate-y-1' : 
                      card.isError ? 'bg-red-500 text-white shadow-md animate-shake' : 
                      'bg-white border-2 border-indigo-100 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 hover:-translate-y-1 shadow-sm'}
                  `}
                >
                  <span className={`font-bold ${card.type === 'word' ? 'text-lg' : 'text-sm'}`}>
                    {card.text}
                  </span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
