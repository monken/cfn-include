var _ = require('lodash'),
  url = require('url'),
  path = require('path'),
  Promise = require('bluebird'),
  fs = Promise.promisifyAll(require('fs')),
  request = Promise.promisify(require('request')),
  AWS = require('aws-sdk'),
  s3 = Promise.promisifyAll(new AWS.S3());

var proxy = process.env['HTTPS_PROXY'] || process.env['https_proxy'];
if (proxy) {
  try {
    var agent = require('proxy-agent');
    s3.config.update({
      httpOptions: {
        agent: agent(proxy),
      },
    });
  } catch(e) {
    if(e.code === 'MODULE_NOT_FOUND') console.log('Install proxy-agent for proxy support.');
    else throw e;
  }
}

module.exports = function(options) {
  var template = options.template;
  var base = parseLocation(options.url);
  if (base.relative) throw "url cannot be relative";
  if (template) return recurse(base, template).return(template);
  else return include(base, options.url);
}

function recurse(base, object) {
  if (_.isArray(object)) return Promise.all(object.map(_.bind(recurse, this, base)));
  else if (_.isPlainObject(object)) {
    return Promise.all(_.values(object).map(_.bind(recurse, this, base))).then(function() {
      if (object["Fn::Include"]) {
        return include(base, object["Fn::Include"]).then(function(json) {
          delete object["Fn::Include"];
          _.extend(object, json);
        });
      }
    });
  }
  return Promise.resolve();
}

function include(base, location) {
  location = parseLocation(location);
  var json, absolute;
  if (!location.protocol) location.protocol = base.protocol;
  if (location.protocol === 'file') {
    absolute = location.relative ? path.join(path.dirname(base.path), location.host, location.path || '') : [location.host, location.path].join('');
    json = fs.readFileAsync(absolute);
    absolute = location.protocol + '://' + absolute;
  } else if (location.protocol === 's3') {
    var basedir = path.parse(base.path).dir;
    var bucket = location.relative ? base.host : location.host,
      key = location.relative ? url.resolve(basedir + '/', location.raw) : location.path;
    key = key.replace(/^\//, '');
    absolute = location.protocol + '://' + [bucket, key].join('/');
    json = s3.getObjectAsync({
      Bucket: bucket,
      Key: key,
    }).get('Body');
  } else if (location.protocol.match(/^https?$/)) {
    var basepath = path.parse(base.path).dir + '/';
    absolute = location.relative ? url.resolve(location.protocol + '://' + base.host + basepath, location.raw) : location.raw;
    json = request({
      url: absolute,
    }).get('body');
  }
  return json.then(JSON.parse).then(function(template) {
    return module.exports({
      template: template,
      url: absolute,
    }).return(template);
  });
}

function parseLocation(location) {
  var parsed = location.match(/^(((\w+):)?\/\/)?(.*?)(\/(.*))?$/);
  return {
    protocol: parsed[3],
    host: parsed[4],
    path: parsed[5],
    relative: _.isUndefined(parsed[1]) ? true : false,
    raw: location,
  };
}
