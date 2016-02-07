var include = require('../index'),
  assert = require('assert'),
  fs = require('fs');


['literal', 'location'].forEach(function(file) {
  var tests = require('./tests/' + file + '.json');
  for (var category in tests) {
    describe(category, function() {
      tests[category].forEach(function(test) {
        it(test.name || 'include', function(done) {
          include({
            template: test.template,
            url: 'file://' + __dirname + '/template.json',
          }).then(function(json) {
            assert.deepEqual(json, test.output);
            done();
          });
        });
      });
    });
  }
});
