#!/usr/bin/env node

var _ = require('lodash'),
  yaml = require('../lib/yaml'),
  exec = require('child_process').execSync,
  package = require('../package.json'),
  env = process.env,
  opts = require('nomnom').script('cfn-include').options({
    path: {
      position: 0,
      help: 'location of template. Either path to a local file, URL or file on an S3 bucket (e.g. s3://bucket-name/example.template)',
      required: false,
    },
    minimize: {
      help: 'minimize JSON output',
      default: false,
      flag: true,
      abbr: 'm',
    },
    metadata: {
      help: 'add build metadata to output',
      default: false,
      flag: true,
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
      callback: function () {
        console.log(package.version);
        process.exit(0);
      }
    },
  }).parse(),
  path = require('path'),
  include = require('../index'),
  pathParse = require('path-parse');

var promise;
if (opts.path) {
  var location, protocol = opts.path.match(/^\w+:\/\//);
  if (protocol) location = opts.path;
  else if (pathParse(opts.path).root) location = 'file://' + opts.path;
  else location = 'file://' + path.join(process.cwd(), opts.path);
  promise = include({
    url: location
  });
} else {
  promise = new Promise((resolve, reject) => {
    process.stdin.setEncoding('utf8');
    var rawData = [];
    process.stdin.on('data', chunk => rawData.push(chunk));
    process.stdin.on('error', err => reject(err));
    process.stdin.on('end', () => resolve(rawData.join('')));
  }).then(template => {
    if (template.length === 0) {
      console.error('empty template received from stdin');
      process.exit(1);
    }
    return include({
      template: yaml.load(template),
      url: 'file://' + path.join(process.cwd(), 'template.yml'),
    }).catch(err => console.error(err));
  });
}

promise.then(function (template) {
  if(opts.metadata) {
    try {
      var stdout = exec('git log -n 1 --pretty=%H', {
        stdio: [0, 'pipe', 'ignore']
      }).toString().trim();
    } catch (e) { }
   _.defaultsDeep(template, {
      Metadata: {
        CfnInclude: {
          GitCommit: stdout,
          BuildDate: new Date().toISOString(),
        }
      }
    });
  }
  if (opts.validate) {
    var cfn = new (require('aws-sdk-proxy').CloudFormation)({
      region: env.AWS_REGION || env.AWS_DEFAULT_REGION || 'us-east-1'
    });
    return cfn.validateTemplate({
      TemplateBody: JSON.stringify(template),
    }).promise();
  } else return template;
}).then(template => {
  return promise.then(function (res) {
    console.log(opts.yaml ? yaml.dump(template) : JSON.stringify(template, null, opts.minimize ? null : 2));
  }, function (err) {
    console.error('Validation failed:', err.message);
    process.exit(1);
  });
}).catch(function (err) {
  console.error(err);
  process.exit(1);
});
