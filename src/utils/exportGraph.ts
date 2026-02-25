/**
 * Export the architecture graph as SVG or PNG.
 *
 * CSS `var()` references inside the SVG are resolved to their computed values
 * so the exported file renders correctly without the page stylesheet.
 */

function resolveVarsInElement(el: Element, computed: CSSStyleDeclaration) {
  for (const attr of el.getAttributeNames()) {
    const val = el.getAttribute(attr);
    if (val && val.includes('var(')) {
      const resolved = val.replace(/var\((--[^)]+)\)/g, (_match, varName: string) => {
        return computed.getPropertyValue(varName).trim() || varName;
      });
      el.setAttribute(attr, resolved);
    }
  }
  for (const child of Array.from(el.children)) {
    resolveVarsInElement(child, computed);
  }
}

function prepareSvg(
  svgEl: SVGSVGElement,
  totalWidth: number,
  totalHeight: number,
  padding = 40,
): SVGSVGElement {
  const clone = svgEl.cloneNode(true) as SVGSVGElement;

  // Resolve CSS custom properties
  const computed = getComputedStyle(document.documentElement);
  resolveVarsInElement(clone, computed);

  // Remove the transform group's pan/zoom and replace with a fixed offset
  const g = clone.querySelector('g');
  if (g) {
    g.setAttribute('transform', `translate(${padding}, ${padding})`);
  }

  const w = totalWidth + padding * 2;
  const h = totalHeight + padding * 2;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(w));
  clone.setAttribute('height', String(h));
  clone.setAttribute('viewBox', `0 0 ${w} ${h}`);

  // Set background
  const bgColor = computed.getPropertyValue('--canvas-bg').trim() || '#f0f0f0';
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('width', '100%');
  bg.setAttribute('height', '100%');
  bg.setAttribute('fill', bgColor);
  clone.insertBefore(bg, clone.firstChild);

  // Add font style
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  const fontFamily = computed.getPropertyValue('--font-family').trim() ||
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  style.textContent = `text { font-family: ${fontFamily}; }`;
  clone.insertBefore(style, clone.firstChild);

  return clone;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportSVG(
  svgEl: SVGSVGElement,
  totalWidth: number,
  totalHeight: number,
  filename = 'architecture',
) {
  const clone = prepareSvg(svgEl, totalWidth, totalHeight);
  const serializer = new XMLSerializer();
  const svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + serializer.serializeToString(clone);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  downloadBlob(blob, filename + '.svg');
}

export function exportPNG(
  svgEl: SVGSVGElement,
  totalWidth: number,
  totalHeight: number,
  filename = 'architecture',
  scale = 2,
) {
  const clone = prepareSvg(svgEl, totalWidth, totalHeight);
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);

  const w = totalWidth + 80;
  const h = totalHeight + 80;

  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0, w, h);
    canvas.toBlob(
      pngBlob => {
        if (pngBlob) downloadBlob(pngBlob, filename + '.png');
        URL.revokeObjectURL(url);
      },
      'image/png',
    );
  };
  img.onerror = () => URL.revokeObjectURL(url);
  img.src = url;
}
