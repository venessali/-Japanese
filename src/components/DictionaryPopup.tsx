import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Loader2 } from 'lucide-react';

interface DictionaryPopupProps {
  apiKey?: string;
}

export function DictionaryPopup({ apiKey }: DictionaryPopupProps) {
  const [selectedText, setSelectedText] = useState('');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isOpen, setIsOpen] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      // Don't trigger if clicking inside the popup
      const popupElement = document.getElementById('dictionary-popup');
      if (popupElement && popupElement.contains(e.target as Node)) {
        return;
      }

      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (text && text.length > 0 && text.length < 50) {
        // Check if it contains Japanese characters (Hiragana, Katakana, Kanji)
        const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
        
        if (hasJapanese) {
          setSelectedText(text);
          // Position slightly below the cursor
          setPosition({ x: e.pageX, y: e.pageY + 20 });
          setIsOpen(true);
          fetchExplanation(text);
        } else {
          setIsOpen(false);
        }
      } else {
        setIsOpen(false);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const fetchExplanation = async (text: string) => {
    setIsLoading(true);
    setExplanation('');
    try {
      const response = await fetch('/api/dictionary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, apiKey }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to fetch explanation';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setExplanation(data.text || '无法获取解释。');
    } catch (err: any) {
      console.error(err);
      setExplanation(err.message || '查询失败，请检查网络或 API Key。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="dictionary-popup"
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          style={{
            position: 'absolute',
            left: Math.min(position.x, window.innerWidth - 320), // Prevent going off-screen
            top: position.y,
            zIndex: 50,
          }}
          className="bg-white rounded-2xl shadow-xl border-2 border-indigo-100 w-80 overflow-hidden"
        >
          <div className="bg-indigo-50 px-4 py-2 flex justify-between items-center border-b border-indigo-100">
            <div className="flex items-center gap-2 text-indigo-600 font-bold">
              <Search size={16} />
              <span>快捷查词</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-indigo-400 hover:text-indigo-600 transition-colors p-1"
            >
              <X size={16} />
            </button>
          </div>
          <div className="p-4">
            <div className="font-bold text-xl text-gray-800 mb-3 border-l-4 border-indigo-400 pl-3">
              {selectedText}
            </div>
            {isLoading ? (
              <div className="flex items-center gap-2 text-indigo-400 py-4 justify-center">
                <Loader2 className="animate-spin" size={20} />
                <span className="text-sm font-medium">AI 正在查询中...</span>
              </div>
            ) : (
              <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                {explanation}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
