var include = require('../index'),
  _ = require('lodash'),
  assert = require('assert'),
  fs = require('fs'),
  exec = require('child_process').execFile;

['cli'].forEach(function (file) {
  var tests = require('./tests/' + file + '.json');
  for (var category in tests) {
    describe(category, function () {
      tests[category].forEach(function (test) {
        it(test.name || 'include', function (done) {
          let cliArgs = test.template ? ['bin/cli.js', test.template] : ['bin/cli.js'];
          if (test.args) {
            cliArgs = cliArgs.concat(test.args);
          }
          if (test.env) {
            Object.assign(process.env, test.env);
          }
          // console.log({cliArgs})
          var proc = exec('node', cliArgs,
            function (err, out, stderr) {
              if (test.exitCode) {
                assert.ok(stderr.match(new RegExp(test.errorMessage)));
                assert.equal(test.exitCode, err.code);
                return done();
              }
              var json = JSON.parse(out.toString());
              delete json.Metadata;
              assert.deepEqual(json, test.output);
              if (test.env) {
                _.omit(process.env, Object.keys(test.env));
              }
              done();
            });
          if (test.stdin) {
            proc.stdin.write(test.stdin);
            proc.stdin.end();
          };
        });
      });
    });
  }
});
