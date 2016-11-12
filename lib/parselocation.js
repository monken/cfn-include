var _ = require('lodash');

module.exports = function parseLocation(location) {
  if(!location) return {};
  var parsed = location.match(/^(((\w+):)?\/\/)?(.*?)([\\\/](.*))?$/);
  return {
    protocol: parsed[3],
    host: parsed[4],
    path: parsed[5],
    relative: _.isUndefined(parsed[1]) ? true : false,
    raw: location,
  };
}
