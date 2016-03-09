#!/usr/bin/env node

var _ = require('lodash'),
  exec = require('child_process').execSync,
  opts = require('nomnom').script('cfn-include').options({
    path: {
      position: 0,
      help: 'location of template. Either path to a local file, URL or file on an S3 bucket (e.g. s3://bucket-name/example.template)',
      required: true,
    },
    minimize: {
      help: 'minimize JSON output',
      default: false,
      flag: true,
      abbr: 'm',
    },
    validate: {
      help: 'validate compiled template',
      default: false,
      flag: true,
      abbr: 't',
    },
  }).parse(),
  path = require('path'),
  include = require('cfn-include'),
  Promise = require('bluebird');

var location, protocol = opts.path.match(/^\w+:\/\//);
if (protocol) location = opts.path;
else if (path.isAbsolute(opts.path)) location = 'file://' + opts.path;
else location = 'file://' + path.join(process.cwd(), opts.path);

include({
  url: location
}).then(function(template) {
  var promise = Promise.resolve();
  try {
    var stdout = exec('git log -n 1 --pretty=%H', {
      stdio: [0, 'pipe', 'ignore']
    }).toString().trim();
  } catch (e) {}
  _.defaultsDeep(template, {
    Metadata: {
      CfnInclude: {
        GitCommit: stdout,
        BuildDate: new Date().toISOString()
      }
    }
  });
  if (opts.validate) {
    var cfn = new(require('cfn-include/aws-sdk-proxy').CloudFormation)({
      region: 'us-east-1'
    });
    promise = Promise.promisify(cfn.validateTemplate).call(cfn, {
      TemplateBody: JSON.stringify(template),
    });
  }
  promise.then(function(res) {
    console.log(JSON.stringify(template, null, opts.minimize ? null : 2));
  }, function(err) {
    console.error('Validation failed:', err.message);
    process.exit(1);
  });
});
