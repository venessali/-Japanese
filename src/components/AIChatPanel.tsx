import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquare, Send, GripHorizontal, Plus, Edit2, Check, Bot } from 'lucide-react';
import { Vocabulary, Grammar } from '../types';
import Markdown from 'react-markdown';

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  vocabList: Vocabulary[];
  grammarList: Grammar[];
  onAddVocab: (vocab: Omit<Vocabulary, 'id' | 'createdAt' | 'lastReviewed' | 'uid'>) => void;
  onAddGrammar: (grammar: Omit<Grammar, 'id' | 'createdAt' | 'lastReviewed' | 'uid'>) => void;
  apiKey?: string;
  apiBaseUrl?: string;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  tags?: string[];
  suggestedVocab?: Array<{ word: string; reading: string; meaning: string; notes: string }>;
  suggestedGrammar?: Array<{ pattern: string; meaning: string; example: string; notes: string }>;
}

export function AIChatPanel({ isOpen, onClose, vocabList, grammarList, onAddVocab, onAddGrammar, apiKey, apiBaseUrl }: AIChatPanelProps) {
  const [aiName, setAiName] = useState('AI 助教');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `你好！我是你的专属日语学习助手 **${aiName}**。你可以随时向我提问，或者开启“拖拽模式”将不懂的词句拖进来问我哦！`
    }
  ]);
  const [input, setInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isDragMode, setIsDragMode] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleDragOver = (e: React.DragEvent) => {
    if (!isDragMode) return;
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isDragMode) return;
    e.preventDefault();
    setIsDraggingOver(false);
    const text = e.dataTransfer.getData('text/plain');
    if (text && text.trim()) {
      setTags(prev => [...new Set([...prev, text.trim()])]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(t => t !== tagToRemove));
  };

  // AI Chat Handler
  const handleSend = async () => {
    if ((!input.trim() && tags.length === 0) || isLoading) return;

    const userMessageText = input.trim();
    const currentTags = [...tags];
    
    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: userMessageText,
      tags: currentTags.length > 0 ? currentTags : undefined
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setTags([]);
    setIsLoading(true);
    
    // Reset textarea height
    const textarea = document.querySelector('textarea[placeholder^="输入问题"]');
    if (textarea instanceof HTMLTextAreaElement) {
      textarea.style.height = 'auto';
    }

    try {
      let prompt = userMessageText;
      if (currentTags.length > 0) {
        prompt = `关于以下内容：[${currentTags.join(', ')}]\n${userMessageText}`;
      }

      const systemInstruction = `You are a helpful Japanese learning assistant named ${aiName}.
The user currently has ${vocabList.length} vocabulary words (${vocabList.filter(v => v.tag === 'mastered').length} mastered) and ${grammarList.length} grammar points (${grammarList.filter(g => g.tag === 'mastered').length} mastered).
Adjust the complexity of your explanations based on their level.
If the user asks about a specific word or grammar point, explain it clearly.
You can suggest related vocabulary or grammar points that the user might find useful.
Always return your response in the specified JSON format.
The 'reply' field should contain your main message in Markdown.
The 'suggestedVocab' and 'suggestedGrammar' fields should contain any new items you want to suggest adding to their study list.
JSON Schema:
{
  "reply": "string (markdown)",
  "suggestedVocab": [{"word": "string", "reading": "string", "meaning": "string", "notes": "string"}],
  "suggestedGrammar": [{"pattern": "string", "meaning": "string", "example": "string", "notes": "string"}]
}`;

      const chatHistory = messages.map(m => ({
        role: m.role === 'model' ? 'assistant' : 'user',
        content: m.text
      }));

      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatHistory, { role: 'user', content: prompt }],
          systemInstruction,
          apiKey,
          apiBaseUrl
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'AI Chat failed');
      }
      const parsed = await response.json();
      
      if (parsed) {
        const newModelMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: parsed.reply || '抱歉，我没有理解你的意思。',
          suggestedVocab: parsed.suggestedVocab,
          suggestedGrammar: parsed.suggestedGrammar
        };
        setMessages(prev => [...prev, newModelMessage]);
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: `抱歉，请求失败：${error.message || '网络似乎出了点问题，请稍后再试。'}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVocab = (vocab: any) => {
    onAddVocab({
      word: vocab.word,
      reading: vocab.reading || '',
      meaning: vocab.meaning,
      notes: `${vocab.notes || ''}\n(来源: ${aiName})`,
      tag: 'learning'
    });
  };

  const handleAddGrammar = (grammar: any) => {
    onAddGrammar({
      pattern: grammar.pattern,
      meaning: grammar.meaning,
      example: grammar.example || '',
      notes: `${grammar.notes || ''}\n(来源: ${aiName})`,
      tag: 'learning'
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-50 flex flex-col border-l border-gray-100"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-indigo-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Bot size={24} />
                </div>
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="px-2 py-1 border border-indigo-200 rounded-lg text-sm font-bold text-indigo-900 focus:outline-none focus:border-indigo-400 w-24"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (tempName.trim()) setAiName(tempName.trim());
                          setIsEditingName(false);
                        }
                      }}
                    />
                    <button 
                      onClick={() => {
                        if (tempName.trim()) setAiName(tempName.trim());
                        setIsEditingName(false);
                      }}
                      className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                    >
                      <Check size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <h2 className="font-bold text-indigo-900">{aiName}</h2>
                    <button 
                      onClick={() => {
                        setTempName(aiName);
                        setIsEditingName(true);
                      }}
                      className="p-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-indigo-600 transition-opacity rounded"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                )}
              </div>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/50">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-4 ${
                    msg.role === 'user' 
                      ? 'bg-indigo-500 text-white rounded-tr-sm shadow-sm' 
                      : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'
                  }`}>
                    {msg.tags && msg.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {msg.tags.map((tag, i) => (
                          <span key={i} className="px-2 py-1 bg-white/20 rounded-md text-xs font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-800 prose-pre:text-gray-100">
                      <Markdown>{msg.text}</Markdown>
                    </div>
                  </div>

                  {/* Suggestions */}
                  {msg.role === 'model' && ((msg.suggestedVocab && msg.suggestedVocab.length > 0) || (msg.suggestedGrammar && msg.suggestedGrammar.length > 0)) ? (
                    <div className="mt-3 w-full max-w-[85%] space-y-3">
                      {msg.suggestedVocab?.map((vocab, i) => (
                        <div key={`v-${i}`} className="bg-white border border-indigo-100 rounded-xl p-3 shadow-sm text-sm">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-bold text-indigo-900">{vocab.word}</div>
                              {vocab.reading && <div className="text-xs text-gray-500">{vocab.reading}</div>}
                            </div>
                            <button 
                              onClick={() => handleAddVocab(vocab)}
                              className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                              title="添加到词汇看板"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                          <div className="text-gray-700 mb-1">{vocab.meaning}</div>
                          {vocab.notes && <div className="text-xs text-gray-500 italic">{vocab.notes}</div>}
                        </div>
                      ))}
                      
                      {msg.suggestedGrammar?.map((grammar, i) => (
                        <div key={`g-${i}`} className="bg-white border border-emerald-100 rounded-xl p-3 shadow-sm text-sm">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-bold text-emerald-900">{grammar.pattern}</div>
                            <button 
                              onClick={() => handleAddGrammar(grammar)}
                              className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                              title="添加到语法笔记"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                          <div className="text-gray-700 mb-1">{grammar.meaning}</div>
                          {grammar.example && <div className="text-xs text-gray-600 bg-gray-50 p-1.5 rounded mt-1">{grammar.example}</div>}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start">
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm p-4 shadow-sm flex gap-1">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => setIsDragMode(!isDragMode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    isDragMode 
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  <GripHorizontal size={14} />
                  {isDragMode ? '拖拽模式已开启' : '开启拖拽模式'}
                </button>
              </div>

              <div 
                className={`relative rounded-2xl border-2 transition-colors ${
                  isDraggingOver 
                    ? 'border-indigo-400 bg-indigo-50' 
                    : isDragMode 
                      ? 'border-indigo-200 bg-white' 
                      : 'border-gray-200 bg-white'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {isDragMode && tags.length === 0 && !input && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-indigo-300 text-sm font-medium">选中页面文字拖拽到此处</span>
                  </div>
                )}

                <div className="p-2 flex flex-col gap-2">
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 px-1">
                      {tags.map((tag, i) => (
                        <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium border border-indigo-100">
                          {tag}
                          <button onClick={() => removeTag(tag)} className="hover:text-indigo-900">
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-end gap-2">
                    <textarea
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="输入问题，按 Cmd/Ctrl + Enter 发送..."
                      className="flex-1 max-h-32 min-h-[40px] p-2 bg-transparent resize-none focus:outline-none text-sm"
                      rows={1}
                      style={{ overflowY: 'auto' }}
                    />
                    <button
                      onClick={handleSend}
                      disabled={(!input.trim() && tags.length === 0) || isLoading}
                      className="p-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-1 mr-1"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
