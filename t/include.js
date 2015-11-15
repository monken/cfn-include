var include = require('../index'),
  tests = require('./tests.json'),
  assert = require('assert');

for (var category in tests) {
  describe(category, function() {
    tests[category].forEach(function(test) {
      it('include', function(done) {
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
