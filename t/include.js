var include = require('../index'),
  assert = require('assert'),
  fs = require('fs');

const yaml = require('../lib/yaml');
const { posix } = require('path');


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
  'stringify.json',
  'env.js',
  'outputs.json',
  'camelcase.yml',
  'jmespath.yml',
  'sequence.yml',
  'deepmerge.yml',
  'extendedmaps.json',
];
if(process.env['TEST_AWS']) tests.push('s3.json', 'api.js');

process.env.README = 'readme';

tests.forEach(function(file) {
  var testFile = posix.extname(file) === '.js' ? require('./tests/' + file) : yaml.load(fs.readFileSync('t/tests/' + file));
  for (var category in testFile) {
    describe(category, function() {
      testFile[category].forEach(function(test) {
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
