const { get } = require('lodash')
const { search } = require('jmespath')

// this exists cause in most cases lodash get is plenty sufficient
// also this bug / error in jmespath is rediculous https://github.com/jmespath/jmespath.js/issues/35
const queryParsers = {
  lodash: get,
  jmespath: search,
  default: search,
};

function getParser(type) {
  return queryParsers[type] || queryParsers.default;
}

module.exports = { getParser };