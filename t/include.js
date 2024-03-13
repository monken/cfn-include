const assert = require('assert');
const fs = require('fs');
const { posix } = require('path');
const include = require('../index');
const extendEnv = require('./tests/extendEnv');

const yaml = require('../lib/yaml');

const tests = [
  'inject.json',
  'globs.json',
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
  'lodash.yml',
  'sequence.yml',
  'deepmerge.yml',
  'extendedmaps.json',
  'omit.json',
  'omitEmpty.json',
  'ifeval.js',
  'amzn-intrinsic.yml',
  'joinNow.yml',
  'applyTags.yml',
];
if (process.env.TEST_AWS) tests.push('s3.json');

process.env.README = 'readme';

tests.forEach(function (file) {
  const testFile =
    posix.extname(file) === '.js'
      ? // eslint-disable-next-line global-require, import/no-dynamic-require
        require(`./tests/${file}`)
      : yaml.load(fs.readFileSync(`t/tests/${file}`));
  // eslint-disable-next-line guard-for-in, no-restricted-syntax
  for (const category in testFile) {
    describe(file, function () {
      testFile[category].forEach(function (test) {
        const fn = test.only ? it.only : it;
        const opts = {
          template: test.template,
          // eslint-disable-next-line n/no-path-concat
          url: `file://${__dirname}/template.json`,
          doEnv: !!test.doEnv || false,
        };
        if (test.inject) {
          opts.inject = test.inject;
        }
        // console.log(opts);
        fn(test.name || 'include', function (done) {
          extendEnv(test.doEnv, () => {
            include(opts)
              .then(function (json) {
                typeof test.output === 'function'
                  ? assert.ok(test.output(json) === true)
                  : assert.deepEqual(json, test.output);
                done();
              })
              .catch(
                test.catch
                  ? function (err) {
                      assert.ok(test.catch(err) === true);
                      done();
                    }
                  : done
              );
          });
        });
      });
    });
  }
});
