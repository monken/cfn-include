var jsmin = require('jsmin').jsmin,
  yaml = require('js-yaml'),
  yamlSchema = require('./schema');

module.exports = {
  load: function (res) {
    var json;
    try {
      json = yaml.safeLoad(res, { schema: yamlSchema });
    } catch(yamlErr) {
      try {
        json = JSON.parse(jsmin(res));
      } catch(jsonErr) {
        var err = new Error([yamlErr, jsonErr]);
        err.name = 'SyntaxError';
        throw err;
      }
    }
    return json;
  },
  dump: function(obj) {
    return yaml.safeDump(obj, {
      sortKeys: true,
    })
  }
}