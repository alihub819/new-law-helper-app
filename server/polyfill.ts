// Polyfill DOMMatrix for pdfjs-dist in Node.js environments
if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {} as any;
}