#!/usr/bin/env node

var opts = require('nomnom').script('cfn-include').options({
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
  }).parse(),
  path = require('path'),
  include = require('cfn-include');

var location, protocol = opts.path.match(/^\w+:\/\//);
if(protocol) location = opts.path;
else if(path.isAbsolute(opts.path)) location = 'file://' + opts.path;
else location = 'file://' + path.join(process.cwd(), opts.path);

include({
  url: location
}).then(function(template) {
  console.log(JSON.stringify(template, null, opts.minimize ? null : 2));
});
