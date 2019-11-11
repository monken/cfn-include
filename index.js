var _ = require('lodash'),
  url = require('url'),
  path = require('path'),
  readFile = path => new Promise((resolve, reject) => require('fs').readFile(path, (err, data) => {
    if (err) reject(err);
    else resolve(data.toString());
  })),
  pathParse = require('path-parse'),
  request = require('./lib/request'),
  p = require('./lib/promise'),
  AWS = require('aws-sdk-proxy'),
  s3 = new AWS.S3(),
  yaml = require('./lib/yaml'),
  jmespath = require('jmespath');
parseLocation = require('./lib/parselocation');


module.exports = function (options) {
  var template = options.template,
    base = parseLocation(options.url),
    scope = options.scope || {};
  if (base.relative) throw "url cannot be relative";
  template = _.isUndefined(template) ? include(base, scope, options.url) : template;
  return Promise.resolve(template).then(function (template) {
    return recurse(base, scope, template);
  });
}

function recurse(base, scope, object) {
  scope = _.clone(scope);
  if (_.isArray(object)) return Promise.all(object.map(_.bind(recurse, this, base, scope)));
  else if (_.isPlainObject(object)) {
    if (object["Fn::Map"]) {
      var args = object["Fn::Map"],
        list = args[0],
        placeholder = args[1],
        body = args[args.length - 1];
      if (args.length === 2) placeholder = '_';
      return p.map(recurse(base, scope, list), function (replace) {
        scope = _.clone(scope);
        scope[placeholder] = replace;
        var replaced = findAndReplace(scope, _.cloneDeep(body));
        return recurse(base, scope, replaced);
      });
    } else if (object["Fn::Include"]) {
      return include(base, scope, object["Fn::Include"]).then(function (json) {
        if (!_.isPlainObject(json)) return json;
        delete object["Fn::Include"];
        _.defaults(object, json);
        return object;
      }).then(_.bind(findAndReplace, this, scope)).then(_.bind(recurse, this, base, scope));
    } else if (object["Fn::Flatten"]) {
      return recurse(base, scope, object["Fn::Flatten"]).then(function (json) {
        return _.flatten(json);
      });
    } else if (object["Fn::Merge"]) {
      return recurse(base, scope, object["Fn::Merge"]).then(function (json) {
        delete object["Fn::Merge"];
        _.defaults(object, _.merge.apply(_, json));
        return object;
      });
    } else if (object["Fn::Stringify"]) {
      return recurse(base, scope, object["Fn::Stringify"]).then(function (json) {
        return JSON.stringify(json);
      });
    } else {
      return p.props(_.mapValues(object, _.bind(recurse, this, base, scope)))
    }
  } else if (_.isUndefined(object)) {
    return null;
  } else {
    return object;
  }
}

function findAndReplace(scope, object) {
  _.forEach(scope, function (replace, find) {
    var regex = new RegExp('\\${' + find + '}', 'g');
    if (_.isString(object) && object === find) {
      object = replace;
    } else if (_.isString(object) && find !== '_' && object.match(regex)) {
      object = object.replace(regex, replace);
    } else if (_.isArray(object)) {
      object = object.map(_.bind(findAndReplace, this, scope));
    } else if (_.isPlainObject(object)) {
      object = _.mapKeys(object, function (value, key) {
        return findAndReplace(scope, key);
      });
      _.keys(object).forEach(function (key) {
        if (key === 'Fn::Map') return;
        object[key] = findAndReplace(scope, object[key]);
      });
      return object;
      return _.mapValues(object, _.bind(findAndReplace, this, scope));
    } else {
      return object;
    }
  });
  return object;
}

function interpolate(lines, context) {
  return lines.map(function (line) {
    var parts = [];
    line.split(/({{\w+?}})/g).map(function (line) {
      var match = line.match(/^{{(\w+)}}$/),
        value = match ? context[match[1]] : undefined;
      if (!match) return line;
      else if (_.isUndefined(value)) {
        return ''
      } else {
        return value;
      }
    }).forEach(function (part) {
      var last = parts[parts.length - 1];
      if (_.isPlainObject(part) || _.isPlainObject(last) || !parts.length) {
        parts.push(part);
      } else if (parts.length) {
        parts[parts.length - 1] = last + part;
      }
    });
    return parts.filter(function (part) {
      return part !== '';
    });
  });
}

function include(base, scope, args) {
  args = _.defaults(_.isPlainObject(args) ? args : {
    location: args,
  }, { type: 'json' });
  var body, absolute, location = parseLocation(args.location);
  if (!_.isEmpty(location) && !location.protocol) location.protocol = base.protocol;
  if (location.protocol === 'file') {
    absolute = location.relative ? path.join(path.dirname(base.path), location.host, location.path || '') : [location.host, location.path].join('');
    body = readFile(absolute);
    absolute = location.protocol + '://' + absolute;
  } else if (location.protocol === 's3') {
    var basedir = pathParse(base.path).dir;
    var bucket = location.relative ? base.host : location.host,
      key = location.relative ? url.resolve(basedir + '/', location.raw) : location.path;
    key = key.replace(/^\//, '');
    absolute = location.protocol + '://' + [bucket, key].join('/');
    body = s3.getObject({
      Bucket: bucket,
      Key: key,
    }).promise().then(res => res['Body'].toString());
  } else if (location.protocol && location.protocol.match(/^https?$/)) {
    var basepath = pathParse(base.path).dir + '/';
    absolute = location.relative ? url.resolve(location.protocol + '://' + base.host + basepath, location.raw) : location.raw;
    body = request(absolute);
  }
  if (args.type === 'json') {
    return body.then(yaml.load).then(function (template) {
      if (args.query) {
        template = jmespath.search(template, args.query);
      }
      return recurse(parseLocation(absolute), scope, template);
    });
  } else if (args.type === 'api') {
    var handler = require('./lib/include/api');
    return handler(args);
  } else if (args.type === 'string') {
    return body;
  } else if (args.type === 'literal') {
    return body.then(function (template) {
      var lines = JSONifyString(template);
      if (_.isPlainObject(args.context)) {
        lines = interpolate(lines, args.context);
      }
      return {
        'Fn::Join': ['', _.flatten(lines)]
      };
    });
  }
}

function JSONifyString(string) {
  var lines = [],
    split = string.toString().split(/(\r?\n)/);
  split.forEach(function (line, idx) {
    if (idx % 2) {
      lines[(idx - 1) / 2] = lines[(idx - 1) / 2] + line;
    } else {
      lines.push(line);
    }
  });
  return lines;
}
