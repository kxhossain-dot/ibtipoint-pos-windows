import React, { useEffect, useState } from 'react';
import { Key, ShieldAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const MAX_ATTEMPTS = 3;
const LOCK_SECONDS = 30;

/** Weak-PIN rules: all same digits (1111) or straight runs (1234, 4321). */
function weakReason(pin: string, bn: boolean): string | null {
  if (/^(\d)\1{3}$/.test(pin)) return bn ? 'একই অঙ্ক বারবার (যেমন 1111) ব্যবহার করা যাবে না' : 'PIN cannot repeat one digit (e.g. 1111)';
  const d = pin.split('').map(Number);
  const asc = d.every((v, i) => i === 0 || v === d[i - 1] + 1);
  const desc = d.every((v, i) => i === 0 || v === d[i - 1] - 1);
  if (asc || desc) return bn ? 'ক্রমানুসারে অঙ্ক (যেমন 1234) ব্যবহার করা যাবে না' : 'PIN cannot be a straight sequence (e.g. 1234)';
  return null;
}

export const PinChangePanel: React.FC = () => {
  const { settings, updateSettings, currentRole, t } = useApp();
  const bn = settings.language === 'bn';
  const [role, setRole] = useState<'admin' | 'staff'>('staff');
  const [adminPin, setAdminPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [fails, setFails] = useState(0);
  const [lockLeft, setLockLeft] = useState(0);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (lockLeft <= 0) return;
    const id = setTimeout(() => setLockLeft(l => l - 1), 1000);
    return () => clearTimeout(id);
  }, [lockLeft]);

  const usingDefault = settings.adminPin === '1234' || settings.staffPin === '0000';
  const digits = (v: string) => v.replace(/\D/g, '').slice(0, 4);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const fail = (text: string) => setMsg({ ok: false, text });

    if (currentRole !== 'admin') return fail(t('শুধু এডমিন পিন পরিবর্তন করতে পারবে', 'Only the admin can change PINs'));
    if (lockLeft > 0) return fail(t(`অনেকবার ভুল। ${lockLeft} সেকেন্ড পরে চেষ্টা করুন`, `Too many wrong attempts. Try again in ${lockLeft}s`));

    if (adminPin !== settings.adminPin) {
      const n = fails + 1;
      setFails(n);
      if (n >= MAX_ATTEMPTS) { setFails(0); setLockLeft(LOCK_SECONDS); }
      return fail(t('বর্তমান এডমিন পিন ভুল', 'Current admin PIN is wrong'));
    }
    setFails(0);

    if (!/^\d{4}$/.test(newPin)) return fail(t('নতুন পিন অবশ্যই ৪টি সংখ্যার হতে হবে', 'New PIN must be exactly 4 digits'));
    if (newPin !== confirmPin) return fail(t('নতুন পিন ও নিশ্চিতকরণ মিলছে না', 'New PIN and confirmation do not match'));
    const weak = weakReason(newPin, bn);
    if (weak) return fail(weak);
    const current = role === 'admin' ? settings.adminPin : settings.staffPin;
    const other = role === 'admin' ? settings.staffPin : settings.adminPin;
    if (newPin === current) return fail(t('নতুন পিন আগের পিনের মতো হতে পারবে না', 'New PIN must differ from the current one'));
    if (newPin === other) return fail(t('এডমিন ও স্টাফের পিন আলাদা হতে হবে', 'Admin and Staff PINs must be different'));

    updateSettings(role === 'admin' ? { adminPin: newPin } : { staffPin: newPin });
    setAdminPin(''); setNewPin(''); setConfirmPin('');
    setMsg({ ok: true, text: t('পিন সফলভাবে পরিবর্তন হয়েছে', 'PIN changed successfully') });
  };

  const field = 'w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono font-bold text-center tracking-widest text-slate-900 dark:text-white';

  return (
    <form onSubmit={submit} className="mt-5 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <Key className="w-4 h-4 text-amber-500" />
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{t('পিন পরিবর্তন (এডমিন ও স্টাফ)', 'Change PIN (Admin & Staff)')}</h3>
      </div>

      {usingDefault && (
        <div className="flex items-start gap-2 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-[11px] font-semibold text-amber-900 dark:text-amber-200">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          {t('আপনি এখনো ডিফল্ট পিন (এডমিন 1234 / স্টাফ 0000) ব্যবহার করছেন। নিরাপত্তার জন্য এখনই বদলান।', 'You are still on a default PIN (Admin 1234 / Staff 0000). Please change it now.')}
        </div>
      )}

      <div className="flex gap-2">
        {(['staff', 'admin'] as const).map(r => (
          <button
            type="button"
            key={r}
            onClick={() => setRole(r)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${role === r ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
          >
            {r === 'admin' ? t('এডমিন পিন', 'Admin PIN') : t('স্টাফ পিন', 'Staff PIN')}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-[11px] font-bold text-slate-500 block mb-1">{t('বর্তমান এডমিন পিন', 'Current admin PIN')}</label>
          <input type="password" inputMode="numeric" maxLength={4} value={adminPin} onChange={e => setAdminPin(digits(e.target.value))} className={field} placeholder="••••" />
        </div>
        <div>
          <label className="text-[11px] font-bold text-slate-500 block mb-1">{t('নতুন পিন', 'New PIN')}</label>
          <input type="password" inputMode="numeric" maxLength={4} value={newPin} onChange={e => setNewPin(digits(e.target.value))} className={field} placeholder="••••" />
        </div>
        <div>
          <label className="text-[11px] font-bold text-slate-500 block mb-1">{t('নতুন পিন আবার', 'Confirm new PIN')}</label>
          <input type="password" inputMode="numeric" maxLength={4} value={confirmPin} onChange={e => setConfirmPin(digits(e.target.value))} className={field} placeholder="••••" />
        </div>
      </div>

      <ul className="text-[10px] text-slate-500 space-y-0.5 list-disc pl-4">
        <li>{t('শুধু এডমিন (বর্তমান এডমিন পিন দিয়ে যাচাই করে) পিন বদলাতে পারে', 'Only the admin can change PINs, verified with the current admin PIN')}</li>
        <li>{t('ঠিক ৪টি সংখ্যা; 1111 বা 1234 ধরনের সহজ পিন নিষেধ', 'Exactly 4 digits; easy PINs like 1111 or 1234 are not allowed')}</li>
        <li>{t('এডমিন ও স্টাফের পিন আলাদা এবং আগের পিন থেকে ভিন্ন হতে হবে', 'Admin and Staff PINs must differ from each other and from the old PIN')}</li>
        <li>{t('৩ বার ভুল দিলে ৩০ সেকেন্ডের জন্য লক হবে', '3 wrong attempts lock this form for 30 seconds')}</li>
      </ul>

      {msg && <p className={`text-xs font-semibold ${msg.ok ? 'text-emerald-600' : 'text-rose-600'}`}>{msg.text}</p>}

      <button type="submit" disabled={lockLeft > 0} className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold disabled:opacity-50">
        {lockLeft > 0 ? `${lockLeft}s` : t('পিন পরিবর্তন করুন', 'Change PIN')}
      </button>
    </form>
  );
};
