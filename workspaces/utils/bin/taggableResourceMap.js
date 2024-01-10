#!/usr/bin/env node
const taggable = require('../src/resources/taggable');

(async () => {
  const _map = await taggable.getResourceMap();
  process.stdout.write(`${JSON.stringify(_map)}\n`);
})();
