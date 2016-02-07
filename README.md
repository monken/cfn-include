[![npm](http://img.shields.io/npm/v/cfn-include.svg?style=flat-square)](https://npmjs.org/package/cfn-include) [![npm](http://img.shields.io/npm/dm/cfn-include.svg?style=flat-square)](https://npmjs.org/package/cfn-include) [![Build Status](https://img.shields.io/travis/monken/cfn-include/master.svg?style=flat-square)](https://travis-ci.org/monken/cfn-include) ![license](https://img.shields.io/badge/license-mit-blue.svg?style=flat-square)

# cfn-include

`cfn-include` is a preprocessor for CloudFormation templates. It parses a given template and includes contents of files defined by the custom `Fn::Include` [intrinsic function](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference.html). Referenced files can be local, a URL or an S3 bucket location.

## Synopsis

    cfn-include <path> [options]

* `path`

  location of template. Either path to a local file, URL or file on an S3 bucket (e.g. `s3://bucket-name/example.template`)

Options:

* `-m, --minimize`   minimize JSON output  [false]
* `-t, --validate`   validate compiled template  [false]

```json
# example.template
{
  "AWSTemplateFormatVersion" : "2010-09-09",
  "Mappings": {
    "Region2AMI" : {
      "Fn::Include": "Region2AMI.json"
    }
  },
  "Resources": {
    "Instance": {
      "Parameters": {
        "UserData": {
          "Fn::Include": {
            "type": "literal",
            "location": "userdata.txt",
            "context": {
              "stack": { "Ref": "StackId" }
            }
          }
        }
      }
    }
  }
}
```

```bash
cfn-include example.template > output.template
```

```json
# example.template
{
  "AWSTemplateFormatVersion" : "2010-09-09",
  "Mappings": {
    "Region2AMI" : {
      "us-east-1": {
        "AMI": "ami-60b6c60a"
      },
      "eu-central-1": {
        "AMI": "ami-bc5b48d0"
      }
    }
  },
  "Resources": {
    "Instance": {
      "Parameters": {
        "UserData": {
          "Fn::Join": ["", [
            "#!/bin/bash\n"
          ]]
        }
      }
    }
  }
}
```

##  Fn::Include

The `Fn::Include` function can be located anywhere in the template and can occur multiple times. The function accepts an object. Parameters are:

* location: The location to the file can be relative or absolute. A relative location is interpreted relative to the template. Included files can in turn include more files, i.e. recursion is supported.
* type (optional): either `json` or `literal`. Defaults to `json`. `literal` will include the file literally, i.e. transforming the context of the file into JSON using the infamous `Fn::Join` syntax.
* context (optional): If `type` is `literal` a context object with variables can be provided. The object can contain plain values or references to parameters or resources in the CloudFormation template (e.g. `{ "Ref": "StackId" }`). Use Mustache like syntax in the file.

Instead of using an object, a plain string can be provided which assumes the file is of type `json`.

Include a file from a URL

```json
{ "Fn::Include": "https://example.com/include.json" }

// equivalent to

{ "Fn::Include": {
    "type": "json",
    "location": "https://example.com/include.json"
  }
}
```

Include a file from an S3 bucket. Authentication is handled by `aws-sdk`. See [Setting AWS Credentials](https://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html#Setting_AWS_Credentials) for details.

```json
{ "Fn::Include": "s3://bucket-name/include1.json" }
```

Include a file in the same folder

```json
{ "Fn::Include": "include.json" }
```

Include a file literally

```json
{ "Fn::Include": {
    "type": "literal",
    "location": "https://example.com/userdata.txt",
    "context": {
      "stack": { "Ref": "AWS::StackId" }
    }
  }
}
```

## Examples

See [/examples](https://github.com/monken/cfn-include/tree/master/examples) for templates that call an API Gateway endpoint to collect AMI IDs for all regions.

This will process a template, validate it against the [validate-template](https://docs.aws.amazon.com/cli/latest/reference/cloudformation/validate-template.html) API, minimize it and upload the result to S3.

```bash
cfn-include example.template -t -m | aws s3 cp - s3://bucket-name/output.template
```

## Proxy Support

`cfn-include` honors proxy settings defined in the `https_proxy` environmental variable. The module will attempt to load `proxy-agent`. Make sure `proxy-agent` is installed since it is not a dependency for this module.

## Compatibility

Node.js versions 0.10 and up are supported.

## Roadmap

* use a different parser such as json5, yaml
* ignore casing of config object keys
* Detect infinite recursion
