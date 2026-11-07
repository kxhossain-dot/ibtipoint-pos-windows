export interface PrintMemoOptions {
  frame: HTMLIFrameElement | null;
  html: string;
  paperCss: string;
  widthIn: number;
  heightIn: number | null;
  name: string;
}

/** Windows app: build a PDF of the memo and open it in the PDF viewer (Edge etc.) which shows a print preview. */
export async function printMemo(o: PrintMemoOptions): Promise<void> {
  const bridge = (window as any).ibtipoint;
  if (bridge?.previewMemoPdf) {
    await bridge.previewMemoPdf(o.html, o.name);
    return;
  }
  // Browser fallback (dev server)
  const win = o.frame?.contentWindow;
  if (!win) throw new Error('Preview not ready');
  win.focus();
  win.print();
}
