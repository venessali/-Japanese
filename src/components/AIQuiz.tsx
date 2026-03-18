import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';
import { Vocabulary, Grammar } from '../types';
import { Sparkles, Loader2, PlayCircle } from 'lucide-react';

interface AIQuizProps {
  vocabList: Vocabulary[];
  grammarList: Grammar[];
}

export function AIQuiz({ vocabList, grammarList }: AIQuizProps) {
  const [quizContent, setQuizContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateQuiz = async () => {
    if (vocabList.length === 0 && grammarList.length === 0) {
      setError('请先添加一些词汇或语法笔记，AI才能为你出题哦！');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const vocabPrompt = vocabList.map(v => `${v.word} (${v.reading}) - ${v.meaning}`).join('\n');
      const grammarPrompt = grammarList.map(g => `${g.pattern} - ${g.meaning}`).join('\n');

      const prompt = `
        你是一个充满元气、鼓励学生的日语老师。请根据学生最近学习的词汇和语法，生成一份简短的日语小测验。
        
        学习的词汇：
        ${vocabPrompt || '无'}
        
        学习的语法：
        ${grammarPrompt || '无'}
        
        要求：
        1. 包含 3-5 道选择题或填空题。
        2. 题目要结合这些词汇和语法。
        3. 使用 Markdown 格式渲染，题目和选项要清晰。
        4. 在测验最后，提供一个折叠的答案解析区域（可以使用 HTML 的 <details> 和 <summary> 标签包裹答案）。
        5. 语气要活泼可爱，多用颜文字（如 (≧▽≦), (๑•̀ㅂ•́)و✧）。
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setQuizContent(response.text || '生成失败，请重试。');
    } catch (err) {
      console.error(err);
      setError('生成测验时出错，请检查网络或 API Key。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border-4 border-amber-100 p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-amber-600">AI 随堂测验</span>
          <span className="text-sm text-amber-500 font-medium bg-amber-50 px-2 py-1 rounded-full">AI Quiz</span>
        </div>
        <button
          onClick={generateQuiz}
          disabled={isLoading}
          className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white px-4 py-2 rounded-xl shadow-sm transition-colors flex items-center gap-2 font-bold"
        >
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
          {isLoading ? '生成中...' : '生成测验'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-2xl border-2 border-red-100 mb-4 font-medium">
          {error}
        </div>
      )}

      <div className="flex-1 bg-amber-50/30 rounded-2xl border-2 border-amber-100 p-6 overflow-y-auto custom-scrollbar min-h-[300px]">
        {quizContent ? (
          <div className="markdown-body prose prose-amber max-w-none">
            <Markdown>{quizContent}</Markdown>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-amber-400/60">
            <PlayCircle size={64} className="mb-4" />
            <p className="font-bold text-lg">点击右上角按钮</p>
            <p className="text-sm">让 AI 老师为你量身定制测验吧！</p>
          </div>
        )}
      </div>
    </div>
  );
}
