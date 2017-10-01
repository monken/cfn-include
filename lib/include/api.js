var _ = require('lodash'),
  AWS = require('aws-sdk-proxy'),
  jmespath = require('jmespath');

module.exports = function(args) {
  var service = new AWS[args.service](args.region ? { region: args.region } : null);
  return service[args.action](args.parameters ? args.parameters : {}).promise().then(function(res) {
    return args.query ? jmespath.search(res, args.query) : res;
  });
}
