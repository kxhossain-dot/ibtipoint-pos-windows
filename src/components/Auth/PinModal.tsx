import React, { useState } from 'react';
import { ShieldCheck, Lock, X, Delete } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { THEMES } from '../../utils/theme';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRole: 'admin' | 'staff';
}

export const PinModal: React.FC<PinModalProps> = ({ isOpen, onClose, targetRole }) => {
  const { unlockWithPin, t, settings } = useApp();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const theme = THEMES[settings.themeColor] || THEMES.teal;

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const verifyPin = (pinToTest: string) => {
    const success = unlockWithPin(pinToTest);
    if (success) {
      setPin('');
      setError(false);
      onClose();
    } else {
      setError(true);
      setTimeout(() => setPin(''), 600);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-sm p-6 text-center animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${theme.bgLight} ${theme.text}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
              {targetRole === 'admin' ? t('এডমিন মোড আনলক', 'Unlock Admin Mode') : t('স্টাফ মোড', 'Staff Mode')}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          {targetRole === 'admin' 
            ? t('৪-সংখ্যার এডমিন পিন কোড প্রবেশ করুন (ডিফল্ট: 1234)', 'Enter 4-digit Admin PIN (Default: 1234)')
            : t('স্টাফ পিন প্রবেশ করুন (ডিফল্ট: 0000)', 'Enter Staff PIN (Default: 0000)')}
        </p>

        {/* PIN Dots Display */}
        <div className="flex justify-center items-center gap-3 mb-6">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                error
                  ? 'border-rose-500 bg-rose-500 scale-110 animate-shake'
                  : pin.length > i
                  ? `${theme.primary} border-transparent scale-110`
                  : 'border-slate-300 dark:border-slate-700 bg-transparent'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs font-semibold text-rose-500 mb-4 animate-shake">
            {t('ভুল পিন কোড! পুনরায় চেষ্টা করুন।', 'Incorrect PIN code! Please try again.')}
          </p>
        )}

        {/* Touch Numpad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => handleDigit(num)}
              className="py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-lg active:scale-95 transition-all shadow-xs"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => setPin('')}
            className="py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-medium text-xs active:scale-95"
          >
            {t('মুছুন', 'Clear')}
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-lg active:scale-95 transition-all shadow-xs"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-slate-500 flex items-center justify-center active:scale-95"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 text-[11px] text-slate-400">
          💡 {t('টিপস: পিন পরিবর্তন করতে সেটিংস ট্যাবে যান', 'Tip: You can change this PIN in Settings tab')}
        </div>
      </div>
    </div>
  );
};
