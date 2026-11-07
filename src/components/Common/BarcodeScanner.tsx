import React, { useEffect, useRef, useState } from 'react';
import { X, Camera } from 'lucide-react';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
  title?: string;
}

/**
 * Camera barcode scanner.
 * Uses the native BarcodeDetector API when available (Chrome / Android WebView),
 * otherwise falls back to the ZXing decoder.
 */
export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ isOpen, onClose, onDetected, title }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    let stopped = false;
    let stream: MediaStream | null = null;
    let rafId = 0;
    let zxingControls: { stop: () => void } | null = null;
    setError('');

    const finish = (code: string) => {
      if (stopped) return;
      stopped = true;
      onDetected(code);
    };

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('এই ডিভাইসে ক্যামেরা সাপোর্ট নেই / Camera not supported on this device');
        return;
      }
      try {
        const Detector = (window as any).BarcodeDetector;
        if (Detector) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' } },
            audio: false,
          });
          const video = videoRef.current;
          if (!video || stopped) return;
          video.srcObject = stream;
          await video.play();
          const detector = new Detector({
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'code_93', 'itf', 'codabar', 'qr_code'],
          });
          const tick = async () => {
            if (stopped) return;
            try {
              if (video.readyState >= 2) {
                const codes = await detector.detect(video);
                if (codes.length > 0 && codes[0].rawValue) {
                  finish(codes[0].rawValue);
                  return;
                }
              }
            } catch {
              /* ignore frame errors */
            }
            rafId = requestAnimationFrame(tick);
          };
          rafId = requestAnimationFrame(tick);
        } else {
          const { BrowserMultiFormatReader } = await import('@zxing/browser');
          if (stopped) return;
          const reader = new BrowserMultiFormatReader();
          zxingControls = await reader.decodeFromConstraints(
            { video: { facingMode: { ideal: 'environment' } }, audio: false },
            videoRef.current as HTMLVideoElement,
            (result: any) => {
              if (result) finish(result.getText());
            }
          );
        }
      } catch (e: any) {
        const denied = e?.name === 'NotAllowedError' || e?.name === 'SecurityError';
        setError(
          denied
            ? 'ক্যামেরার অনুমতি দিন (Allow camera permission)'
            : 'ক্যামেরা চালু করা যায়নি / Could not start camera'
        );
      }
    };

    start();

    return () => {
      stopped = true;
      cancelAnimationFrame(rafId);
      try { zxingControls?.stop(); } catch { /* ignore */ }
      stream?.getTracks().forEach(track => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 font-extrabold text-sm text-slate-800 dark:text-slate-100">
            <Camera className="w-4 h-4" />
            {title || 'বারকোড স্ক্যান / Scan Barcode'}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="relative bg-black aspect-[4/3]">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          <div className="pointer-events-none absolute inset-x-8 top-1/2 -translate-y-1/2 h-24 border-2 border-emerald-400 rounded-xl" />
        </div>
        <p className="p-4 text-xs text-center text-slate-500 dark:text-slate-400">
          {error || 'বারকোড ক্যামেরার সামনে ধরুন / Hold the barcode inside the frame'}
        </p>
      </div>
    </div>
  );
};
