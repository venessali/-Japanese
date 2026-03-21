import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { Vocabulary, Grammar } from '../types';
import { Sparkles, Loader2, PlayCircle, Settings2, CheckCircle2, XCircle, ArrowRight, RotateCcw } from 'lucide-react';

interface AIQuizProps {
  vocabList: Vocabulary[];
  grammarList: Grammar[];
  apiKey?: string;
  apiBaseUrl?: string;
}

interface Question {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export function AIQuiz({ vocabList, grammarList, apiKey, apiBaseUrl }: AIQuizProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateQuiz = async () => {
    if (vocabList.length === 0 && grammarList.length === 0) {
      setError('请先添加一些词汇或语法笔记，AI才能为你出题哦！');
      return;
    }

    setIsLoading(true);
    setError(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setScore(0);
    setQuizFinished(false);

    try {
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vocabList,
          grammarList,
          customPrompt,
          apiKey,
          apiBaseUrl
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
      if (data.questions && Array.isArray(data.questions)) {
        setQuestions(data.questions);
      } else {
        throw new Error('Invalid response format from AI');
      }
      setShowSettings(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || '生成测验时出错，请检查网络或 API Key。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionClick = (index: number) => {
    if (isAnswerChecked) return;
    setSelectedOption(index);
    setIsAnswerChecked(true);

    if (index === questions[currentQuestionIndex].correctAnswerIndex) {
      setScore(prev => prev + 1);
      setTimeout(() => {
        handleNextQuestion();
      }, 800);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswerChecked(false);
    } else {
      setQuizFinished(true);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-indigo-50 overflow-hidden flex flex-col h-[600px]">
      <div className="p-6 border-b border-indigo-50 bg-gradient-to-r from-indigo-50/50 to-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
            <Sparkles size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">AI 智能测验</h2>
            <p className="text-sm text-gray-500">基于你的学习记录生成专属选择题</p>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-xl transition-colors ${showSettings ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:bg-gray-100'}`}
          title="测验设置"
        >
          <Settings2 size={20} />
        </button>
      </div>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-indigo-50 bg-indigo-50/30 px-6 py-4 shrink-0 overflow-hidden"
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">
              自定义测验要求 (可选)
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="例如：请多出一些关于动词变形的题目，或者侧重于商务日语..."
              className="w-full p-3 rounded-xl border border-indigo-100 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none resize-none bg-white text-sm"
              rows={3}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30 flex flex-col relative">
        {questions.length === 0 && !isLoading && !quizFinished && (
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-300 mb-6">
              <Sparkles size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">准备好挑战了吗？</h3>
            <p className="text-gray-500 mb-8">
              AI 将根据你看板中的 {vocabList.length} 个单词和 {grammarList.length} 个语法点，为你生成 5 道专属选择题。
            </p>
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm w-full border border-red-100">
                {error}
              </div>
            )}
            <button
              onClick={generateQuiz}
              className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-200"
            >
              <PlayCircle size={24} />
              开始生成测验
            </button>
          </div>
        )}

        {isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center text-indigo-400">
            <Loader2 className="animate-spin mb-4" size={48} />
            <p className="font-medium animate-pulse text-indigo-600">AI 正在为你出题中...</p>
          </div>
        )}

        {questions.length > 0 && !quizFinished && (
          <div className="max-w-2xl mx-auto w-full flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                题目 {currentQuestionIndex + 1} / {questions.length}
              </span>
              <span className="text-sm font-medium text-gray-500">
                得分: {score}
              </span>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
              <h3 className="text-lg font-bold text-gray-800 leading-relaxed">
                {currentQuestion.question}
              </h3>
            </div>

            <div className="space-y-3 flex-1">
              {currentQuestion.options.map((option, index) => {
                let buttonClass = "w-full text-left p-4 rounded-xl border-2 transition-all font-medium text-gray-700 hover:bg-indigo-50 hover:border-indigo-200";
                let icon = null;

                if (isAnswerChecked) {
                  if (index === currentQuestion.correctAnswerIndex) {
                    buttonClass = "w-full text-left p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50 text-emerald-800 font-bold";
                    icon = <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />;
                  } else if (index === selectedOption) {
                    buttonClass = "w-full text-left p-4 rounded-xl border-2 border-red-400 bg-red-50 text-red-700 font-medium";
                    icon = <XCircle className="text-red-400 shrink-0" size={20} />;
                  } else {
                    buttonClass = "w-full text-left p-4 rounded-xl border-2 border-gray-100 bg-gray-50 text-gray-400 font-medium opacity-50";
                  }
                } else if (selectedOption === index) {
                  buttonClass = "w-full text-left p-4 rounded-xl border-2 border-indigo-400 bg-indigo-50 text-indigo-700 font-bold";
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleOptionClick(index)}
                    disabled={isAnswerChecked}
                    className={`${buttonClass} flex items-center justify-between gap-4`}
                  >
                    <span>{option}</span>
                    {icon}
                  </button>
                );
              })}
            </div>

            <AnimatePresence>
              {isAnswerChecked && selectedOption !== currentQuestion.correctAnswerIndex && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6"
                >
                  <div className="p-5 bg-orange-50 rounded-2xl border border-orange-100 mb-6">
                    <h4 className="font-bold text-orange-800 mb-2 flex items-center gap-2">
                      <Sparkles size={18} />
                      错题解析
                    </h4>
                    <div className="text-orange-700 text-sm leading-relaxed prose prose-orange max-w-none">
                      <Markdown>{currentQuestion.explanation}</Markdown>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleNextQuestion}
                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-md"
                  >
                    {currentQuestionIndex < questions.length - 1 ? (
                      <>下一题 <ArrowRight size={20} /></>
                    ) : (
                      <>查看结果 <ArrowRight size={20} /></>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {quizFinished && (
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-500 mb-6">
              <CheckCircle2 size={48} />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">测验完成！</h3>
            <p className="text-gray-500 mb-8 text-lg">
              你的得分: <span className="font-bold text-indigo-600 text-2xl">{score}</span> / {questions.length}
            </p>
            <button
              onClick={generateQuiz}
              className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              <RotateCcw size={20} />
              再来一组
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
