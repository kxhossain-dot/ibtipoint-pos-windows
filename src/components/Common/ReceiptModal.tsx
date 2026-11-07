import React, { useMemo, useRef, useState } from 'react';
import { Printer, Share2, Copy, X, Check, Download } from 'lucide-react';
import { SaleOrder } from '../../types';
import { useApp } from '../../context/AppContext';
import { THEMES } from '../../utils/theme';
import { buildReceiptHtml, PAPER_SPECS, ReceiptPaper } from '../../utils/receipt';
import { printMemo } from '../../utils/printMemo';

interface ReceiptModalProps {
  order: SaleOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, isOpen, onClose }) => {
  const { settings, updateSettings, t } = useApp();
  const [copied, setCopied] = useState(false);
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const theme = THEMES[settings.themeColor] || THEMES.teal;
  const paper: ReceiptPaper = settings.receiptPaper || 'memo'; // default: 5.5 x 8 inch memo
  const spec = PAPER_SPECS[paper];

  const html = useMemo(() => (order ? buildReceiptHtml(order, settings, paper) : ''), [order, settings, paper]);

  if (!isOpen || !order) return null;

  // Print exactly what the preview shows
  const [printing, setPrinting] = useState(false);
  const handlePrint = async () => {
    setPrinting(true);
    try {
      await printMemo({
        frame: frameRef.current,
        html,
        paperCss: spec.css,
        widthIn: spec.widthIn,
        heightIn: spec.heightIn,
        name: order.invoiceNo,
      });
    } catch (e: any) {
      alert(t('প্রিন্ট করা যায়নি: ', 'Could not print: ') + (e?.message || e));
    } finally {
      setPrinting(false);
    }
  };

  // Fallback for devices without a print dialog (e.g. Android WebView): save as an HTML file to print/share
  const handleDownload = () => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${order.invoiceNo}.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const plainText = () => {
    const lines = [
      settings.business.name,
      settings.business.phone,
      `মেমো: ${order.invoiceNo}  তারিখ: ${order.date}`,
      `ক্রেতা: ${order.customerName || 'নগদ ক্রেতা'}`,
      '-----------------------------',
      ...order.items.map(i => `${i.product.nameBn || i.product.name} x${i.quantity} = ৳${i.subtotal}`),
      '-----------------------------',
      `সর্বমোট: ৳${order.total}`,
      `পরিশোধিত: ৳${order.paidAmount}`,
      ...(order.dueAmount > 0 ? [`বাকি: ৳${order.dueAmount}`] : []),
      settings.business.footerNote,
    ];
    return lines.join('\n');
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(plainText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    if (!order.customerPhone) {
      alert(t('ক্রেতার ফোন নম্বর নেই', 'No customer phone number available'));
      return;
    }
    const clean = order.customerPhone.replace(/[^0-9]/g, '');
    const intl = clean.startsWith('880') ? clean : clean.startsWith('0') ? `88${clean}` : `880${clean}`;
    window.open(`https://wa.me/${intl}?text=${encodeURIComponent(plainText())}`, '_blank');
  };

  // Preview scale: show the page at true proportions, shrunk to fit the screen
  const pageW = spec.widthIn * 96;
  const pageH = (spec.heightIn ?? 8) * 96;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[96vh] flex flex-col overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Printer className="w-4 h-4 text-teal-600" />
            {t('মেমো প্রিভিউ', 'Memo Preview')}
          </span>
          <div className="flex items-center gap-1.5">
            <select
              value={paper}
              onChange={e => updateSettings({ receiptPaper: e.target.value as ReceiptPaper })}
              className="px-2 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
              title={t('কাগজের সাইজ', 'Paper size')}
            >
              {(Object.keys(PAPER_SPECS) as ReceiptPaper[]).map(k => (
                <option key={k} value={k}>{t(PAPER_SPECS[k].labelBn, PAPER_SPECS[k].label)}</option>
              ))}
            </select>
            <button onClick={handlePrint} disabled={printing} className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-white text-xs font-bold disabled:opacity-60 ${theme.primary} ${theme.primaryHover}`}>
              <Printer className="w-3.5 h-3.5" />
              <span>{printing ? '…' : t('প্রিন্ট প্রিভিউ', 'Print Preview')}</span>
            </button>
            <button onClick={handleDownload} className="p-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200" title={t('ফাইল হিসেবে সেভ', 'Save as file')}>
              <Download className="w-4 h-4" />
            </button>
            <button onClick={handleCopy} className="p-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200" title="Copy">
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
            {order.customerPhone && (
              <button onClick={handleWhatsApp} className="p-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" title="WhatsApp">
                <Share2 className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Paper preview (what you see is what gets printed) */}
        <div className="flex-1 overflow-auto bg-slate-200 dark:bg-neutral-800 p-3 flex justify-center">
          <iframe
            ref={frameRef}
            title="memo-preview"
            srcDoc={html}
            onLoad={e => {
              const el = e.target as HTMLIFrameElement;
              const h = el.contentDocument?.documentElement.scrollHeight || 0;
              el.style.height = Math.max(pageH, h) + 'px';
            }}
            className="bg-white shadow-lg shrink-0"
            style={{ width: pageW, height: pageH, maxWidth: '100%', border: 0 }}
          />
        </div>
      </div>
    </div>
  );
};
