import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import { Vocabulary, Grammar } from '../types';
import { Sparkles, Loader2, PlayCircle, Settings2, Send } from 'lucide-react';

interface AIQuizProps {
  vocabList: Vocabulary[];
  grammarList: Grammar[];
  apiKey?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AIQuiz({ vocabList, grammarList, apiKey }: AIQuizProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateQuiz = async () => {
    if (vocabList.length === 0 && grammarList.length === 0) {
      setError('请先添加一些词汇或语法笔记，AI才能为你出题哦！');
      return;
    }

    setIsLoading(true);
    setError(null);
    setMessages([]);

    try {
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start',
          vocabList,
          grammarList,
          customPrompt,
          apiKey
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to generate quiz';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setMessages([{ role: 'assistant', content: data.text || '生成失败，请重试。' }]);
      setShowSettings(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || '生成测验时出错，请检查网络或 API Key。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'chat',
          messages: newMessages,
          customPrompt,
          apiKey
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to send message';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setMessages([...newMessages, { role: 'assistant', content: data.text || '请求失败，请重试。' }]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || '发送消息时出错，请检查网络或 API Key。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border-4 border-amber-100 p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-amber-600">AI 随堂测验</span>
          <span className="text-sm text-amber-500 font-medium bg-amber-50 px-2 py-1 rounded-full">AI Quiz</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-xl transition-colors ${showSettings ? 'bg-amber-100 text-amber-600' : 'text-amber-400 hover:bg-amber-50 hover:text-amber-500'}`}
            title="出题偏好设置"
          >
            <Settings2 size={20} />
          </button>
          <button
            onClick={generateQuiz}
            disabled={isLoading}
            className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white px-4 py-2 rounded-xl shadow-sm transition-colors flex items-center gap-2 font-bold"
          >
            {isLoading && messages.length === 0 ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
            {messages.length > 0 ? '重新出题' : '生成测验'}
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="mb-4 bg-amber-50 p-4 rounded-2xl border-2 border-amber-100 animate-in fade-in slide-in-from-top-2">
          <label className="block text-sm font-bold text-amber-700 mb-2">
            出题偏好 (可选)
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="例如：请出5道N4难度的选择题，侧重于助词的用法，并用中文解释答案..."
            className="w-full bg-white border-2 border-amber-200 rounded-xl p-3 text-sm text-gray-700 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all resize-none h-24"
          />
          <p className="text-xs text-amber-500 mt-2">
            * 默认会以活泼可爱的语气，根据你最近学习的词汇和语法出题。你可以在这里添加额外的要求。
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-2xl border-2 border-red-100 mb-4 font-medium">
          {error}
        </div>
      )}

      <div className="flex-1 bg-amber-50/30 rounded-2xl border-2 border-amber-100 p-4 overflow-y-auto custom-scrollbar min-h-[300px] flex flex-col gap-4">
        {messages.length > 0 ? (
          <>
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-4 ${
                  msg.role === 'user' 
                    ? 'bg-amber-500 text-white rounded-tr-sm' 
                    : 'bg-white border-2 border-amber-100 text-gray-800 rounded-tl-sm shadow-sm'
                }`}>
                  <div className={`markdown-body prose max-w-none ${msg.role === 'user' ? 'prose-invert' : 'prose-amber'}`}>
                    <Markdown>{msg.content}</Markdown>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && messages.length > 0 && (
              <div className="flex justify-start">
                <div className="bg-white border-2 border-amber-100 rounded-2xl p-4 rounded-tl-sm shadow-sm flex items-center gap-2 text-amber-500">
                  <Loader2 className="animate-spin" size={20} />
                  <span className="font-medium text-sm">AI 老师正在思考...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-amber-400/60">
            <PlayCircle size={64} className="mb-4" />
            <p className="font-bold text-lg">点击右上角按钮</p>
            <p className="text-sm">让 AI 老师为你量身定制测验吧！</p>
          </div>
        )}
      </div>

      {messages.length > 0 && (
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="输入你的答案..."
            disabled={isLoading}
            className="flex-1 bg-white border-2 border-amber-200 rounded-xl p-3 text-gray-700 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all disabled:opacity-50"
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white px-4 py-2 rounded-xl shadow-sm transition-colors flex items-center justify-center"
          >
            <Send size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
