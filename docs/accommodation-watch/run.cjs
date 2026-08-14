'use strict';

const path = require('path');
const { runWatcher } = require('./watcher.cjs');

function parseArgs(argv) {
  const options = { mode: 'quick', inputPath: null, consumeNotifications: true };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--mode') options.mode = argv[++index];
    else if (value === '--input') options.inputPath = argv[++index];
    else if (value === '--dry-notifications') options.consumeNotifications = false;
    else if (value === '--help') options.help = true;
    else throw new Error(`未知參數: ${value}`);
  }
  if (!['quick', 'full'].includes(options.mode)) throw new Error('--mode 只能是 quick 或 full');
  return options;
}

const options = parseArgs(process.argv.slice(2));
if (options.help) {
  console.log('node docs/accommodation-watch/run.cjs --mode quick|full [--input observations.json] [--dry-notifications]');
  process.exit(0);
}

const watchDir = __dirname;
const result = runWatcher({
  watchDir,
  mode: options.mode,
  inputPath: options.inputPath ? path.resolve(options.inputPath) : null,
  consumeNotifications: options.consumeNotifications,
});

console.log(`[accommodation-watch] ${result.runRecord.result}`);
console.log(`[accommodation-watch] mode=${result.runRecord.mode} targets=${result.runRecord.target_property_ids.length} appended=${result.runRecord.observations_appended}`);
console.log(`[accommodation-watch] report=${path.join(watchDir, 'latest-report.txt')}`);
console.log(`[accommodation-watch] page=${result.siteFile}`);
