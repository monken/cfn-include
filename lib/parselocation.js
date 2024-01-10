var { isUndefined } = require('lodash');

module.exports = function parseLocation(location) {
  if(!location) return {};
  if (!location.match) {
    console.error('location.match is not a function', location);
  }
  var parsed = location.match(/^(((\w+):)?\/\/)?(.*?)([\\\/](.*))?$/);

  return {
    protocol: parsed[3],
    host: parsed[4],
    path: parsed[5],
    relative: isUndefined(parsed[1]),
    raw: location,
  };
}
