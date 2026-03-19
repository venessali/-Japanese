import React, { useState, useEffect, useRef } from 'react';
import { Vocabulary, VocabTag } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Play, Star, PartyPopper, LayoutGrid, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface VocabMatchProps {
  vocabList: Vocabulary[];
  onUpdateVocabTag: (id: string, tag: VocabTag) => void;
}

type CardType = 'word' | 'reading' | 'meaning';

interface GameCard {
  id: string;
  vocabId: string;
  text: string;
  type: CardType;
}

interface FallingCard extends GameCard {
  left: number;
  delay: number;
  duration: number;
  isMatched: boolean;
  isFallen: boolean;
}

const BATCH_SIZE = 5;
const RAIN_DURATION = 30; // 30 seconds
const PASSING_SCORE = 30; // 3 matches
const SNACKS = ['🍰', '🧁', '🧋', '🍵', '🍡', '🍮', '🍬', '🍦', '🍩', '🍪', '🍓', '🍑'];

// Helper to check if a string contains Kanji
const hasKanji = (str: string) => {
  return /[\u4e00-\u9faf\u3400-\u4dbf]/.test(str);
};

// Helper to shuffle array
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export function VocabMatch({ vocabList, onUpdateVocabTag }: VocabMatchProps) {
  const [mode, setMode] = useState<'select' | 'normal' | 'rain'>('select');

  const selectBatch = () => {
    const now = Date.now();
    const learning = vocabList.filter(v => v.tag === 'learning');
    const review = vocabList.filter(v => v.tag === 'review');
    const mastered = vocabList.filter(v => {
      if (v.tag !== 'mastered') return false;
      const daysSinceReview = (now - v.lastReviewed) / (1000 * 60 * 60 * 24);
      return daysSinceReview > 3;
    });

    let pool = [...learning, ...review];
    if (mastered.length > 0) {
      const numMastered = Math.min(Math.ceil(BATCH_SIZE * 0.2), mastered.length);
      const shuffledMastered = shuffleArray(mastered).slice(0, numMastered);
      pool = [...pool, ...shuffledMastered];
    }
    if (pool.length === 0) {
      pool = [...vocabList];
    }

    return shuffleArray(pool).slice(0, BATCH_SIZE);
  };

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

  if (mode === 'select') {
    return (
      <div className="bg-white rounded-3xl shadow-sm border-4 border-indigo-100 p-8 h-full flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-50 to-transparent"></div>
        <h2 className="text-3xl font-black text-indigo-800 mb-8 z-10">选择游戏模式</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl z-10">
          <button
            onClick={() => setMode('normal')}
            className="group flex flex-col items-center p-8 bg-white border-4 border-indigo-100 rounded-3xl hover:border-indigo-400 hover:bg-indigo-50 transition-all shadow-sm hover:shadow-md"
          >
            <div className="bg-indigo-100 p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
              <LayoutGrid className="text-indigo-500" size={40} />
            </div>
            <h3 className="text-xl font-bold text-indigo-800 mb-2">静态连连看</h3>
            <p className="text-gray-500 text-center text-sm">经典的三栏配对模式，没有时间限制，适合安静复习。</p>
          </button>
          
          <button
            onClick={() => setMode('rain')}
            className="group flex flex-col items-center p-8 bg-white border-4 border-indigo-100 rounded-3xl hover:border-indigo-400 hover:bg-indigo-50 transition-all shadow-sm hover:shadow-md"
          >
            <div className="bg-indigo-100 p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
              <Star className="text-indigo-500" size={40} />
            </div>
            <h3 className="text-xl font-bold text-indigo-800 mb-2">词汇雨挑战</h3>
            <p className="text-gray-500 text-center text-sm">30秒限时挑战！接住掉落的词汇卡片，及格有零食奖励哦！</p>
          </button>
        </div>
      </div>
    );
  }

  return mode === 'normal' ? (
    <NormalMatch 
      vocabList={vocabList} 
      onUpdateVocabTag={onUpdateVocabTag} 
      onBack={() => setMode('select')}
      selectBatch={selectBatch}
    />
  ) : (
    <RainMatch 
      vocabList={vocabList} 
      onUpdateVocabTag={onUpdateVocabTag} 
      onBack={() => setMode('select')}
      selectBatch={selectBatch}
    />
  );
}

