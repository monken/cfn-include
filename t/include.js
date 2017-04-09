var include = require('../index'),
  assert = require('assert'),
  fs = require('fs');

var tests = [
  'location.json',
  'literal.json',
  'string.json',
  'map.json',
  'flatten.json',
  'jmespath.json',
  'merge.json',
  'errors.js',
  'yaml.js',
];
if(process.env['TEST_AWS']) tests.push('s3.json', 'api.js');

//var tests = ['yaml.js'];

tests.forEach(function(file) {
  var tests = require('./tests/' + file);
  for (var category in tests) {
    describe(category, function() {
      tests[category].forEach(function(test) {
        it(test.name || 'include', function(done) {
          include({
            template: test.template,
            url: 'file://' + __dirname + '/template.json',
          }).then(function(json) {
            typeof(test.output) === 'function' ? assert.ok(test.output(json) === true) : assert.deepEqual(json, test.output);
            done();
          }).catch(test.catch ? function(err) {
            assert.ok(test.catch(err) === true);
            done();
          } : done);
        });
      });
    });
  }
});
