const LINE_HEIGHT = 20;
const OVERSCAN = 12;

export function createVirtualText(container) {
  container.innerHTML = `
    <div class="vtext-scroller">
      <div class="vtext-spacer"></div>
      <div class="vtext-viewport"></div>
    </div>
  `;
  const scroller = container.querySelector('.vtext-scroller');
  const spacer = container.querySelector('.vtext-spacer');
  const viewport = container.querySelector('.vtext-viewport');

  let totalLines = 0;
  let fetchLines = null;
  let highlightRanges = [];
  let requestToken = 0;

  function setSource(total, fetch) {
    totalLines = total;
    fetchLines = fetch;
    spacer.style.height = `${totalLines * LINE_HEIGHT}px`;
    scroller.scrollTop = 0;
    render();
  }

  function setHighlights(ranges) {
    highlightRanges = ranges;
    render();
  }

  function scrollToLine(lineIndex) {
    scroller.scrollTop = Math.max(0, lineIndex * LINE_HEIGHT - scroller.clientHeight / 2);
  }

  async function render() {
    const myToken = ++requestToken;
    if (!fetchLines || totalLines === 0) {
      viewport.innerHTML = '';
      return;
    }
    const scrollTop = scroller.scrollTop;
    const viewHeight = scroller.clientHeight || 1;
    const first = Math.max(0, Math.floor(scrollTop / LINE_HEIGHT) - OVERSCAN);
    const last = Math.min(totalLines, Math.ceil((scrollTop + viewHeight) / LINE_HEIGHT) + OVERSCAN);

    const lines = await fetchLines(first, last);
    if (myToken !== requestToken) return;

    viewport.style.transform = `translateY(${first * LINE_HEIGHT}px)`;
    viewport.innerHTML = '';
    const frag = document.createDocumentFragment();
    lines.forEach((line, i) => {
      const row = document.createElement('div');
      row.className = 'vtext-row';
      row.style.height = `${LINE_HEIGHT}px`;

      const gutter = document.createElement('span');
      gutter.className = 'vtext-gutter';
      gutter.textContent = String(first + i + 1);

      const content = document.createElement('span');
      content.className = 'vtext-content';
      content.innerHTML = renderLine(line, highlightRanges, first + i);

      row.appendChild(gutter);
      row.appendChild(content);
      frag.appendChild(row);
    });
    viewport.appendChild(frag);
  }

  function renderLine(line, ranges, lineIndex) {
    const hits = ranges.filter((r) => r.line === lineIndex).sort((a, b) => a.col - b.col);
    if (hits.length === 0) return escapeHtml(line);
    let out = '';
    let cursor = 0;
    for (const hit of hits) {
      if (hit.col < cursor) continue;
      out += escapeHtml(line.slice(cursor, hit.col));
      out += `<mark>${escapeHtml(line.slice(hit.col, hit.col + hit.len))}</mark>`;
      cursor = hit.col + hit.len;
    }
    out += escapeHtml(line.slice(cursor));
    return out;
  }

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  scroller.addEventListener('scroll', () => render());

  return { setSource, setHighlights, scrollToLine, refresh: render, lineHeight: LINE_HEIGHT };
}
