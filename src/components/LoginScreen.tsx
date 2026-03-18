import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Trees, Sun, LogIn, Loader2 } from 'lucide-react';

export function LoginScreen() {
  const { login, loading } = useAuth();

  return (
    <div className="min-h-screen bg-orange-50/50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl border-4 border-emerald-100 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="relative bg-emerald-500 text-white p-4 rounded-2xl shadow-sm transform -rotate-6">
            <Trees size={48} />
            <Sun size={24} className="absolute -top-3 -right-3 text-amber-400 fill-amber-400" />
          </div>
        </div>
        
        <h1 className="text-3xl font-black text-gray-800 tracking-tight mb-2">木漏れ日</h1>
        <p className="text-sm font-bold text-emerald-500 uppercase tracking-wider mb-8">Komorebi - 日语学习手帐</p>
        
        <p className="text-gray-600 mb-8">
          登录以开启云端同步功能，您的单词本、语法笔记和学习记录将安全地保存在云端，随时随地跨设备学习。
        </p>

        <button
          onClick={login}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-2xl transition-colors shadow-sm disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={24} /> : <LogIn size={24} />}
          {loading ? '加载中...' : '使用 Google 账号登录'}
        </button>
      </div>
    </div>
  );
}
