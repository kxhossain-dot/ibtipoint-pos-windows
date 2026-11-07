import React, { useState } from 'react';
import { Cloud, LogIn, LogOut, UploadCloud, DownloadCloud } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GoogleSession, googleSignIn, googleSignOut, uploadBackup, downloadBackup } from '../../utils/googleDrive';

export const GoogleBackupPanel: React.FC = () => {
  const { settings, updateSettings, getBackupJSON, importAllDataJSON, t } = useApp();
  const envId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID as string | undefined;
  const [clientId, setClientId] = useState(settings.googleClientId || envId || '');
  const [session, setSession] = useState<GoogleSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const run = async (fn: () => Promise<string>) => {
    setBusy(true);
    setMsg(null);
    try {
      setMsg({ ok: true, text: await fn() });
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message || String(e) });
    } finally {
      setBusy(false);
    }
  };

  const ensureSession = async (): Promise<GoogleSession> => {
    if (session && session.expiresAt > Date.now()) return session;
    const s = await googleSignIn(clientId.trim());
    setSession(s);
    updateSettings({ googleClientId: clientId.trim() });
    return s;
  };

  const signIn = () => run(async () => {
    const s = await ensureSession();
    return `${t('সাইন ইন সফল', 'Signed in')}: ${s.email}`;
  });

  const backup = () => run(async () => {
    const s = await ensureSession();
    await uploadBackup(s, getBackupJSON());
    return t('গুগল ড্রাইভে ব্যাকআপ সম্পন্ন', 'Backup saved to Google Drive');
  });

  const restore = () => run(async () => {
    const s = await ensureSession();
    const file = await downloadBackup(s);
    if (!file) return t('ড্রাইভে কোনো ব্যাকআপ পাওয়া যায়নি', 'No backup found in Drive');
    if (!window.confirm(t('বর্তমান সব ডেটা ড্রাইভের ব্যাকআপ দিয়ে বদলে যাবে। চালিয়ে যাবেন?', 'This replaces all current data with the Drive backup. Continue?'))) {
      return t('বাতিল করা হয়েছে', 'Cancelled');
    }
    if (!importAllDataJSON(file.json)) throw new Error(t('ব্যাকআপ ফাইল পড়া যায়নি', 'Backup file could not be read'));
    return `${t('রিস্টোর সম্পন্ন', 'Restored')} (${new Date(file.modifiedTime).toLocaleString()})`;
  });

  const signOut = () => {
    googleSignOut(session);
    setSession(null);
    setMsg({ ok: true, text: t('সাইন আউট হয়েছে', 'Signed out') });
  };

  return (
    <div className="mt-5 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <Cloud className="w-4 h-4 text-sky-500" />
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
          {t('গুগল অ্যাকাউন্ট দিয়ে ডেটা সংরক্ষণ (Google Drive)', 'Keep data with Google account (Drive)')}
        </h3>
      </div>

      <label className="block text-[11px] font-bold text-slate-500">Google OAuth Client ID</label>
      <input
        value={clientId}
        onChange={e => setClientId(e.target.value)}
        placeholder="xxxxxxxx.apps.googleusercontent.com"
        className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
      />

      <div className="flex flex-wrap items-center gap-2">
        {!session ? (
          <button onClick={signIn} disabled={busy} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold disabled:opacity-50">
            <LogIn className="w-4 h-4" /> {t('গুগল দিয়ে সাইন ইন', 'Sign in with Google')}
          </button>
        ) : (
          <>
            <span className="text-xs font-semibold text-emerald-600 mr-1">● {session.email}</span>
            <button onClick={signOut} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold">
              <LogOut className="w-4 h-4" /> {t('সাইন আউট', 'Sign out')}
            </button>
          </>
        )}
        <button onClick={backup} disabled={busy || !clientId.trim()} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50">
          <UploadCloud className="w-4 h-4" /> {t('এখনই ব্যাকআপ', 'Backup now')}
        </button>
        <button onClick={restore} disabled={busy || !clientId.trim()} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold disabled:opacity-50">
          <DownloadCloud className="w-4 h-4" /> {t('ড্রাইভ থেকে রিস্টোর', 'Restore from Drive')}
        </button>
      </div>

      {msg && <p className={`text-xs font-semibold ${msg.ok ? 'text-emerald-600' : 'text-rose-600'}`}>{msg.text}</p>}

      <p className="text-[10px] leading-relaxed text-slate-500">
        {t(
          'ব্যাকআপ আপনার গুগল ড্রাইভের গোপন অ্যাপ-ফোল্ডারে থাকে (অন্য ফাইলের সাথে মিশে না)। Google Cloud Console-এ Drive API চালু করে একটি "Web application" OAuth Client ID বানান। দ্রষ্টব্য: গুগল সাইন-ইন ব্রাউজার/হোস্টেড ওয়েব সংস্করণে কাজ করে; EXE-তে নেটিভ সেটআপ লাগতে পারে — সেখানে JSON ব্যাকআপ ফাইল ব্যবহার করুন।',
          'The backup lives in a private app folder in your Drive. Enable the Drive API in Google Cloud Console and create a "Web application" OAuth Client ID. Note: Google sign-in works in the browser / hosted web version; the desktop app may need native setup — use the JSON backup file there.'
        )}
      </p>
    </div>
  );
};
