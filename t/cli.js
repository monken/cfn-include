var include = require('../index'),
  assert = require('assert'),
  fs = require('fs'),
  exec = require('child_process').execFile;

['cli'].forEach(function (file) {
  var tests = require('./tests/' + file + '.json');
  for (var category in tests) {
    describe(category, function () {
      tests[category].forEach(function (test) {
        it(test.name || 'include', function (done) {
          var proc = exec('node',
            test.template ? ['bin/cli.js', test.template] : ['bin/cli.js'],
            function (err, out, stderr) {
              if (test.exitCode) {
                assert.ok(stderr.match(new RegExp(test.errorMessage)));
                assert.equal(test.exitCode, err.code);
                return done();
              }
              var json = JSON.parse(out.toString());
              delete json.Metadata;
              assert.deepEqual(json, test.output);
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
