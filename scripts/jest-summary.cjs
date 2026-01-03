const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function pct(part, total) {
  if (!total) return '0.00%';
  return `${((part / total) * 100).toFixed(2)}%`;
}

function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const jestBin = path.join(projectRoot, 'node_modules', 'jest', 'bin', 'jest.js');
  const resultsFile = path.join(projectRoot, '.jest-results.json');

  if (!fs.existsSync(jestBin)) {
    console.error('Cannot find Jest binary. Run `npm i` first.');
    process.exitCode = 1;
    return;
  }

  // Run jest and write JSON output to a file so we can reliably parse it on Windows.
  const args = [
    jestBin,
    '--json',
    `--outputFile=${resultsFile}`,
    // Keep output minimal; summary is printed below.
    '--silent',
  ];

  const run = spawnSync(process.execPath, args, {
    cwd: projectRoot,
    stdio: 'inherit',
    env: process.env,
  });

  // Even if tests failed, Jest should still write the results file.
  if (!fs.existsSync(resultsFile)) {
    console.error('Jest did not produce results file:', resultsFile);
    process.exitCode = run.status ?? 1;
    return;
  }

  const raw = fs.readFileSync(resultsFile, 'utf8');
  let results;
  try {
    results = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse Jest JSON results:', e?.message || e);
    process.exitCode = 1;
    return;
  } finally {
    // Best-effort cleanup
    try {
      fs.unlinkSync(resultsFile);
    } catch {
      // ignore
    }
  }

  const totalSuites = results.numTotalTestSuites ?? 0;
  const passedSuites = results.numPassedTestSuites ?? 0;
  const failedSuites = results.numFailedTestSuites ?? 0;

  const totalTests = results.numTotalTests ?? 0;
  const passedTests = results.numPassedTests ?? 0;
  const failedTests = results.numFailedTests ?? 0;

  console.log('');
  console.log('=== Jest Summary ===');
  console.log(
    `Test suites: ${passedSuites}/${totalSuites} passed (${pct(passedSuites, totalSuites)})` +
      (failedSuites ? `, ${failedSuites} failed` : ''),
  );
  console.log(
    `Tests:       ${passedTests}/${totalTests} passed (${pct(passedTests, totalTests)})` +
      (failedTests ? `, ${failedTests} failed` : ''),
  );

  // Preserve Jest exit code semantics
  process.exitCode = run.status ?? 1;
}

main();
