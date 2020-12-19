#!/usr/bin/env node

var _ = require('lodash'),
  yaml = require('../lib/yaml'),
  exec = require('child_process').execSync,
  Client = require('../lib/cfnclient'),
  package = require('../package.json'),
  env = process.env,
  opts = require('yargs').command(
    '$0 [path] [options]',
    package.description,
    (y) => y.positional('path', {
      positional: true,
      desc: 'location of template. Either path to a local file, URL or file on an S3 bucket (e.g. s3://bucket-name/example.template)',
      required: false,
    }))
    .options({
      minimize: {
        desc: 'minimize JSON output',
        default: false,
        boolean: true,
        alias: 'm',
      },
      metadata: {
        desc: 'add build metadata to output',
        default: false,
        boolean: true,
      },
      validate: {
        desc: 'validate compiled template',
        default: false,
        boolean: true,
        alias: 't',
      },
      yaml: {
        desc: 'output yaml instead of json',
        default: false,
        boolean: true,
        alias: 'y',
      },
      bucket: {
        desc: 'bucket name required for templates larger than 50k',
      },
      context: {
        desc: 'template full path. only utilized for stdin when the template is piped to this script',
        required: false,
        string: true,
      },
      prefix: {
        desc: 'prefix for templates uploaded to the bucket',
        default: 'cfn-include',
      },
      version: {
        boolean: true,
        desc: 'print version and exit',
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

    const location = opts.context ? path.resolve(opts.context) : 
      path.join(process.cwd(), 'template.yml');

    return include({
      template: yaml.load(template),
      url: 'file://' + location,
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
    const cfn = new Client({
      region: env.AWS_REGION || env.AWS_DEFAULT_REGION || 'us-east-1',
      bucket: opts.bucket,
      prefix: opts.prefix,
    });
    return cfn.validateTemplate(JSON.stringify(template)).then(() => template);
  } else return template;
}).then(template => {
  console.log(opts.yaml ? yaml.dump(template) : JSON.stringify(template, null, opts.minimize ? null : 2));
}).catch(function (err) {
  if (typeof err.toString === 'function') console.error(err.toString());
  else console.error(err);
  process.exit(1);
});
