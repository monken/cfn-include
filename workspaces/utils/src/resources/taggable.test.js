const taggable = require('./taggable');
const assert = require('assert');

describe(taggable.isTaggableResource.name, () => {
  ['AWS::IAM::Role'].forEach((resourceName) => {
    it(`${resourceName} is taggable`, async () => {
      const isTag = await taggable.isTaggableResource(resourceName);
      assert.ok(isTag);
    });
  });

  ['AWS::IAM::Policy', 'AWS::IAM::ManagedPolicy'].forEach((resourceName) => {
    it(`${resourceName} is NOT taggable`, async () => {
      const isTag = await taggable.isTaggableResource(resourceName);
      assert.ok(!isTag);
    });
  });
});