// --- Normal Mode Component ---
function NormalMatch({ vocabList, onUpdateVocabTag, onBack, selectBatch }: any) {
  const [batch, setBatch] = useState<Vocabulary[]>([]);
  const [words, setWords] = useState<GameCard[]>([]);
  const [readings, setReadings] = useState<GameCard[]>([]);
  const [meanings, setMeanings] = useState<GameCard[]>([]);
  
  const [selectedCards, setSelectedCards] = useState<GameCard[]>([]);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [errorCards, setErrorCards] = useState<string[]>([]);

  const loadBatch = () => {
    const selectedVocab = selectBatch();
    setBatch(selectedVocab);
    
    const w: GameCard[] = [];
    const r: GameCard[] = [];
    const m: GameCard[] = [];
    
    selectedVocab.forEach((v: Vocabulary) => {
      w.push({ id: `${v.id}-word`, vocabId: v.id, text: v.word, type: 'word' });
      if (hasKanji(v.word)) {
        r.push({ id: `${v.id}-reading`, vocabId: v.id, text: v.reading, type: 'reading' });
      }
      m.push({ id: `${v.id}-meaning`, vocabId: v.id, text: v.meaning, type: 'meaning' });
    });
    
    setWords(shuffleArray(w));
    setReadings(shuffleArray(r));
    setMeanings(shuffleArray(m));
    setSelectedCards([]);
    setMatchedIds([]);
    setErrorCards([]);
  };

  useEffect(() => {
    loadBatch();
  }, []);

  const handleCardClick = (card: GameCard) => {
    if (matchedIds.includes(card.vocabId) || errorCards.length > 0) return;

    if (selectedCards.find(c => c.id === card.id)) {
      setSelectedCards(prev => prev.filter(c => c.id !== card.id));
      return;
    }

    const newSelected = selectedCards.filter(c => c.type !== card.type).concat(card);
    
    // Determine required matches for the current selection
    // If any selected card belongs to a vocab with Kanji, we need 3 matches. Otherwise 2.
    const requiresReading = newSelected.some(c => {
      const vocab = batch.find(v => v.id === c.vocabId);
      return vocab && hasKanji(vocab.word);
    });
    
    const targetLength = requiresReading ? 3 : 2;

    if (newSelected.length === targetLength) {
      const vocabIds = new Set(newSelected.map(c => c.vocabId));
      if (vocabIds.size === 1) {
        // Match!
        const matchedVocabId = newSelected[0].vocabId;
        setMatchedIds(prev => [...prev, matchedVocabId]);
        setSelectedCards([]);
        
        const vocab = vocabList.find((v: any) => v.id === matchedVocabId);
        if (vocab) {
          if (vocab.tag === 'learning') onUpdateVocabTag(vocab.id, 'review');
          else if (vocab.tag === 'review') onUpdateVocabTag(vocab.id, 'mastered');
          else onUpdateVocabTag(vocab.id, 'mastered');
        }
      } else {
        // Mismatch
        setErrorCards(newSelected.map(c => c.id));
        setSelectedCards(newSelected);
        setTimeout(() => {
          setErrorCards([]);
          setSelectedCards([]);
        }, 600);
      }
    } else {
      setSelectedCards(newSelected);
    }
  };

  const isBatchComplete = matchedIds.length === batch.length && batch.length > 0;

  const renderCard = (card: GameCard) => {
    const isSelected = selectedCards.some(c => c.id === card.id);
    const isMatched = matchedIds.includes(card.vocabId);
    const isError = errorCards.includes(card.id);
    
    let bgColor = 'bg-white';
    let borderColor = 'border-gray-200';
    let textColor = 'text-gray-700';
    
    if (isMatched) {
      bgColor = 'bg-gray-50';
      borderColor = 'border-gray-100';
      textColor = 'text-gray-300';
    } else if (isSelected) {
      bgColor = card.type === 'word' ? 'bg-blue-500' : card.type === 'reading' ? 'bg-orange-500' : 'bg-emerald-500';
      borderColor = 'border-transparent';
      textColor = 'text-white';
    } else if (isError) {
      bgColor = 'bg-red-500';
      borderColor = 'border-red-600';
      textColor = 'text-white';
    } else {
      borderColor = card.type === 'word' ? 'border-blue-200' : card.type === 'reading' ? 'border-orange-200' : 'border-emerald-200';
      textColor = card.type === 'word' ? 'text-blue-800' : card.type === 'reading' ? 'text-orange-800' : 'text-emerald-800';
    }

    return (
      <button
        key={card.id}
        onClick={() => handleCardClick(card)}
        disabled={isMatched}
        className={`w-full p-3 rounded-xl border-2 font-bold transition-all text-center whitespace-pre-wrap ${bgColor} ${borderColor} ${textColor} ${isError ? 'animate-shake' : ''} ${!isMatched && !isSelected ? 'hover:-translate-y-1 hover:shadow-md' : ''}`}
      >
        {card.text}
      </button>
    );
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border-4 border-indigo-100 p-6 h-full flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-indigo-50">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-black text-indigo-800 flex items-center gap-2">
          <LayoutGrid className="text-indigo-500" size={24} />
          静态连连看
        </h2>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isBatchComplete ? (
          <div className="h-full flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
            <div className="bg-emerald-100 p-6 rounded-full mb-4">
              <CheckCircle2 className="text-emerald-500" size={48} />
            </div>
            <h3 className="text-2xl font-black text-emerald-800 mb-2">太棒了！</h3>
            <p className="text-emerald-600 font-medium mb-8">这一组词汇已经全部配对成功。</p>
            <button
              onClick={loadBatch}
              className="px-8 py-3 bg-emerald-500 text-white rounded-2xl font-bold text-lg hover:bg-emerald-600 transition-all shadow-md hover:shadow-lg hover:-translate-y-1 active:translate-y-0 flex items-center gap-2"
            >
              <RefreshCw size={20} />
              下一组
            </button>
          </div>
        ) : (
          <div className={`grid ${readings.length > 0 ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
            <div className="flex flex-col gap-3">
              <div className="text-center text-sm font-bold text-blue-400 mb-2 uppercase tracking-wider">单词</div>
              {words.map(renderCard)}
            </div>
            {readings.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="text-center text-sm font-bold text-orange-400 mb-2 uppercase tracking-wider">读音</div>
                {readings.map(renderCard)}
              </div>
            )}
            <div className="flex flex-col gap-3">
              <div className="text-center text-sm font-bold text-emerald-400 mb-2 uppercase tracking-wider">释义</div>
              {meanings.map(renderCard)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Rain Mode Component ---
function RainMatch({ vocabList, onUpdateVocabTag, onBack, selectBatch }: any) {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [cards, setCards] = useState<FallingCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<FallingCard[]>([]);
  const [errorCards, setErrorCards] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(RAIN_DURATION);
  const [reward, setReward] = useState<string | null>(null);
  const [currentBatch, setCurrentBatch] = useState<Vocabulary[]>([]);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const rainIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const spawnCards = () => {
    const batch = selectBatch();
    setCurrentBatch(batch);
    
    // Take only 2-3 words at a time to avoid clutter
    const numWordsToSpawn = 2 + Math.floor(Math.random() * 2);
    const wordsToSpawn = shuffleArray(batch).slice(0, numWordsToSpawn);
    
    const newCards: FallingCard[] = [];
    wordsToSpawn.forEach((v: Vocabulary) => {
      const baseDelay = Math.random() * 2;
      const duration = 12 + Math.random() * 8; // 12-20s fall time
      
      newCards.push({
        id: `${v.id}-word-${Date.now()}`,
        vocabId: v.id,
        text: v.word,
        type: 'word',
        left: 10 + Math.random() * 20, // 10-30%
        delay: baseDelay,
        duration: duration,
        isMatched: false,
        isFallen: false,
      });
      
      if (hasKanji(v.word)) {
        newCards.push({
          id: `${v.id}-reading-${Date.now()}`,
          vocabId: v.id,
          text: v.reading,
          type: 'reading',
          left: 40 + Math.random() * 20, // 40-60%
          delay: baseDelay + Math.random() * 1,
          duration: duration,
          isMatched: false,
          isFallen: false,
        });
      }
      
      newCards.push({
        id: `${v.id}-meaning-${Date.now()}`,
        vocabId: v.id,
        text: v.meaning,
        type: 'meaning',
        left: 70 + Math.random() * 20, // 70-90%
        delay: baseDelay + Math.random() * 1,
        duration: duration,
        isMatched: false,
        isFallen: false,
      });
    });
    
    setCards(prev => [...prev.filter(c => !c.isFallen && !c.isMatched), ...newCards]);
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(RAIN_DURATION);
    setReward(null);
    setCards([]);
    setSelectedCards([]);
    setErrorCards([]);
    setGameState('playing');
    
    spawnCards();
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          clearInterval(rainIntervalRef.current!);
          setGameState('gameover');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Spawn new cards every 8 seconds
    rainIntervalRef.current = setInterval(() => {
      spawnCards();
    }, 8000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (rainIntervalRef.current) clearInterval(rainIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (gameState === 'gameover' && score >= PASSING_SCORE) {
      setReward(SNACKS[Math.floor(Math.random() * SNACKS.length)]);
    }
  }, [gameState, score]);

  const handleCardClick = (card: FallingCard) => {
    if (card.isMatched || card.isFallen || errorCards.length > 0) return;

    if (selectedCards.find(c => c.id === card.id)) {
      setSelectedCards(prev => prev.filter(c => c.id !== card.id));
      return;
    }

    const newSelected = selectedCards.filter(c => c.type !== card.type).concat(card);
    
    // Determine required matches
    const requiresReading = newSelected.some(c => {
      const vocab = currentBatch.find(v => v.id === c.vocabId);
      return vocab && hasKanji(vocab.word);
    });
    
    const targetLength = requiresReading ? 3 : 2;

    if (newSelected.length === targetLength) {
      const vocabIds = new Set(newSelected.map(c => c.vocabId));
      if (vocabIds.size === 1) {
        // Match!
        const matchedVocabId = newSelected[0].vocabId;
        setCards(prev => prev.map(c => newSelected.find(s => s.id === c.id) ? { ...c, isMatched: true } : c));
        setScore(s => s + 10);
        setSelectedCards([]);
        
        const vocab = vocabList.find((v: any) => v.id === matchedVocabId);
        if (vocab) {
          if (vocab.tag === 'learning') onUpdateVocabTag(vocab.id, 'review');
          else if (vocab.tag === 'review') onUpdateVocabTag(vocab.id, 'mastered');
          else onUpdateVocabTag(vocab.id, 'mastered');
        }
      } else {
        // Mismatch
        setErrorCards(newSelected.map(c => c.id));
        setSelectedCards(newSelected);
        setTimeout(() => {
          setErrorCards([]);
          setSelectedCards([]);
        }, 600);
      }
    } else {
      setSelectedCards(newSelected);
    }
  };

  const handleFallen = (id: string) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, isFallen: true } : c));
    setSelectedCards(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border-4 border-indigo-100 p-6 h-full flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-center mb-4 z-10 relative bg-white/80 backdrop-blur-sm p-2 rounded-2xl">
        <button onClick={onBack} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-indigo-50">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-2xl font-black text-indigo-800 flex items-center gap-2">
            <Star className="text-indigo-500" />
            词汇雨挑战
          </h2>
          <p className="text-sm font-bold text-indigo-400 mt-1 text-center">30秒限时消除！</p>
        </div>
        <div className="text-right flex gap-4">
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">时间</div>
            <div className={`text-2xl font-black ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-indigo-600'}`}>{timeLeft}s</div>
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">分数</div>
            <div className="text-2xl font-black text-indigo-600">{score}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 relative bg-indigo-50/30 rounded-2xl border-2 border-dashed border-indigo-100 overflow-hidden">
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="bg-white p-6 rounded-full shadow-sm border-4 border-indigo-100 mb-6">
              <Play className="text-indigo-400 ml-1" size={48} />
            </div>
            <h3 className="text-xl font-bold text-indigo-800 mb-2">准备好迎接词汇雨了吗？</h3>
            <p className="text-indigo-500 mb-6">在卡片落地前，选出匹配的【单词】【读音】【释义】</p>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-indigo-500 text-white rounded-2xl font-bold text-lg hover:bg-indigo-600 transition-all shadow-md hover:shadow-lg hover:-translate-y-1 active:translate-y-0"
            >
              开始游戏
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <>
            {/* Active Cards */}
            {cards.map(card => {
              if (card.isMatched || card.isFallen) return null;
              
              const isSelected = selectedCards.some(c => c.id === card.id);
              const isError = errorCards.includes(card.id);
              
              let bgColor = 'bg-white';
              let borderColor = 'border-indigo-200';
              let textColor = 'text-gray-700';
              
              if (isSelected) {
                bgColor = card.type === 'word' ? 'bg-blue-500' : card.type === 'reading' ? 'bg-orange-500' : 'bg-emerald-500';
                borderColor = 'border-transparent';
                textColor = 'text-white';
              } else if (isError) {
                bgColor = 'bg-red-500';
                borderColor = 'border-red-600';
                textColor = 'text-white';
              } else {
                borderColor = card.type === 'word' ? 'border-blue-200' : card.type === 'reading' ? 'border-orange-200' : 'border-emerald-200';
                textColor = card.type === 'word' ? 'text-blue-800' : card.type === 'reading' ? 'text-orange-800' : 'text-emerald-800';
              }

              return (
                <motion.button
                  key={card.id}
                  initial={{ top: '-15%', left: `${card.left}%` }}
                  animate={{ top: '110%' }}
                  transition={{ duration: card.duration, delay: card.delay, ease: 'linear' }}
                  onAnimationComplete={() => handleFallen(card.id)}
                  onClick={() => handleCardClick(card)}
                  className={`absolute z-10 px-4 py-3 rounded-2xl border-2 shadow-sm font-bold cursor-pointer whitespace-pre-wrap max-w-[140px] text-center ${bgColor} ${borderColor} ${textColor} ${isError ? 'animate-shake' : ''}`}
                  style={{ transform: 'translateX(-50%)' }}
                >
                  <motion.div
                    animate={{ rotate: [-3, 3, -3] }}
                    transition={{ duration: 2 + Math.random(), repeat: Infinity, ease: 'easeInOut' }}
                  >
                    {card.text}
                  </motion.div>
                </motion.button>
              );
            })}
            
            {/* Selection Dock */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-lg border-2 border-indigo-100 flex gap-4 z-20">
              {['word', 'reading', 'meaning'].map(type => {
                const selected = selectedCards.find(c => c.type === type);
                const label = type === 'word' ? '单词' : type === 'reading' ? '读音' : '释义';
                const colorClass = type === 'word' ? 'text-blue-500' : type === 'reading' ? 'text-orange-500' : 'text-emerald-500';
                
                return (
                  <div key={type} className="flex flex-col items-center w-20">
                    <span className={`text-[10px] font-black uppercase tracking-wider mb-1 ${colorClass}`}>{label}</span>
                    <div className={`w-full h-10 rounded-xl border-2 flex items-center justify-center text-sm font-bold px-1 overflow-hidden ${selected ? 'bg-indigo-50 border-indigo-300 text-indigo-800' : 'border-dashed border-gray-200 text-gray-400'}`}>
                      {selected ? <span className="truncate">{selected.text}</span> : '?'}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <AnimatePresence>
          {gameState === 'gameover' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm z-30"
            >
              {score >= PASSING_SCORE ? (
                <>
                  <div className="text-6xl mb-4 animate-bounce">{reward}</div>
                  <h3 className="text-3xl font-black text-indigo-800 mb-2 flex items-center gap-2">
                    <PartyPopper className="text-yellow-500" />
                    及格啦！
                  </h3>
                  <p className="text-indigo-600 font-medium mb-2">得分: {score}</p>
                  <p className="text-gray-500 text-sm mb-8">奖励你一个电子零食，继续加油哦！</p>
                </>
              ) : (
                <>
                  <div className="bg-gray-100 p-6 rounded-full mb-4">
                    <Trophy className="text-gray-400" size={48} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-800 mb-2">时间到！</h3>
                  <p className="text-gray-600 font-medium mb-2">得分: {score}</p>
                  <p className="text-gray-400 text-sm mb-8">及格分数是 {PASSING_SCORE} 分，差一点点就拿到零食啦。</p>
                </>
              )}
              
              <button
                onClick={startGame}
                className="px-8 py-4 bg-indigo-500 text-white rounded-2xl font-bold text-lg hover:bg-indigo-600 transition-all shadow-md hover:shadow-lg hover:-translate-y-1 active:translate-y-0 flex items-center gap-2"
              >
                <RefreshCw size={20} />
                再来一局
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
