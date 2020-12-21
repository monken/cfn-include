var _ = require('lodash'),
  AWS = require('aws-sdk-proxy'),
  jmespath = require('jmespath')
  { getParser } = require('./query');

module.exports = function(args) {
  var service = new AWS[args.service](args.region ? { region: args.region } : null);
  return service[args.action](args.parameters ? args.parameters : {}).promise().then(function(res) {
    return args.query ? getParser(args.parser)(res, args.query) : res;
  });
}
