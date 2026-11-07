# ibtipoint — Windows App

Smart business management & POS (Bangla / English): POS with cash memo (5.5 × 8 in), inventory, customer due khata,
mobile banking, photo studio, daily expenses, reports. Data is stored locally and works fully offline.

## Build the .exe

### Option A — GitHub Actions (no tools needed)
1. Create a GitHub repository and upload everything in this folder (keep the `.github` folder).
2. Open **Actions → Build Windows EXE**; when it finishes, download **ibtipoint-Windows-App** (installer + portable `.exe`).

### Option B — on your PC
1. Install [Node.js 22](https://nodejs.org).
2. Double-click `build-windows-exe.bat` (or run `npm install --legacy-peer-deps` then `npm run electron:build`).
3. The installer appears in `release/`.

## Develop
```bash
npm install --legacy-peer-deps
npm run lint     # type check
npm run dev      # http://localhost:3000
```

## Customise
- Logo: already set. To change it, replace `public/icon-512.png`, `icon-192.png` and `logo.png`.
- Products: put `Product & Rates.xlsx` in `src/data/seed/` before building to auto-import on first launch.
- Default PINs are Admin `1234` / Staff `0000` — change them in **Settings** right away.
- Camera barcode scan and Google Drive backup are available; Google sign-in may not work inside the desktop app — use the JSON backup in Settings.

License: Apache-2.0 (see `LICENSE`).
