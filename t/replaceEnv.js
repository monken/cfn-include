const replaceEnv = require("../lib/replaceEnv");
const assert = require("assert");

describe(replaceEnv.name, () => {
  it("should replace some defined vars", () => {
    const template = replaceEnv(
      `
      Fn:DeepMerge:
      - !Include ./regions/$AWS_REGION/someFile.yml
      - !Include ./regions/\${AWS_REGION}/someFile.yml
      - Junk: $JUNK
      - Something: $SOMETHING_ELSE
    `,
      { AWS_REGION: "us-east-1", JUNK: undefined, SOMETHING_ELSE: "hi" }
    );

    assert.deepEqual(
      template,
      `
      Fn:DeepMerge:
      - !Include ./regions/us-east-1/someFile.yml
      - !Include ./regions/us-east-1/someFile.yml
      - Junk: ""
      - Something: hi
    `
    );
  });
});
