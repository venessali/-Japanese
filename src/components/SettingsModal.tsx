import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { X, Key, Save, Loader2 } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { profile, updateApiKey } = useAuth();
  const [apiKey, setApiKey] = useState(profile?.deepseekApiKey || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateApiKey(apiKey);
      onClose();
    } catch (error) {
      console.error('Failed to save API key:', error);
      alert('保存失败，请重试。');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl border-4 border-indigo-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-indigo-50 px-6 py-4 flex justify-between items-center border-b-2 border-indigo-100">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-lg">
            <Key size={20} />
            <span>设置</span>
          </div>
          <button 
            onClick={onClose}
            className="text-indigo-400 hover:text-indigo-600 transition-colors p-1 rounded-lg hover:bg-indigo-100"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              DeepSeek API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-3 text-gray-700 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
            <p className="text-xs text-gray-500 mt-2">
              绑定您的 DeepSeek API Key 以启用 AI 测验和划词翻译功能。您的 Key 将安全地加密保存在云端。
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-500 font-medium hover:bg-gray-100 rounded-xl transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold transition-colors shadow-sm disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {isSaving ? '保存中...' : '保存设置'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
