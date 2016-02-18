var include = require('../index'),
  assert = require('assert'),
  fs = require('fs');

var tests = ['map', 'literal', 'location'];
if(process.env['TEST_S3']) tests.push('s3');

//var tests = ['map'];

tests.forEach(function(file) {
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
