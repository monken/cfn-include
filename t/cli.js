const assert = require('assert');
const exec = require('child_process').execFile;

const extendEnv = require('./tests/extendEnv');

['cli'].forEach(function (file) {
  // eslint-disable-next-line global-require, import/no-dynamic-require
  const tests = require(`./tests/${file}.json`);
  // eslint-disable-next-line guard-for-in, no-restricted-syntax
  for (const category in tests) {
    describe(category, function () {
      tests[category].forEach(function (test) {
        const fn = test.only ? it.only : it;
        fn(test.name || 'include', function (done) {
          let cliArgs = test.template ? ['bin/cli.js', test.template] : ['bin/cli.js'];
          if (test.args) {
            cliArgs = cliArgs.concat(test.args);
          }
          extendEnv(test.env, () => {
            // console.log({ cliArgs });
            const proc = exec('node', cliArgs, function (err, out, stderr) {
              // console.log({ out });
              if (test.exitCode) {
                assert.ok(stderr.match(new RegExp(test.errorMessage)), 'stderr match');
                assert.equal(test.exitCode, err.code, 'exit code');
                return done();
              }
              // console.log({out: out.toString()})
              out = out || '{}'; // fix for empty output to see failed test
              const json = JSON.parse(out.toString());
              delete json.Metadata;
              assert.deepEqual(json, test.output);
              done();
            });
            if (test.stdin) {
              proc.stdin.write(test.stdin);
              proc.stdin.end();
            }
          });
        });
      });
    });
  }
});
