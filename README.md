<!--[![npm](http://img.shields.io/npm/v/cfn-include.svg?style=flat-square)](https://npmjs.org/package/cfn-include) [![npm](http://img.shields.io/npm/dm/cfn-include.svg?style=flat-square)](https://npmjs.org/package/cfn-include) [![Build Status](https://img.shields.io/travis/monken/cfn-include/master.svg?style=flat-square)](https://travis-ci.org/monken/cfn-include) ![license](https://img.shields.io/badge/license-mit-blue.svg?style=flat-square)-->

# cfn-include

`cfn-include` is a preprocessor for CloudFormation templates. It parses a given template and includes contents of files defined by the custom `Fn::Include` [intrinsic function](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference.html). Referenced files can be local, an HTTP(S) URL or an S3 bucket location.

## Synopsis

    cfn-include <path> [options]

* `path`

  location of template. Either path to a local file, URL or file on an S3 bucket (e.g. `s3://bucket-name/example.template`)

Options:

* `-m, --minimize`   minimize JSON output  [false]

```json
# example.template
{
  "AWSTemplateFormatVersion" : "2010-09-09",
  "Mappings": {
    "AWSRegionArch2AMI" : {
      "Fn::Include": "AWSRegionArch2AMI.json"
    }
  }
}
```

```bash
cfn-include example.template > output.template
```

##  Fn::Include

The `Fn::Include` function can be located anywhere in the template and can occur multiple times. The function accepts one argument. The location to the file can be relative or absolute. A relative location is interpreted relative to the template.

Include a file from a URL

```json
{ "Fn::Include": "https://example.com/include.json" }
```

Include a file from an S3 bucket. Authentication is handled by `aws-sdk`. See [Setting AWS Credentials](https://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html#Setting_AWS_Credentials) for details.

```json
{ "Fn::Include": "s3://bucket-name/include1.json" }
```

Include a file in the same folder

```json
{ "Fn::Include": "include.json" }
```

## Examples

This will process the template, minimize it and upload the result to S3.

```bash
cfn-include example.template -m | aws s3 cp - s3://bucket-name/output.template
```

## Roadmap

* use a different parser such as json5, yaml
* Include files literally, e.g. for user-data
* provide context to template
* Detect recursion
