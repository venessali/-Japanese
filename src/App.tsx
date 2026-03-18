import React, { useState, useEffect } from 'react';
import { GojuonChart } from './components/GojuonChart';
import { VocabKanban } from './components/VocabKanban';
import { GrammarSection } from './components/GrammarSection';
import { Dashboard } from './components/Dashboard';
import { AIQuiz } from './components/AIQuiz';
import { DictionaryPopup } from './components/DictionaryPopup';
import { Vocabulary, Grammar, VocabTag, LearningLog } from './types';
import { format } from 'date-fns';
import { Trees, Sun, BookOpen, LayoutDashboard, BrainCircuit, Home } from 'lucide-react';

export default function App() {
  const [vocabList, setVocabList] = useState<Vocabulary[]>([]);
  const [grammarList, setGrammarList] = useState<Grammar[]>([]);
  const [logs, setLogs] = useState<LearningLog[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'dashboard' | 'study' | 'quiz'>('home');

  // Load data from localStorage on mount
  useEffect(() => {
    const savedVocab = localStorage.getItem('genki_vocab');
    const savedGrammar = localStorage.getItem('genki_grammar');
    const savedLogs = localStorage.getItem('genki_logs');

    if (savedVocab) setVocabList(JSON.parse(savedVocab));
    if (savedGrammar) setGrammarList(JSON.parse(savedGrammar));
    if (savedLogs) setLogs(JSON.parse(savedLogs));
  }, []);

  // Save data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('genki_vocab', JSON.stringify(vocabList));
  }, [vocabList]);

  useEffect(() => {
    localStorage.setItem('genki_grammar', JSON.stringify(grammarList));
  }, [grammarList]);

  useEffect(() => {
    localStorage.setItem('genki_logs', JSON.stringify(logs));
  }, [logs]);

  // Helper to update daily logs
  const updateDailyLog = (type: 'vocab' | 'grammar' | 'quiz') => {
    const today = format(new Date(), 'yyyy-MM-dd');
    setLogs(prev => {
      const existingLogIndex = prev.findIndex(log => log.date === today);
      if (existingLogIndex >= 0) {
        const newLogs = [...prev];
        if (type === 'vocab') newLogs[existingLogIndex].vocabLearned += 1;
        if (type === 'grammar') newLogs[existingLogIndex].grammarLearned += 1;
        if (type === 'quiz') newLogs[existingLogIndex].quizzesTaken += 1;
        return newLogs;
      } else {
        return [...prev, {
          date: today,
          vocabLearned: type === 'vocab' ? 1 : 0,
          grammarLearned: type === 'grammar' ? 1 : 0,
          quizzesTaken: type === 'quiz' ? 1 : 0,
        }];
      }
    });
  };

  const handleAddVocab = (vocab: Omit<Vocabulary, 'id' | 'createdAt' | 'lastReviewed'>) => {
    const newVocab: Vocabulary = {
      ...vocab,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      lastReviewed: Date.now(),
    };
    setVocabList(prev => [newVocab, ...prev]);
    updateDailyLog('vocab');
  };

  const handleUpdateVocabTag = (id: string, tag: VocabTag) => {
    setVocabList(prev => prev.map(v => v.id === id ? { ...v, tag, lastReviewed: Date.now() } : v));
  };

  const handleDeleteVocab = (id: string) => {
    setVocabList(prev => prev.filter(v => v.id !== id));
  };

  const handleAddGrammar = (grammar: Omit<Grammar, 'id' | 'createdAt'>) => {
    const newGrammar: Grammar = {
      ...grammar,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    setGrammarList(prev => [newGrammar, ...prev]);
    updateDailyLog('grammar');
  };

  const handleDeleteGrammar = (id: string) => {
    setGrammarList(prev => prev.filter(g => g.id !== id));
  };

  const handleImportData = (data: { vocabList: Vocabulary[], grammarList: Grammar[], logs: LearningLog[] }) => {
    setVocabList(data.vocabList);
    setGrammarList(data.grammarList);
    setLogs(data.logs);
  };

  return (
    <div className="min-h-screen bg-orange-50/50 font-sans text-gray-800 selection:bg-orange-200 selection:text-orange-900">
      <DictionaryPopup />
      
      <header className="bg-white border-b-4 border-orange-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="relative bg-emerald-500 text-white p-2 rounded-2xl shadow-sm transform -rotate-6">
              <Trees size={28} />
              <Sun size={16} className="absolute -top-2 -right-2 text-amber-400 fill-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-800 tracking-tight">木漏れ日</h1>
              <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Komorebi - 日语学习手帐</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm font-bold text-gray-500">
            <button 
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${activeTab === 'home' ? 'bg-emerald-50 text-emerald-600' : 'hover:bg-gray-50 hover:text-emerald-500'}`}
            >
              <Home size={18} /> 首页
            </button>
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${activeTab === 'dashboard' ? 'bg-pink-50 text-pink-600' : 'hover:bg-gray-50 hover:text-pink-500'}`}
            >
              <LayoutDashboard size={18} /> 数据中心
            </button>
            <button 
              onClick={() => setActiveTab('study')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${activeTab === 'study' ? 'bg-sky-50 text-sky-600' : 'hover:bg-gray-50 hover:text-sky-500'}`}
            >
              <BookOpen size={18} /> 词汇与语法
            </button>
            <button 
              onClick={() => setActiveTab('quiz')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${activeTab === 'quiz' ? 'bg-amber-50 text-amber-600' : 'hover:bg-gray-50 hover:text-amber-500'}`}
            >
              <BrainCircuit size={18} /> AI 测验
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'home' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <GojuonChart />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 h-[500px]">
                <VocabKanban
                  vocabList={vocabList}
                  onAddVocab={handleAddVocab}
                  onUpdateTag={handleUpdateVocabTag}
                  onDeleteVocab={handleDeleteVocab}
                />
              </div>
              <div className="lg:col-span-5 h-[500px]">
                <GrammarSection
                  grammarList={grammarList}
                  onAddGrammar={handleAddGrammar}
                  onDeleteGrammar={handleDeleteGrammar}
                />
              </div>
              <div className="lg:col-span-7 h-[450px]">
                <AIQuiz vocabList={vocabList} grammarList={grammarList} />
              </div>
              <div className="lg:col-span-5 h-[450px]">
                <Dashboard logs={logs} vocabList={vocabList} grammarList={grammarList} compact={true} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Dashboard logs={logs} vocabList={vocabList} grammarList={grammarList} onImportData={handleImportData} />
          </div>
        )}

        {activeTab === 'study' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-12rem)] animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="lg:col-span-7 h-full">
              <VocabKanban
                vocabList={vocabList}
                onAddVocab={handleAddVocab}
                onUpdateTag={handleUpdateVocabTag}
                onDeleteVocab={handleDeleteVocab}
              />
            </div>
            <div className="lg:col-span-5 h-full">
              <GrammarSection
                grammarList={grammarList}
                onAddGrammar={handleAddGrammar}
                onDeleteGrammar={handleDeleteGrammar}
              />
            </div>
          </div>
        )}

        {activeTab === 'quiz' && (
          <div className="h-[calc(100vh-12rem)] max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <AIQuiz vocabList={vocabList} grammarList={grammarList} />
          </div>
        )}
      </main>
      
      <footer className="bg-white border-t-4 border-orange-100 py-8 mt-12 text-center text-gray-400 font-medium text-sm">
        <p>划词即可使用 AI 词典查询哦！(๑•̀ㅂ•́)و✧</p>
        <p className="mt-2">Built with React & Gemini AI</p>
      </footer>
    </div>
  );
}
