var yaml = require('js-yaml'),
_ = require('lodash');

var tags = [
  { short: 'Include', full: 'Fn::Include', type: 'scalar' },
  { short: 'Include', full: 'Fn::Include', type: 'mapping' },
  { short: 'Stringify', full: 'Fn::Stringify', type: 'sequence' },
  { short: 'Stringify', full: 'Fn::Stringify', type: 'mapping' },
  { short: 'Map', full: 'Fn::Map', type: 'sequence' },
  { short: 'Length', full: 'Fn::Length', type: 'sequence' },
  { short: 'Flatten', full: 'Fn::Flatten', type: 'sequence' },
  { short: 'GetEnv', full: 'Fn::GetEnv', type: 'sequence' },
  { short: 'GetEnv', full: 'Fn::GetEnv', type: 'scalar' },
  { short: 'Merge', full: 'Fn::Merge', type: 'sequence' },
  { short: 'Outputs', full: 'Fn::Outputs', type: 'mapping' },
  { short: 'LowerCamelCase', full: 'Fn::LowerCamelCase', type: 'scalar' },
  { short: 'UpperCamelCase', full: 'Fn::UpperCamelCase', type: 'scalar' },
  { short: 'Sequence', full: 'Fn::Sequence', type: 'sequence' },

  // http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference.html
  { short: 'Base64', full: 'Fn::Base64', type: 'scalar' },
  { short: 'Base64', full: 'Fn::Base64', type: 'mapping' },
  { short: 'FindInMap', full: 'Fn::FindInMap', type: 'sequence' },
  { short: 'GetAtt', full: 'Fn::GetAtt', type: 'sequence' },
  { short: 'GetAtt', full: 'Fn::GetAtt', type: 'scalar', dotSyntax: true },
  { short: 'GetAZs', full: 'Fn::GetAZs', type: 'sequence' },
  { short: 'GetAZs', full: 'Fn::GetAZs', type: 'scalar' },
  { short: 'ImportValue', full: 'Fn::ImportValue', type: 'scalar' },
  { short: 'ImportValue', full: 'Fn::ImportValue', type: 'mapping' },
  { short: 'Join', full: 'Fn::Join', type: 'sequence' },
  { short: 'Select', full: 'Fn::Select', type: 'sequence' },
  { short: 'Sub', full: 'Fn::Sub', type: 'sequence' },
  { short: 'Sub', full: 'Fn::Sub', type: 'mapping' },
  { short: 'Sub', full: 'Fn::Sub', type: 'scalar' },
  { short: 'Split', full: 'Fn::Split', type: 'sequence' },
  { short: 'Ref', full: 'Ref', type: 'scalar' },
  { short: 'Cidr', full: 'Fn::Cidr', type: 'sequence' },
  { short: 'Cidr', full: 'Fn::Cidr', type: 'mapping' },
  // http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/continuous-delivery-codepipeline-action-reference.html
  { short: 'GetParam', full: 'Fn::GetParam', type: 'sequence' },
  // http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-conditions.html
  { short: 'And', full: 'Fn::And', type: 'sequence' },
  { short: 'Equals', full: 'Fn::Equals', type: 'sequence' },
  { short: 'If', full: 'Fn::If', type: 'sequence' },
  { short: 'Not', full: 'Fn::Not', type: 'sequence' },
  { short: 'Or', full: 'Fn::Or', type: 'sequence' },
  { short: 'Condition', full: 'Condition', type: 'scalar' },


].map(function(fn) {
  return new yaml.Type('!' + fn.short, {
    kind: fn.type,
    construct: function(obj) {
      if(fn.dotSyntax && _.isString(obj)) {
        var indexOfDot = obj.indexOf('.');
        if(indexOfDot != -1)
          obj = [obj.substr(0, indexOfDot), obj.substr(indexOfDot + 1)];
        else obj = [obj];
      }
      return _.fromPairs([[fn.full, obj]]);
    }
  });
});

module.exports = yaml.Schema.create(tags);
