[![npm](http://img.shields.io/npm/v/cfn-include.svg?style=flat-square)](https://npmjs.org/package/cfn-include) [![npm](http://img.shields.io/npm/dm/cfn-include.svg?style=flat-square)](https://npmjs.org/package/cfn-include) [![Build Status](https://img.shields.io/travis/monken/cfn-include/master.svg?style=flat-square)](https://travis-ci.org/monken/cfn-include) ![license](https://img.shields.io/badge/license-mit-blue.svg?style=flat-square)

# cfn-include

`cfn-include` is a preprocessor for CloudFormation templates which extends CloudFormation's [intrinsic functions](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference.html).
For example, [`Fn::Include`](#fninclude) provides a convenient way to include files, which can be local, a URL or on an S3 bucket (with proper IAM authentication if necessary).

`cfn-include` tries to be minimally invasive, meaning that the template will still look and feel like an ordinary CloudFormation template. This is what sets `cfn-include` apart from other CloudFormation preprocessors such as [CFNDSL](https://github.com/stevenjack/cfndsl), [StackFormation](https://github.com/AOEpeople/StackFormation) and [AWSBoxen](https://github.com/mozilla/awsboxen). There is no need to use a scripting language or adjust to new syntax. Check them out though, they might be a better fit for you.

**Functions**
* [`Fn::Include`](#fninclude)
* [`Fn::Flatten`](#fnflatten)
* [`Fn::Map`](#fnmap)
* [`Fn::Merge`](#fnmerge)

## Installation

You can either install `cfn-include` or use a web service to compile templates.

```
npm install --global cfn-include
```

The web service can be called with your favorite CLI tool such as `curl`.

```
curl https://api.netcubed.de/latest/template -XPOST -d @template.json
```

## Synopsis

### CLI

    cfn-include <path> [options]

* `path`

  location of template. Either path to a local file, URL or file on an S3 bucket (e.g. `s3://bucket-name/example.template`)

Options:

* `-m, --minimize`   minimize JSON output  [false]
* `-t, --validate`   validate compiled template  [false]
* `--version`        print version and exit

### Web Service

    curl https://api.netcubed.de/latest/template?[options] -XPOST -d @<path>

* `path`

  the contents of `path` will be `POST`ed to the web service. See `man curl` for details.

Options:

Options are query parameters.

* `validate=false` do not validate template [true]

### Example

```javascript
// synopsis.json
{
  "AWSTemplateFormatVersion" : "2010-09-09",
  "Mappings": {
    "Region2AMI" : {
      "Fn::Include": "https://api.netcubed.de/latest/ami/lookup?architecture=HVM64"
    }
  },
  "Resources": {
    "Instance": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "UserData": {
          "Fn::Base64": {
            "Fn::Include": {
              "type": "literal",
              "location": "userdata.txt",
              "context": {
                "stack": { "Ref": "AWS::StackName" },
                "region": { "Ref": "AWS::Region" }
              }
            }
          }
        }
      }
    }
  }
}
```

This is what the `userdata.txt` looks like:
```bash
#!/bin/bash
"/opt/aws/bin/cfn-init -s {{stack}} -r MyInstance --region {{region}}
```

```bash
cfn-include synopsis.json > output.template
# you can also compile remote files
cfn-include https://raw.githubusercontent.com/monken/cfn-include/master/examples/synopsis.json > output.template
```

Alternatively, you can compile the template using the web service

```
curl -Ssf -XPOST https://api.netcubed.de/latest/template?validate=true -d '{"Fn::Include":"https://raw.githubusercontent.com/monken/cfn-include/master/examples/synopsis.json"}' > output.template
```


The output will be something like this:
```javascript
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Mappings": {
    "Region2AMI": {
      "Metadata": {
        "Name": "amzn-ami-hvm-2015.09.2.x86_64-gp2",
        "Owner": "amazon",
        "CreationDate": "2016-02-10T23:44:07.000Z"
      },
      "us-east-1": {
        "AMI": "ami-8fcee4e5"
      }
      // and so on
    }
  },
  "Resources": {
    "Instance": {
      "Parameters": {
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash\n",
                "\"/opt/aws/bin/cfn-init -s ", { "Ref": "AWS::StackName" },
                " -r MyInstance",
                " --region ", { "Ref": "AWS::Region" }, "\n"
              ]
            ]
          }
        }
      }
    }
  }
}
```

##  Fn::Include

Place `Fn::Include` anywhere in the template and it will be replaced by the contents it is referring to. The function accepts an object. Parameters are:

* **location**: The location to the file can be relative or absolute. A relative location is interpreted relative to the template. Included files can in turn include more files, i.e. recursion is supported.
* **type** (optional): either `json` or `literal`. Defaults to `json`. `literal` will include the file literally, i.e. transforming the context of the file into JSON using the infamous `Fn::Join` syntax.
* **context** (optional): If `type` is `literal` a context object with variables can be provided. The object can contain plain values or references to parameters or resources in the CloudFormation template (e.g. `{ "Ref": "StackId" }`). Use Mustache like syntax in the file.
* **query** (optional): If `type` is `json` a [JMESPath](http://jmespath.org/) query can be provided. The file to include is then queried using the value as a JMESPath expression.

You can also use a plain string if you want the default behavior, which is simply including a JSON file.

### Examples

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

## Fn::Map

`Fn::Map` is the equivalent of the JavaScript `map()` function allowing for the transformation of an input array to an output array.
By default the string `_` is used as the variable in the map function. A custom variable can be provided as a second parameter, see [`Fn::Flatten`](#fnflatten) for an example. If a custom variable is used, the variable will also be replaced if found in the object key, see [`Fn::Merge`](#fnmerge) for an example.

```json
{
  "Fn::Map": [
    [80, 443],
    {
      "CidrIp": "0.0.0.0/0",
      "FromPort": "_",
      "ToPort": "_"
    }
  ]
}
```

```json
[{
  "CidrIp": "0.0.0.0/0",
  "FromPort": "80",
  "ToPort": "80"
}, {
  "CidrIp": "0.0.0.0/0",
  "FromPort": "443",
  "ToPort": "443"
}]
```

## Fn::Flatten

This function flattens an array a single level. This is useful for flattening out nested [`Fn::Map`](#fnmap) calls.

```json
{
  "Fn::Flatten": {
    "Fn::Map": [
      [80, 443], "$", {
        "Fn::Map": [
          ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"], {
            "CidrIp": "_",
            "FromPort": "$",
            "ToPort": "$"
          }
        ]
      }
    ]
  }
},
```

Results in:

```json
[{
  "CidrIp": "10.0.0.0/8",
  "FromPort": "80",
  "ToPort": "80"
}, {
  "CidrIp": "172.16.0.0/12",
  "FromPort": "80",
  "ToPort": "80"
}, {
  "CidrIp": "192.168.0.0/16",
  "FromPort": "80",
  "ToPort": "80"
}, {
  "CidrIp": "10.0.0.0/8",
  "FromPort": "443",
  "ToPort": "443"
}, {
  "CidrIp": "172.16.0.0/12",
  "FromPort": "443",
  "ToPort": "443"
}, {
  "CidrIp": "192.168.0.0/16",
  "FromPort": "443",
  "ToPort": "443"
}]
```

## Fn::Merge

`Fn::Merge` will merge an array of objects into a single object. See [lodash / merge](https://devdocs.io/lodash~4/index#merge) for details on its behavior.

For example, this allows you to merge objects of your template that have been created with [`Fn::Map`](#fnmap). This snippet shows how multiple subnets can be created for each AZ and then merged with the rest of the template.

```json
{
  "Resources": {
    "Fn::Merge": {
      "Fn::Flatten": [{
        "Fn::Map": [
          ["A", "B"], "AZ", {
            "Subnet${AZ}": {
              "Type": "AWS::EC2::Subnet"
            }
          }
        ]
      }, {
        "SG": {
          "Type": "AWS::EC2::SecurityGroup"
        }
      }]
    }
  }
}
```


```json
{
  "Resources": {
    "SubnetA": {
      "Type": "AWS::EC2::Subnet"
    },
    "SubnetB": {
      "Type": "AWS::EC2::Subnet"
    },
    "SG": {
      "Type": "AWS::EC2::SecurityGroup"
    }
  }
}
```

## More Examples

See [/examples](https://github.com/monken/cfn-include/tree/master/examples) for templates that call an API Gateway endpoint to collect AMI IDs for all regions. There is also a good amount of [tests](https://github.com/monken/cfn-include/tree/master/t) that might be helpful.

A common pattern is to rocess a template, validate it against the AWS [validate-template](https://docs.aws.amazon.com/cli/latest/reference/cloudformation/validate-template.html) API, minimize it and upload the result to S3. You can do this with a single line of code:

```bash
cfn-include example.template -t -m | aws s3 cp - s3://bucket-name/output.template
```

## Proxy Support

`cfn-include` honors proxy settings defined in the `https_proxy` environmental variable. The module will attempt to load `proxy-agent`. Make sure `proxy-agent` is installed since it is not a dependency for this module.

## Compatibility

Node.js versions 0.10 and up are supported both on Windows and Linux.
