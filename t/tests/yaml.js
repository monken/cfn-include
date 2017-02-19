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
  }, {
    "name": "yaml tags",
    "template": {
      "Fn::Include": "includes/yaml/tags.yml"
    },
    "output": {
      Sub: {
        scalar: {
          "Fn::Sub": "${Foobar}"
        },
        sequence: {
          "Fn::Sub": ["foobar", { test: 123 }]
        }
      },
      Split: {
        sequence: {
          "Fn::Split": ["", "foo bar"]
        }
      },
      GetAtt: {
        sequence: {
          "Fn::GetAtt": ["Foo", "Bar"]
        },
        scalar: {
          "Fn::GetAtt": ["Foo", "Bar"]
        },
        scalarDeep: {
          "Fn::GetAtt": ["Foo", "Bar.Baz"]
        },
        scalarSingle: {
          "Fn::GetAtt": ["Foobar"]
        }
      }
    }
  }]
}
