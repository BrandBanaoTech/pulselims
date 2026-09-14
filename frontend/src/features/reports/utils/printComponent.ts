// features/reports/utils/printComponent.ts

export const printComponent = async (
  targetElement: HTMLElement | null,
  options: { pageTitle?: string; pageSize?: string; margin?: string } = {}
) => {
  if (!targetElement) return;

  const iframe = document.createElement("iframe");
  
  // FIX: Give iframe explicit width off-screen so responsive CSS compiles cleanly
  iframe.style.position = "fixed";
  iframe.style.left = "-9999px";
  iframe.style.top = "-9999px";
  iframe.style.width = "1024px"; // Prevents layout collapsing to mobile view
  iframe.style.height = "1448px";
  iframe.style.border = "0";

  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document;
  if (!iframeDoc) return;

  iframeDoc.title = options.pageTitle || "Lab Report";

  // Clone active document styles
  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));
  styles.forEach((style) => iframeDoc.head.appendChild(style.cloneNode(true)));

  // Force sharp high-DPI colors and print rules
  const printCss = iframeDoc.createElement("style");
  printCss.textContent = `
    @page { 
      size: ${options.pageSize || 'A4'}; 
      margin: ${options.margin || '8mm'}; 
    }
    *, *::before, *::after {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      background: #ffffff !important;
      margin: 0 !important;
      padding: 0 !important;
    }
  `;
  iframeDoc.head.appendChild(printCss);

  // Append cloned node
  const clone = targetElement.cloneNode(true);
  iframeDoc.body.appendChild(clone);

  // Wait for font rendering
  if (iframeDoc.fonts) {
    await iframeDoc.fonts.ready;
  }

  iframe.contentWindow?.focus();
  iframe.contentWindow?.print();

  setTimeout(() => {
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
  }, 1000);
};