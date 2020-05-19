const assert = require('assert').strict;

function upperCamelCase(str) {
  assert(typeof str === 'string', 'argument to upper/lowerCamelCase must be a string');
  return str
      .split(/[\._-\s]+/)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
      .join('');
}

function lowerCamelCase(str) {
  const upper = upperCamelCase(str);
  return upper.charAt(0).toLowerCase() + upper.slice(1);
}

module.exports = {
  lowerCamelCase,
  upperCamelCase,
};
