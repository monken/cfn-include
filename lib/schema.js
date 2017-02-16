var yaml = require('js-yaml'),
_ = require('lodash');

var tags = [
  { short: 'Include', full: 'Fn::Include', type: 'scalar' },
  { short: 'Include', full: 'Fn::Include', type: 'mapping' },
  { short: 'Map', full: 'Fn::Map', type: 'sequence' },
  { short: 'Flatten', full: 'Fn::Flatten', type: 'sequence' },
  { short: 'Merge', full: 'Fn::Merge', type: 'sequence' },
  // http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference.html
  { short: 'Base64', full: 'Fn::Base64', type: 'scalar' },
  { short: 'Base64', full: 'Fn::Base64', type: 'mapping' },
  { short: 'FindInMap', full: 'Fn::FindInMap', type: 'sequence' },
  { short: 'GetAtt', full: 'Fn::GetAtt', type: 'sequence' },
  { short: 'GetAtt', full: 'Fn::GetAtt', type: 'scalar' },
  { short: 'GetAZs', full: 'Fn::GetAZs', type: 'sequence' },
  { short: 'ImportValue', full: 'Fn::ImportValue', type: 'scalar' },
  { short: 'ImportValue', full: 'Fn::ImportValue', type: 'mapping' },
  { short: 'Join', full: 'Fn::Join', type: 'sequence' },
  { short: 'Select', full: 'Fn::Select', type: 'sequence' },
  { short: 'Sub', full: 'Fn::Sub', type: 'sequence' },
  { short: 'Sub', full: 'Fn::Sub', type: 'mapping' },
  { short: 'Sub', full: 'Fn::Sub', type: 'scalar' },
  { short: 'Ref', full: 'Ref', type: 'scalar' },
  // http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/continuous-delivery-codepipeline-action-reference.html
  { short: 'GetParam', full: 'Fn::GetParam', type: 'sequence' },
  // http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-conditions.html
  { short: 'And', full: 'Fn::And', type: 'sequence' },
  { short: 'Equals', full: 'Fn::Equals', type: 'sequence' },
  { short: 'If', full: 'Fn::If', type: 'sequence' },
  { short: 'Not', full: 'Fn::Not', type: 'sequence' },
  { short: 'Or', full: 'Fn::Or', type: 'sequence' },

].map(function(fn) {
  return new yaml.Type('!' + fn.short, {
    kind: fn.type,
    construct: function(obj) {
      return _.fromPairs([[fn.full, obj]]);
    }
  });
});

module.exports = yaml.Schema.create(tags);
