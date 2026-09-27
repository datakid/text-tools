import { escapeHtml } from './escape.js';

export function renderStatsTable(container, docsMeta) {
  const totals = docsMeta.reduce(
    (acc, d) => ({ lines: acc.lines + d.lines, chars: acc.chars + d.chars, bytes: acc.bytes + d.bytes }),
    { lines: 0, chars: 0, bytes: 0 }
  );

  const rows = docsMeta
    .map(
      (d) =>
        `<tr><td>${escapeHtml(d.name)}</td><td>${d.lines.toLocaleString()}</td><td>${d.chars.toLocaleString()}</td><td>${d.bytes.toLocaleString()}</td></tr>`
    )
    .join('');

  container.innerHTML = `
    <table class="stats-table">
      <thead><tr><th>Doc</th><th>Lines</th><th>Chars</th><th>Bytes</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr class="stats-total">
          <td>${docsMeta.length} docs</td>
          <td>${totals.lines.toLocaleString()}</td>
          <td>${totals.chars.toLocaleString()}</td>
          <td>${totals.bytes.toLocaleString()}</td>
        </tr>
      </tfoot>
    </table>
  `;
}
