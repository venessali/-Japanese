import React from 'react';
import { LearningLog, Vocabulary, Grammar } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp, Award, Clock, BookOpen } from 'lucide-react';

interface DashboardProps {
  logs: LearningLog[];
  vocabList: Vocabulary[];
  grammarList: Grammar[];
  compact?: boolean;
}

export function Dashboard({ logs, vocabList, grammarList, compact = false }: DashboardProps) {
  const chartData = logs.length > 0 ? logs : [
    { date: 'Mon', vocabLearned: 5, grammarLearned: 1 },
    { date: 'Tue', vocabLearned: 12, grammarLearned: 2 },
    { date: 'Wed', vocabLearned: 8, grammarLearned: 0 },
    { date: 'Thu', vocabLearned: 15, grammarLearned: 3 },
    { date: 'Fri', vocabLearned: 20, grammarLearned: 1 },
    { date: 'Sat', vocabLearned: 10, grammarLearned: 4 },
    { date: 'Sun', vocabLearned: 25, grammarLearned: 2 },
  ];

  const reviewVocab = vocabList.filter(v => v.tag === 'review').slice(0, 5);

  if (compact) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border-4 border-pink-100 p-6 h-full flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl font-bold text-pink-600">学习看板</span>
          <span className="text-sm text-pink-500 font-medium bg-pink-50 px-2 py-1 rounded-full">Dashboard</span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-pink-50 rounded-2xl p-4 border-2 border-pink-100 flex items-center gap-4">
            <div className="bg-white p-3 rounded-xl text-pink-500 shadow-sm">
              <TrendingUp size={24} />
            </div>
            <div>
              <div className="text-sm text-pink-600 font-medium">总词汇量</div>
              <div className="text-2xl font-black text-gray-800">{vocabList.length}</div>
            </div>
          </div>
          <div className="bg-purple-50 rounded-2xl p-4 border-2 border-purple-100 flex items-center gap-4">
            <div className="bg-white p-3 rounded-xl text-purple-500 shadow-sm">
              <Award size={24} />
            </div>
            <div>
              <div className="text-sm text-purple-600 font-medium">总语法数</div>
              <div className="text-2xl font-black text-gray-800">{grammarList.length}</div>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-2xl border-2 border-gray-100 p-4 relative min-h-[200px]">
          <h4 className="text-sm font-bold text-gray-500 mb-4 flex items-center gap-2">
            <Calendar size={16} />
            近期学习趋势
          </h4>
          <div className="absolute inset-0 pt-12 pb-4 px-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} width={30} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ stroke: '#fbcfe8', strokeWidth: 2 }}
                />
                <Line type="monotone" dataKey="vocabLearned" name="词汇" stroke="#ec4899" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="grammarLearned" name="语法" stroke="#a855f7" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border-4 border-pink-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl font-bold text-pink-600">学习看板</span>
          <span className="text-sm text-pink-500 font-medium bg-pink-50 px-2 py-1 rounded-full">Dashboard</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-pink-50 rounded-2xl p-4 border-2 border-pink-100 flex items-center gap-4">
            <div className="bg-white p-3 rounded-xl text-pink-500 shadow-sm">
              <TrendingUp size={24} />
            </div>
            <div>
              <div className="text-sm text-pink-600 font-medium">总词汇量</div>
              <div className="text-2xl font-black text-gray-800">{vocabList.length}</div>
            </div>
          </div>
          <div className="bg-purple-50 rounded-2xl p-4 border-2 border-purple-100 flex items-center gap-4">
            <div className="bg-white p-3 rounded-xl text-purple-500 shadow-sm">
              <Award size={24} />
            </div>
            <div>
              <div className="text-sm text-purple-600 font-medium">总语法数</div>
              <div className="text-2xl font-black text-gray-800">{grammarList.length}</div>
            </div>
          </div>
          <div className="bg-amber-50 rounded-2xl p-4 border-2 border-amber-100 flex items-center gap-4">
            <div className="bg-white p-3 rounded-xl text-amber-500 shadow-sm">
              <Clock size={24} />
            </div>
            <div>
              <div className="text-sm text-amber-600 font-medium">待复习词汇</div>
              <div className="text-2xl font-black text-gray-800">{vocabList.filter(v => v.tag === 'review').length}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border-2 border-gray-100 p-4 relative min-h-[300px]">
            <h4 className="text-sm font-bold text-gray-500 mb-4 flex items-center gap-2">
              <Calendar size={16} />
              近期学习趋势
            </h4>
            <div className="absolute inset-0 pt-12 pb-4 px-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} width={30} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ stroke: '#fbcfe8', strokeWidth: 2 }}
                  />
                  <Line type="monotone" dataKey="vocabLearned" name="词汇" stroke="#ec4899" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="grammarLearned" name="语法" stroke="#a855f7" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-amber-50/50 rounded-2xl border-2 border-amber-100 p-4 flex flex-col">
            <h4 className="text-sm font-bold text-amber-600 mb-4 flex items-center gap-2">
              <Clock size={16} />
              急需复习
            </h4>
            <div className="flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
              {reviewVocab.length > 0 ? (
                reviewVocab.map(vocab => (
                  <div key={vocab.id} className="bg-white p-3 rounded-xl shadow-sm border border-amber-100">
                    <div className="text-xs text-gray-400 font-medium">{vocab.reading}</div>
                    <div className="text-lg font-bold text-gray-800">{vocab.word}</div>
                    <div className="text-sm text-gray-600 mt-1">{vocab.meaning}</div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-amber-400/60 py-8">
                  <BookOpen size={32} className="mb-2" />
                  <p className="text-sm font-medium">太棒了！没有积压的复习任务</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
