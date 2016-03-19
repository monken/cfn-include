var include = require('../index'),
  assert = require('assert'),
  fs = require('fs'),
  exec = require('child_process').execSync; // execFileSync is only available in Node > 0.10 :-(

['cli'].forEach(function(file) {
  var tests = require('./tests/' + file + '.json');
  for (var category in tests) {
    describe(category, function() {
      tests[category].forEach(function(test) {
        it(test.name || 'include', function(done) {
          var out = exec('node bin/cli.js ' + test.template);
          var json = JSON.parse(out.toString());
          delete json.Metadata;
          assert.deepEqual(json, test.output);
          done();
        });
      });
    });
  }
});
