#!/usr/bin/env node

var _ = require('lodash'),
  yaml = require('js-yaml'),
  exec = require('child_process').execSync,
  package = require('../package.json'),
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
    yaml: {
      help: 'output yaml instead of json',
      default: false,
      flag: true,
      abbr: 'y',
    },
    version: {
      flag: true,
      help: 'print version and exit',
      callback: function() {
        console.log(package.version);
        process.exit(0);
      }
    },
  }).parse(),
  path = require('path'),
  include = require('../index'),
  pathParse = require('path-parse'),
  Promise = require('bluebird');

var location, protocol = opts.path.match(/^\w+:\/\//);
if (protocol) location = opts.path;
else if (pathParse(opts.path).root) location = 'file://' + opts.path;
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
    var cfn = new(require('aws-sdk-proxy').CloudFormation)({
      region: 'us-east-1'
    });
    promise = Promise.promisify(cfn.validateTemplate).call(cfn, {
      TemplateBody: JSON.stringify(template),
    });
  }
  return promise.then(function(res) {
    console.log(opts.yaml ? yaml.safeDump(template) : JSON.stringify(template, null, opts.minimize ? null : 2));
  }, function(err) {
    console.error('Validation failed:', err.message);
    process.exit(1);
  });
}).catch(function(err) {
  console.error(err);
  process.exit(1);
});
