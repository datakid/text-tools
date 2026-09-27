import { runTests } from './run.js';

const results = document.getElementById('results');
try {
  const result = await runTests();
  results.textContent = result.output;
  results.dataset.fail = String(result.fail);
  document.title = `Sluice tests · ${result.pass} passed · ${result.fail} failed`;
  console.log(`Sluice tests: ${result.pass} passed, ${result.fail} failed`);
} catch (error) {
  results.textContent = `Test runner failed: ${error.stack || error.message}`;
  console.error(error);
}
