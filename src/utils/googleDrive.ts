// Google account sign-in + app-private Drive backup (appDataFolder: invisible to the user's normal Drive files).
// Uses Google Identity Services (token flow). Needs an OAuth "Web" Client ID with the Drive API enabled.

const SCOPES = 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.email';
const FILE_NAME = 'ibtipoint_backup.json';

let gsiPromise: Promise<void> | null = null;
function loadGsi(): Promise<void> {
  if ((window as any).google?.accounts?.oauth2) return Promise.resolve();
  return (gsiPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      gsiPromise = null;
      reject(new Error('Google সার্ভিস লোড হয়নি — ইন্টারনেট দেখুন / Could not load Google services (offline?)'));
    };
    document.head.appendChild(s);
  }));
}

export interface GoogleSession {
  accessToken: string;
  email: string;
  expiresAt: number;
}

export async function googleSignIn(clientId: string): Promise<GoogleSession> {
  if (!clientId) throw new Error('Google Client ID দিন / Enter a Google Client ID');
  await loadGsi();
  const token: { access_token: string; expires_in: number } = await new Promise((resolve, reject) => {
    const client = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (resp: any) => (resp.error ? reject(new Error(resp.error_description || resp.error)) : resolve(resp)),
      error_callback: (err: any) => reject(new Error(err?.message || err?.type || 'Sign-in cancelled')),
    });
    client.requestAccessToken({ prompt: '' });
  });
  const info = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token.access_token}` },
  }).then(r => r.json());
  return { accessToken: token.access_token, email: info.email || '', expiresAt: Date.now() + token.expires_in * 1000 - 30_000 };
}

export function googleSignOut(session: GoogleSession | null) {
  try {
    if (session) (window as any).google?.accounts?.oauth2?.revoke(session.accessToken, () => {});
  } catch { /* ignore */ }
}

async function findBackup(token: string): Promise<{ id: string; modifiedTime: string } | null> {
  const q = encodeURIComponent(`name='${FILE_NAME}'`);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,modifiedTime)`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Drive error ${res.status}`);
  const data = await res.json();
  return data.files?.[0] ?? null;
}

export async function uploadBackup(session: GoogleSession, json: string): Promise<void> {
  const existing = await findBackup(session.accessToken);
  const boundary = 'ibtipoint_boundary';
  const meta = existing ? { name: FILE_NAME } : { name: FILE_NAME, parents: ['appDataFolder'] };
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n` +
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${json}\r\n--${boundary}--`;
  const url = existing
    ? `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=multipart`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
  const res = await fetch(url, {
    method: existing ? 'PATCH' : 'POST',
    headers: { Authorization: `Bearer ${session.accessToken}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  });
  if (!res.ok) throw new Error(`Drive upload failed (${res.status})`);
}

export async function downloadBackup(session: GoogleSession): Promise<{ json: string; modifiedTime: string } | null> {
  const file = await findBackup(session.accessToken);
  if (!file) return null;
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
  if (!res.ok) throw new Error(`Drive download failed (${res.status})`);
  return { json: await res.text(), modifiedTime: file.modifiedTime };
}
