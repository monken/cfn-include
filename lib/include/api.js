var _ = require('lodash'),
  Promise = require('bluebird'),
  AWS = require('aws-sdk-proxy'),
  jmespath = require('jmespath');

module.exports = function(args) {
  var service = new AWS[args.service](args.region ? { region: args.region } : null);
  action = Promise.promisify(service[args.action]);
  return action.call(service, args.parameters ? args.parameters : {}).then(function(res) {
    return args.query ? jmespath.search(res, args.query) : res;
  });
}
