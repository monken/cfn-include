var assert = require('assert'),
  synopsis = {
  "AWSTemplateFormatVersion": "2010-09-09",
  "Mappings": {
  },
  "Resources": {
    "Instance": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "ImageId": {
          "Fn::FindInMap": [
            "Region2AMI",
            {
              "Ref": "AWS::Region"
            },
            "AMI"
          ]
        },
        "UserData": {
          "Fn::Base64": {
            "Fn::Sub": {
              "Fn::Join": [
                "",
                [
                  "#!/bin/bash\n",
                  "\"/opt/aws/bin/cfn-init -s ${AWS::StackId} -r MyInstance --region ${AWS::Region}\n",
                  ""
                ]
              ]
            }
          }
        }
      }
    }
  }
};

module.exports = {
  "yaml": [{
    "name": "tags",
    "template": {
      "Fn::Include": "includes/yaml/fnsub.yml"
    },
    "output": {
      "Resources": {"Foo":"bar"}
    }
  }, {
    "name": "synopsis",
    "template": {
      "Fn::Include": "includes/synopsis.yml"
    },
    "output": function(res) {
      delete res.Mappings.Region2AMI;
      assert.deepEqual(res, synopsis);
      return true;
    }
  }]
}
