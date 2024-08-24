#!/usr/bin/env node
/* eslint-disable global-require, no-console */
const exec = require('child_process').execSync;
const path = require('path');
const _ = require('lodash');
const pathParse = require('path-parse');
const yargs = require('yargs');

const include = require('../index');
const yaml = require('../lib/yaml');
const Client = require('../lib/cfnclient');
const pkg = require('../package.json');
const replaceEnv = require('../lib/replaceEnv');

yargs.version(false);

const { env } = process;
// eslint-disable-next-line global-require
const opts = yargs
  .command('$0 [path] [options]', pkg.description, (y) =>
    y.positional('path', {
      positional: true,
      desc: 'location of template. Either path to a local file, URL or file on an S3 bucket (e.g. s3://bucket-name/example.template)',
      required: false,
    })
  )
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
    lineWidth: {
      desc: 'output yaml line width',
      default: 200,
      number: true,
      alias: 'l',
    },
    bucket: {
      desc: 'bucket name required for templates larger than 50k',
    },
    context: {
      desc:
        // eslint-disable-next-line max-len
        'template full path. only utilized for stdin when the template is piped to this script',
      required: false,
      string: true,
    },
    prefix: {
      desc: 'prefix for templates uploaded to the bucket',
      default: 'cfn-include',
    },
    enable: {
      string: true,
      desc: `enable different options: ['env','eval'] or a combination of both via comma.`,
      choices: ['', 'env', 'env,eval', 'eval,env', 'eval'], // '' hack
      default: '',
    },
    inject: {
      alias: 'i',
      string: true,
      // eslint-disable-next-line max-len
      desc: `JSON string payload to use for template injection.`,
      coerce: (valStr) => JSON.parse(valStr),
    },
    doLog: {
      boolean: true,
      // eslint-disable-next-line max-len
      desc: `console log out include options in recurse step`,
    },
    version: {
      boolean: true,
      desc: 'print version and exit',
      callback() {
        console.log(pkg.version);
        process.exit(0);
      },
    },
  })
  .parse();

// make enable an array
opts.enable = opts.enable.split(',');

let promise;
if (opts.path) {
  let location;
  const protocol = opts.path.match(/^\w+:\/\//);
  if (protocol) location = opts.path;
  else if (pathParse(opts.path).root) location = `file://${opts.path}`;
  else location = `file://${path.join(process.cwd(), opts.path)}`;
  promise = include({
    url: location,
    doEnv: opts.enable.includes('env'),
    doEval: opts.enable.includes('eval'),
    inject: opts.inject,
    doLog: opts.doLog,
  });
} else {
  promise = new Promise((resolve, reject) => {
    process.stdin.setEncoding('utf8');
    const rawData = [];
    process.stdin.on('data', (chunk) => rawData.push(chunk));
    process.stdin.on('error', (err) => reject(err));
    process.stdin.on('end', () => resolve(rawData.join('')));
  }).then((template) => {
    if (template.length === 0) {
      console.error('empty template received from stdin');
      process.exit(1);
    }

    const location = opts.context
      ? path.resolve(opts.context)
      : path.join(process.cwd(), 'template.yml');

    template = opts.enable.includes('env') ? replaceEnv(template) : template;

    return include({
      template: yaml.load(template),
      url: `file://${location}`,
      doEnv: opts.enable.includes('env'),
      doEval: opts.enable.includes('eval'),
      inject: opts.inject,
      doLog: opts.doLog,
    }).catch((err) => console.error(err));
  });
}

promise
  .then(function (template) {
    if (opts.metadata) {
      let stdout;
      try {
        stdout = exec('git log -n 1 --pretty=%H', {
          stdio: [0, 'pipe', 'ignore'],
        })
          .toString()
          .trim();
      } catch (e) {
        // eslint-disable-next-line no-empty
      }
      _.defaultsDeep(template, {
        Metadata: {
          CfnInclude: {
            GitCommit: stdout,
            BuildDate: new Date().toISOString(),
          },
        },
      });
    }
    if (opts.validate) {
      const cfn = new Client({
        region: env.AWS_REGION || env.AWS_DEFAULT_REGION || 'us-east-1',
        bucket: opts.bucket,
        prefix: opts.prefix,
      });
      return cfn.validateTemplate(JSON.stringify(template)).then(() => template);
    }
    return template;
  })
  .then((template) => {
    console.log(
      opts.yaml
        ? yaml.dump(template, opts)
        : JSON.stringify(template, null, opts.minimize ? null : 2)
    );
  })
  .catch(function (err) {
    if (typeof err.toString === 'function') console.error(err.toString());
    else console.error(err);
    console.log(err.stack);
    process.exit(1);
  });
