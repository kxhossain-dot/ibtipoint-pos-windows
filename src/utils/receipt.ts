import { SaleOrder, AppSettings } from '../types';

export type ReceiptPaper = 'memo' | 'a4' | 'thermal80';

export const PAPER_SPECS: Record<ReceiptPaper, { label: string; labelBn: string; css: string; widthIn: number; heightIn: number | null }> = {
  memo: { label: 'Cash Memo 5.5 × 8 in', labelBn: 'ক্যাশ মেমো ৫.৫ × ৮ ইঞ্চি', css: '5.5in 8in', widthIn: 5.5, heightIn: 8 },
  a4: { label: 'A4', labelBn: 'A4 কাগজ', css: 'A4', widthIn: 8.27, heightIn: 11.69 },
  thermal80: { label: 'Thermal 80mm', labelBn: 'থার্মাল ৮০ মিমি', css: '80mm auto', widthIn: 3.15, heightIn: null },
};

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

const money = (n: number) => '৳' + Math.round(n * 100) / 100;

/** Complete, self-contained HTML document for one cash memo (used for preview and printing). */
export function buildReceiptHtml(order: SaleOrder, settings: AppSettings, paper: ReceiptPaper): string {
  const b = settings.business;
  const spec = PAPER_SPECS[paper];
  const thermal = paper === 'thermal80';

  const rows = order.items
    .map((item, i) => {
      const rate = item.customPrice ?? item.product.salePrice;
      const warranty = item.product.warranty || (item.product.category === 'electric' ? '' : '');
      return `<tr>
        <td class="c">${i + 1}</td>
        <td>
          <div class="nm">${esc(item.product.nameBn || item.product.name)}</div>
          <div class="sub">${esc(item.product.quality || '')}${item.note ? ' • ' + esc(item.note) : ''}</div>
        </td>
        ${thermal ? '' : `<td class="c">${esc(warranty || '—')}</td>`}
        <td class="c">${item.quantity} ${esc(item.product.unit || '')}</td>
        <td class="r">${money(rate)}</td>
        <td class="r b">${money(item.subtotal)}</td>
      </tr>`;
    })
    .join('');

  const paid = order.dueAmount > 0
    ? `<tr class="due"><td>বাকি (খাতাভুক্ত)</td><td class="r">${money(order.dueAmount)}</td></tr>`
    : `<tr class="ok"><td colspan="2" class="r">✓ সম্পূর্ণ পরিশোধিত</td></tr>`;

  return `<!doctype html><html lang="bn"><head><meta charset="utf-8"><title>${esc(order.invoiceNo)}</title>
<style>
  @page { size: ${spec.css}; margin: ${thermal ? '3mm' : '8mm'}; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body { font-family: system-ui, -apple-system, 'Segoe UI', 'Nirmala UI', 'Noto Sans Bengali', Roboto, sans-serif; color: #111; font-size: ${thermal ? '11px' : '12px'}; line-height: 1.35; }
  @media screen { body { padding: ${thermal ? '3mm' : '8mm'}; } }
  .page { width: 100%; ${thermal ? '' : `min-height: calc(${spec.heightIn}in - 16mm);`} display: flex; flex-direction: column; }
  .head { text-align: center; border-bottom: 2px solid #111; padding-bottom: 6px; }
  .head h1 { margin: 0; font-size: ${thermal ? '16px' : '22px'}; letter-spacing: .3px; }
  .head p { margin: 1px 0; font-size: ${thermal ? '10px' : '11px'}; color: #333; }
  .title { text-align: center; margin: 8px 0; }
  .title span { display: inline-block; border: 1.5px solid #111; border-radius: 99px; padding: 2px 16px; font-weight: 800; font-size: 12px; letter-spacing: .5px; }
  .meta { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  .meta td { padding: 2px 0; vertical-align: top; }
  .meta td.l { color: #555; width: 22%; white-space: nowrap; }
  .meta td.v { font-weight: 600; width: 28%; }
  table.items { width: 100%; border-collapse: collapse; }
  table.items th { background: #f1f1f1; border: 1px solid #999; padding: 4px 5px; font-size: 10.5px; text-align: left; }
  table.items td { border: 1px solid #bbb; padding: 4px 5px; vertical-align: top; }
  .nm { font-weight: 700; }
  .sub { font-size: 10px; color: #555; }
  .c { text-align: center; } .r { text-align: right; } .b { font-weight: 700; }
  .totals { margin-top: 8px; margin-left: auto; width: ${thermal ? '100%' : '55%'}; border-collapse: collapse; }
  .totals td { padding: 2px 4px; }
  .totals .grand td { border-top: 1.5px solid #111; border-bottom: 1.5px solid #111; font-weight: 800; font-size: 14px; padding: 4px; }
  .totals .due td { color: #b00020; font-weight: 800; }
  .totals .ok td { color: #0a7a3d; font-weight: 700; }
  .grow { flex: 1; }
  .sign { display: flex; justify-content: space-between; margin-top: 34px; font-size: 10.5px; }
  .sign div { width: 40%; border-top: 1px solid #111; text-align: center; padding-top: 3px; }
  .foot { text-align: center; margin-top: 10px; font-size: 10.5px; color: #333; border-top: 1px dashed #888; padding-top: 6px; }
  .foot small { display: block; color: #888; margin-top: 2px; font-size: 9px; }
</style></head><body><div class="page">
  <div class="head">
    <h1>${esc(b.name)}</h1>
    ${b.tagline ? `<p>${esc(b.tagline)}</p>` : ''}
    <p>${esc(b.address)}</p>
    <p><b>মোবাইল:</b> ${esc(b.phone)}${b.altPhone ? ', ' + esc(b.altPhone) : ''}${b.email ? ' • ' + esc(b.email) : ''}</p>
    ${b.vatRegNo ? `<p>${esc(b.vatRegNo)}</p>` : ''}
  </div>
  <div class="title"><span>ক্যাশ মেমো / CASH MEMO</span></div>
  <table class="meta">
    <tr><td class="l">মেমো নং:</td><td class="v">${esc(order.invoiceNo)}</td><td class="l">তারিখ:</td><td class="v">${esc(order.date)}</td></tr>
    <tr><td class="l">ক্রেতা:</td><td class="v">${esc(order.customerName || 'নগদ ক্রেতা')}</td><td class="l">ফোন:</td><td class="v">${esc(order.customerPhone || '—')}</td></tr>
    <tr><td class="l">বিক্রয়কর্মী:</td><td class="v">${esc(order.servedBy)}</td><td class="l">পেমেন্ট:</td><td class="v">${esc(order.paymentMethod.toUpperCase())}</td></tr>
  </table>
  <table class="items">
    <thead><tr>
      <th class="c" style="width:6%">#</th>
      <th>বিবরণ / অবস্থা</th>
      ${thermal ? '' : '<th class="c" style="width:16%">ওয়ারেন্টি</th>'}
      <th class="c" style="width:13%">পরিমাণ</th>
      <th class="r" style="width:14%">দর</th>
      <th class="r" style="width:16%">মোট</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <table class="totals">
    <tr><td>সাবটোটাল</td><td class="r">${money(order.subtotal)}</td></tr>
    ${order.discount > 0 ? `<tr><td>ছাড়</td><td class="r">- ${money(order.discount)}</td></tr>` : ''}
    ${order.tax > 0 ? `<tr><td>ভ্যাট</td><td class="r">+ ${money(order.tax)}</td></tr>` : ''}
    <tr class="grand"><td>সর্বমোট</td><td class="r">${money(order.total)}</td></tr>
    <tr><td>পরিশোধিত</td><td class="r">${money(order.paidAmount)}</td></tr>
    ${paid}
  </table>
  ${order.notes ? `<p style="margin-top:8px"><b>নোট:</b> ${esc(order.notes)}</p>` : ''}
  <div class="grow"></div>
  ${thermal ? '' : '<div class="sign"><div>ক্রেতার স্বাক্ষর</div><div>বিক্রেতার স্বাক্ষর</div></div>'}
  <div class="foot">${esc(b.footerNote)}<small>বিক্রিত পণ্য ওয়ারেন্টি শর্ত সাপেক্ষে ফেরতযোগ্য • Software by ibtipoint</small></div>
</div></body></html>`;
}
