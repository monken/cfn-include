const { name } = require('./package.json');

module.exports = require('debug-fabulous').spawnable(name);
