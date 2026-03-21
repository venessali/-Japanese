import React, { useState, useEffect } from 'react';
import { GojuonChart } from './components/GojuonChart';
import { VocabKanban } from './components/VocabKanban';
import { GrammarSection } from './components/GrammarSection';
import { Dashboard } from './components/Dashboard';
import { StudyCenter } from './components/StudyCenter';
import { AIQuiz } from './components/AIQuiz';
import { DictionaryPopup } from './components/DictionaryPopup';
import { LoginScreen } from './components/LoginScreen';
import { SettingsModal } from './components/SettingsModal';
import { Vocabulary, Grammar, VocabTag, LearningLog } from './types';
import { format } from 'date-fns';
import { Trees, Sun, BookOpen, LayoutDashboard, BrainCircuit, Home, LogOut, Settings, Gamepad2, Bot } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { db } from './firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

import { LearningCalendar } from './components/LearningCalendar';
import { VocabMatch } from './components/VocabMatch';
import { AIChatPanel } from './components/AIChatPanel';

export default function App() {
  const { user, profile, logout } = useAuth();
  const [vocabList, setVocabList] = useState<Vocabulary[]>([]);
  const [grammarList, setGrammarList] = useState<Grammar[]>([]);
  const [logs, setLogs] = useState<LearningLog[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'dashboard' | 'study' | 'quiz' | 'match'>('home');
  const [showSettings, setShowSettings] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [studyFilter, setStudyFilter] = useState<{type: 'vocab' | 'grammar', tag: VocabTag | 'all'}>({type: 'vocab', tag: 'all'});

  // Sync data from Firestore when user logs in
  useEffect(() => {
    if (!user) {
      setVocabList([]);
      setGrammarList([]);
      setLogs([]);
      return;
    }

    const vocabRef = collection(db, 'users', user.uid, 'vocab');
    const grammarRef = collection(db, 'users', user.uid, 'grammar');
    const logsRef = collection(db, 'users', user.uid, 'logs');

    const unsubVocab = onSnapshot(query(vocabRef, orderBy('createdAt', 'desc')), (snapshot) => {
      setVocabList(snapshot.docs.map(doc => doc.data() as Vocabulary));
    });

    const unsubGrammar = onSnapshot(query(grammarRef, orderBy('createdAt', 'desc')), (snapshot) => {
      setGrammarList(snapshot.docs.map(doc => doc.data() as Grammar));
    });

    const unsubLogs = onSnapshot(query(logsRef, orderBy('date', 'desc')), (snapshot) => {
      setLogs(snapshot.docs.map(doc => doc.data() as LearningLog));
    });

    return () => {
      unsubVocab();
      unsubGrammar();
      unsubLogs();
    };
  }, [user]);

  // Helper to update daily logs in Firestore
  const updateDailyLog = async (type: 'vocab' | 'grammar' | 'quiz') => {
    if (!user) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    const logRef = doc(db, 'users', user.uid, 'logs', today);
    
    // We use the current state to calculate the new values, but in a real app
    // we should use a transaction or increment to avoid race conditions.
    // For simplicity, we'll just update based on current state.
    const existingLog = logs.find(l => l.date === today);
    const newLog: LearningLog = existingLog ? { ...existingLog } : {
      date: today,
      vocabLearned: 0,
      grammarLearned: 0,
      quizzesTaken: 0,
      uid: user.uid
    };

    if (type === 'vocab') newLog.vocabLearned += 1;
    if (type === 'grammar') newLog.grammarLearned += 1;
    if (type === 'quiz') newLog.quizzesTaken += 1;

    await setDoc(logRef, newLog);
  };

  const handleAddVocab = async (vocab: Omit<Vocabulary, 'id' | 'createdAt' | 'lastReviewed' | 'uid'>) => {
    if (!user) return;
    const id = crypto.randomUUID();
    const newVocab: Vocabulary = {
      ...vocab,
      id,
      createdAt: Date.now(),
      lastReviewed: Date.now(),
      uid: user.uid
    };
    await setDoc(doc(db, 'users', user.uid, 'vocab', id), newVocab);
    updateDailyLog('vocab');
  };

  const handleUpdateVocabTag = async (id: string, tag: VocabTag) => {
    if (!user) return;
    const vocab = vocabList.find(v => v.id === id);
    if (vocab) {
      await setDoc(doc(db, 'users', user.uid, 'vocab', id), { ...vocab, tag, lastReviewed: Date.now() }, { merge: true });
    }
  };

  const handleDeleteVocab = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'vocab', id));
  };

  const handleAddGrammar = async (grammar: Omit<Grammar, 'id' | 'createdAt' | 'uid' | 'lastReviewed'>) => {
    if (!user) return;
    const id = crypto.randomUUID();
    const newGrammar: Grammar = {
      ...grammar,
      id,
      createdAt: Date.now(),
      lastReviewed: Date.now(),
      uid: user.uid
    };
    await setDoc(doc(db, 'users', user.uid, 'grammar', id), newGrammar);
    updateDailyLog('grammar');
  };

  const handleUpdateGrammarTag = async (id: string, tag: VocabTag) => {
    if (!user) return;
    const grammar = grammarList.find(g => g.id === id);
    if (grammar) {
      await setDoc(doc(db, 'users', user.uid, 'grammar', id), { ...grammar, tag, lastReviewed: Date.now() }, { merge: true });
    }
  };

  const handleDeleteGrammar = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'grammar', id));
  };

  const handleEditVocab = async (id: string, updates: Partial<Vocabulary>) => {
    if (!user) return;
    const vocab = vocabList.find(v => v.id === id);
    if (vocab) {
      await setDoc(doc(db, 'users', user.uid, 'vocab', id), { ...vocab, ...updates, lastReviewed: Date.now() }, { merge: true });
    }
  };

  const handleEditGrammar = async (id: string, updates: Partial<Grammar>) => {
    if (!user) return;
    const grammar = grammarList.find(g => g.id === id);
    if (grammar) {
      await setDoc(doc(db, 'users', user.uid, 'grammar', id), { ...grammar, ...updates }, { merge: true });
    }
  };

  const handleImportData = async (data: { vocabList: Vocabulary[], grammarList: Grammar[], logs: LearningLog[] }) => {
    if (!user) return;
    // For simplicity, we'll just add the imported data to Firestore
    // Note: This might cause duplicates if the user imports the same file multiple times
    for (const vocab of data.vocabList) {
      await setDoc(doc(db, 'users', user.uid, 'vocab', vocab.id), { ...vocab, uid: user.uid });
    }
    for (const grammar of data.grammarList) {
      await setDoc(doc(db, 'users', user.uid, 'grammar', grammar.id), { ...grammar, uid: user.uid });
    }
    for (const log of data.logs) {
      await setDoc(doc(db, 'users', user.uid, 'logs', log.date), { ...log, uid: user.uid });
    }
  };

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-orange-50/50 font-sans text-gray-800 selection:bg-orange-200 selection:text-orange-900">
      <DictionaryPopup apiKey={profile?.deepseekApiKey} apiBaseUrl={profile?.deepseekBaseUrl} apiModelName={profile?.apiModelName} />
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      
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
            <button 
              onClick={() => setActiveTab('match')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${activeTab === 'match' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-50 hover:text-indigo-500'}`}
            >
              <Gamepad2 size={18} /> 词汇配对
            </button>
            
            <button 
              onClick={() => setIsAIChatOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl transition-colors hover:bg-indigo-50 hover:text-indigo-600 text-indigo-500 font-bold"
              title="AI 助教"
            >
              <Bot size={18} />
              <span className="hidden sm:inline">AI 助教</span>
            </button>
            <div className="h-6 w-px bg-gray-200 mx-2"></div>
            
            <button 
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl transition-colors hover:bg-gray-50 hover:text-gray-700"
              title="设置 API Key"
            >
              <Settings size={18} />
            </button>
            <button 
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl transition-colors hover:bg-red-50 hover:text-red-500"
              title="退出登录"
            >
              <LogOut size={18} />
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
                  onViewAll={() => setActiveTab('study')}
                  onTagClick={(tag) => {
                    setStudyFilter({ type: 'vocab', tag });
                    setActiveTab('study');
                  }}
                  apiKey={profile?.deepseekApiKey}
                  apiBaseUrl={profile?.deepseekBaseUrl}
                  apiModelName={profile?.apiModelName}
                />
              </div>
              <div className="lg:col-span-5 h-[500px]">
                <GrammarSection
                  grammarList={grammarList}
                  onAddGrammar={handleAddGrammar}
                  onDeleteGrammar={handleDeleteGrammar}
                  onUpdateTag={handleUpdateGrammarTag}
                  onViewAll={() => setActiveTab('study')}
                  onTagClick={(tag) => {
                    setStudyFilter({ type: 'grammar', tag });
                    setActiveTab('study');
                  }}
                  apiKey={profile?.deepseekApiKey}
                  apiBaseUrl={profile?.deepseekBaseUrl}
                  apiModelName={profile?.apiModelName}
                />
              </div>
              <div className="lg:col-span-6 h-[450px]">
                <AIQuiz vocabList={vocabList} grammarList={grammarList} apiKey={profile?.deepseekApiKey} apiBaseUrl={profile?.deepseekBaseUrl} apiModelName={profile?.apiModelName} />
              </div>
              <div className="lg:col-span-6 h-[450px]">
                <VocabMatch 
                  vocabList={vocabList} 
                  onUpdateVocabTag={handleUpdateVocabTag} 
                />
              </div>
              <div className="lg:col-span-4 h-[300px]">
                <LearningCalendar logs={logs} />
              </div>
              <div className="lg:col-span-8 h-[300px]">
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
          <div className="h-[calc(100vh-12rem)] animate-in fade-in slide-in-from-bottom-4 duration-500">
            <StudyCenter
              vocabList={vocabList}
              grammarList={grammarList}
              initialFilter={studyFilter}
              onAddVocab={handleAddVocab}
              onUpdateVocabTag={handleUpdateVocabTag}
              onDeleteVocab={handleDeleteVocab}
              onEditVocab={handleEditVocab}
              onAddGrammar={handleAddGrammar}
              onUpdateGrammarTag={handleUpdateGrammarTag}
              onDeleteGrammar={handleDeleteGrammar}
              onEditGrammar={handleEditGrammar}
              apiKey={profile?.deepseekApiKey}
              apiBaseUrl={profile?.deepseekBaseUrl}
              apiModelName={profile?.apiModelName}
            />
          </div>
        )}

        {activeTab === 'quiz' && (
          <div className="h-[calc(100vh-12rem)] max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <AIQuiz vocabList={vocabList} grammarList={grammarList} apiKey={profile?.deepseekApiKey} apiBaseUrl={profile?.deepseekBaseUrl} />
          </div>
        )}

        {activeTab === 'match' && (
          <div className="h-[calc(100vh-12rem)] max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <VocabMatch 
              vocabList={vocabList} 
              onUpdateVocabTag={handleUpdateVocabTag} 
            />
          </div>
        )}
      </main>

      <AIChatPanel 
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        vocabList={vocabList}
        grammarList={grammarList}
        onAddVocab={handleAddVocab}
        onAddGrammar={handleAddGrammar}
        apiKey={profile?.deepseekApiKey}
        apiBaseUrl={profile?.deepseekBaseUrl}
        apiModelName={profile?.apiModelName}
      />
      
      <footer className="bg-white border-t-4 border-orange-100 py-8 mt-12 text-center text-gray-400 font-medium text-sm">
        <p>划词即可使用 AI 词典查询哦！(๑•̀ㅂ•́)و✧</p>
        <p className="mt-2">Built with React & Gemini AI</p>
      </footer>
    </div>
  );
}
