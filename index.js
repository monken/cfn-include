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
  jmespath = require('jmespath'),
  deepMerge = require('deepmerge'),
  parseLocation = require('./lib/parselocation'),
  replaceEnv = require('./lib/replaceEnv');

const { lowerCamelCase, upperCamelCase } = require('./lib/utils');

module.exports = function (options) {
  var template = options.template,
    base = parseLocation(options.url),
    scope = options.scope || {};
  if (base.relative) throw "url cannot be relative";
  template = _.isUndefined(template) ? include(base, scope, options.url, options.doEnv) : template;
  return Promise.resolve(template).then(function (template) {
    return recurse(base, scope, template, options.doEnv);
  });
}

async function recurse(base, scope, object, doEnv) {
  scope = _.clone(scope);
  if (_.isArray(object)) {
    return Promise.all(object.map((o) => recurse(base, scope, o, doEnv)))
  } else if (_.isPlainObject(object)) {
    if (object["Fn::Map"]) {
      var args = object["Fn::Map"],
          list = args[0],
          placeholder = args[1],
          body = args[args.length - 1],
          idx, sz, i = 0,
          hasindex = false,
          hassize = false;
      if (Array.isArray(placeholder)) { // multiple placeholders
        idx = placeholder[1];
        hasindex = true;
        if (placeholder.length > 2) {
            sz = placeholder[2];
            hassize = true;
        }
        placeholder = placeholder[0];
      }
      if (args.length === 2) {
        placeholder = '_';
      }
      return p.map(recurse(base, scope, list, doEnv), function(replace) {
        scope = _.clone(scope);
        scope[placeholder] = replace;
        if (hasindex) {
          scope[idx] = i++;
        }
        var replaced = findAndReplace(scope, _.cloneDeep(body));
        return recurse(base, scope, replaced, doEnv);
      }).then(function(obj) {
        if (hassize) {
            obj = findAndReplace({[sz] :obj.length}, obj);
        }
        return recurse(base, scope, obj, doEnv);
      });
    } else if (object["Fn::Length"]) {
      if (Array.isArray(object["Fn::Length"])) {
        return object["Fn::Length"].length;
      }
      return recurse(base, scope, object["Fn::Length"], doEnv).then((x) => {
        if (Array.isArray(x)) {
          return x.length;
        }
        return 0;
      });
    } else if (object["Fn::Include"]) {
      return include(base, scope, object["Fn::Include"], doEnv)
          .then(function(json) {
            if (!_.isPlainObject(json))
              return json;
            delete object["Fn::Include"];
            _.defaults(object, json);
            return object;
          })
          .then(_.bind(findAndReplace, this, scope))
          .then((t) => recurse(base, scope, t, doEnv));
    } else if (object["Fn::Flatten"]) {
      return recurse(base, scope, object["Fn::Flatten"], doEnv)
          .then(function(json) { return _.flatten(json); });
    } else if (object["Fn::Merge"]) {
      return recurse(base, scope, object["Fn::Merge"], doEnv).then(function(json) {
        delete object["Fn::Merge"];
        _.defaults(object, _.merge.apply(_, json));
        return object;
      });
    } else if (object["Fn::DeepMerge"]) {
      return recurse(base, scope, object["Fn::DeepMerge"], doEnv).then(function (json) {
        delete object["Fn::DeepMerge"];
        let mergedObj = {};
        if (json && json.length) {
          json.forEach((j) => {
            mergedObj = deepMerge(mergedObj, j)
          })
        }
        _.defaults(object, mergedObj);
        return object;
      });
    } else if (object["Fn::Stringify"]) {
      return recurse(base, scope, object["Fn::Stringify"], doEnv)
          .then(function(json) { return JSON.stringify(json); });
    } else if (object["Fn::UpperCamelCase"]) {
      return upperCamelCase(object["Fn::UpperCamelCase"]);
    } else if (object["Fn::LowerCamelCase"]) {
      return lowerCamelCase(object["Fn::LowerCamelCase"]);
    } else if (object["Fn::GetEnv"]) {
      const args = object["Fn::GetEnv"];
      if (Array.isArray(args)) {
        const val = process.env[args[0]];
        return val === undefined ? args[1] : val;
      }
      const val = process.env[args];
      if (val === undefined) {
        throw new Error(`environmental variable ${args} is undefined`);
      }
      return val;
    } else if (object["Fn::Outputs"]) {
      const outputs = await recurse(base, scope, object["Fn::Outputs"], doEnv);
      const result = {};
      for (const output in outputs) {
        const val = outputs[output];
        const exp = {
          Export : {Name : {'Fn::Sub' : '${AWS::StackName}:' + output}}
        };
        if (!Array.isArray(val) && typeof val === 'object') {
          result[output] = {
            Value : {'Fn::Sub' : val.Value},
            Condition : val.Condition,
            ...exp,
          }
        } else {
          result[output] = {
            Value : {'Fn::Sub' : val},
            ...exp,
          }
        }
      }
      return result;
    } else if (object["Fn::Sequence"]) {
      const outputs = await recurse(base, scope, object["Fn::Sequence"], doEnv);
      let [start, stop, step = 1] = outputs;
      const isString = typeof start === 'string';
      if (isString) {
        start = start.charCodeAt(0);
        stop = stop.charCodeAt(0);
      }
      const seq = Array.from({length : Math.floor((stop - start) / step) + 1},
                             (_, i) => start + i * step);
      return isString ? seq.map((i) => String.fromCharCode(i)) : seq;
    } else {
      return p.props(_.mapValues(object, (template) => recurse(base, scope, template, doEnv)))
    }
  } else if (_.isUndefined(object)) {
    return null;
  } else {
    return object;
  }
}


function findAndReplace(scope, object) {
  if (_.isString(object)) {
    _.forEach(scope, function(replace, find) {
      if (object === find) {
        object = replace;
      }
    });
  }
  if (_.isString(object)) {
    _.forEach(scope, function(replace, find) {
      let regex = new RegExp('\\${' + find + '}', 'g');
      let found = false;
      if (find !== '_' && object.match(regex)) {
        object = object.replace(regex, replace);
      }
    });
  }
  if (_.isArray(object)) {
    object = object.map(_.bind(findAndReplace, this, scope));
  } else if (_.isPlainObject(object)) {
    object = _.mapKeys(
        object, function(value, key) { return findAndReplace(scope, key); });
    _.keys(object).forEach(function(key) {
      if (key === 'Fn::Map')
        return;
      object[key] = findAndReplace(scope, object[key]);
    });
  }
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

async function include(base, scope, args, doEnv) {
  args = _.defaults(_.isPlainObject(args) ? { ...args, doEnv } : {
    location: args,
    doEnv,
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
  return handleIncludeBody({scope, args, body, absolute });
}

function passThrough(template) { return template; } 

async function handleIncludeBody({ scope, args, body, absolute }) {
  const procTemplate = args.doEnv? replaceEnv : passThrough;
  switch (args.type) {
    case 'json': {
      let b = await body;
      b = procTemplate(b);
      let template = yaml.load(b)
      if (args.query) {
        const query = _.isString(args.query) ? args.query : await recurse(parseLocation(absolute), scope, args.query, args.doEnv);
        template = jmespath.search(template, query);
      }
      return recurse(parseLocation(absolute), scope, template, args.doEnv);
    }
    case 'api': {
      var handler = require('./lib/include/api');
      let template = await handler(args);
      return procTemplate(template);
    } 
    case 'string': {
      let template = await body;
      return procTemplate(template)
    }  
    case 'literal': {
      return body.then(function (template) {
        template = procTemplate(template);
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
