const minify = require('jsonminify');
const yaml = require('js-yaml');
const yamlSchema = require('./schema');

module.exports = {
  load: (res) => {
    let json;
    try {
      json = yaml.safeLoad(res, { schema: yamlSchema });
    } catch (yamlErr) {
      try {
        json = JSON.parse(minify(res));
      } catch (jsonErr) {
        const err = new Error([yamlErr, jsonErr]);
        err.name = 'SyntaxError';
        throw err;
      }
    }
    return json;
  },
  dump: (obj, opts) => yaml.safeDump(obj, { sortKeys: true, ...opts }),
};
