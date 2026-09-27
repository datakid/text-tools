export function parseDelimitedLine(line, delim) {
  const cells = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delim) {
      cells.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  cells.push(cur);
  return cells;
}

export function escapeDelimitedField(value, delim) {
  const s = value === undefined || value === null ? '' : String(value);
  const pattern = new RegExp(`[${delim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\n]`);
  return pattern.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
