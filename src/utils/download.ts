/** Blob URLs for the downloadable deliverables (the page is a single self-contained HTML file). */

export function base64ToBlobUrl(b64: string, type: string): string {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type }));
}

export function textToBlobUrl(text: string, type = "text/plain;charset=utf-8"): string {
  return URL.createObjectURL(new Blob([text], { type }));
}
