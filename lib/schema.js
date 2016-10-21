var yaml = require('js-yaml'),
_ = require('lodash');

var tags = [
  { short: 'Include', full: 'Fn::Include', type: 'scalar' },
  { short: 'Include', full: 'Fn::Include', type: 'mapping' },
  { short: 'Map', full: 'Fn::Map', type: 'sequence' },
  /*
  Map: 'sequence',
  Flatten: 'sequence',
  Merge: 'sequence',
  // http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference.html
  Base64': 'sequence',
  FindInMap,
  GetAtt,
  GetAZs,
  ImportValue,
  Join,
  Select,
  Sub,*/
].map(function(fn) {
  return new yaml.Type('!' + fn.short, {
    kind: fn.type,
    resolve: function() {
      console.log('foo')
      return true;
    },
    represent: function() {
      console.log('foo')
      return true;
    },
    construct: function(obj) {
      return _.fromPairs([[fn.full, obj]]);
    }
  });
});

module.exports = yaml.Schema.create(tags);
