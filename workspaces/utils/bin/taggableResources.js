#!/usr/bin/env node
const taggable = require('../src/resources/taggable');

(async () => {
  const resouces = await taggable.getResources();
  process.stdout.write(`${JSON.stringify(resouces)}\n`);
})();
