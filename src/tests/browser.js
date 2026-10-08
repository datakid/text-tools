import { runAll } from './run.js';
import { renderReport } from './harness.js';

const root = document.getElementById('report');
const status = document.getElementById('status');
try {
  const report = await runAll();
  renderReport(root, report, 'Sluice unit & operation tests');
  document.title = `Sluice tests \u00b7 ${report.pass} passed \u00b7 ${report.fail} failed`;
  document.documentElement.dataset.done = 'true';
  console.log(`Sluice tests: ${report.pass} passed, ${report.fail} failed in ${report.ms} ms`);
  for (const s of report.results) for (const t of s.tests) if (!t.ok) console.error(`FAIL ${s.name} \u203a ${t.name}: ${t.error}`);
} catch (error) {
  root.textContent = `Test runner failed: ${error.stack || error.message}`;
  document.documentElement.dataset.done = 'true';
  console.error(error);
} finally {
  status?.remove();
}
