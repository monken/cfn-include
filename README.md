[![npm](http://img.shields.io/npm/v/cfn-include.svg?style=flat-square)](https://npmjs.org/package/cfn-include) [![npm](http://img.shields.io/npm/dm/cfn-include.svg?style=flat-square)](https://npmjs.org/package/cfn-include) [![Build Status](https://img.shields.io/travis/monken/cfn-include/master.svg?style=flat-square)](https://travis-ci.org/monken/cfn-include) ![license](https://img.shields.io/badge/license-mit-blue.svg?style=flat-square)

# cfn-include

`cfn-include` is a preprocessor for CloudFormation templates which extends CloudFormation's [intrinsic functions](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference.html).
For example, [`Fn::Include`](#fninclude) provides a convenient way to include files, which can be local, a URL or on an S3 bucket (with proper IAM authentication if necessary). It supports both JSON and YAML as input and output format. CloudFormation's tag syntax for YAML (e.g. `!GetAtt`) is supported as well.

`cfn-include` tries to be minimally invasive, meaning that the template will still look and feel like an ordinary CloudFormation template. This is what sets `cfn-include` apart from other CloudFormation preprocessors such as [CFNDSL](https://github.com/stevenjack/cfndsl), [StackFormation](https://github.com/AOEpeople/StackFormation) and [AWSBoxen](https://github.com/mozilla/awsboxen). There is no need to use a scripting language or adjust to new syntax. Check them out though, they might be a better fit for you.

**Functions**
* [`Fn::Include`](#fninclude)
* [`Fn::Flatten`](#fnflatten)
* [`Fn::Map`](#fnmap)
* [`Fn::Merge`](#fnmerge)
* [`Fn::Stringify`](#fnstringify)

Tag-based syntax is available in YAML templates. For example,`Fn::Include` becomes `!Include`.

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
* `--metadata`       add build metadata to output  [false]
* `-t, --validate`   validate compiled template  [false]
* `-y, --yaml`       output yaml instead of json  [false]
* `--version`        print version and exit

`cfn-include` also accepts a template passed from stdin

```
cat mytemplate.yml | cfn-include
```

### Example

**YAML**

```yaml
Mappings:
  Region2AMI:
    !Include https://api.netcubed.de/latest/ami/lookup?platform=amzn2
Resources:
  Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [ Region2AMI, !Ref AWS::Region, AMI ]
      UserData:
        Fn::Base64:
          Fn::Sub:
            !Include { type: string, location: userdata.sh }
```

**JSON**

```javascript
{
  "Mappings": {
    "Region2AMI" : {
      "Fn::Include": "https://api.netcubed.de/latest/ami/lookup?platform=amzn2"
    }
  },
  "Resources": {
    "Instance": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "UserData": {
          "ImageId": {
            "FindInMap": [ "Region2AMI", { "Ref": "AWS::Region" }, "AMI" ]
          },
          "Fn::Base64": {
            "Fn::Sub": {
              "Fn::Include": {
                "type": "string",
                "location": "userdata.sh"
} } } } } } } }
```

This is what the `userdata.sh` looks like:
```bash
#!/bin/bash
/opt/aws/bin/cfn-init -s ${AWS::StackId} -r MyInstance --region ${AWS::Region}
```

```bash
cfn-include synopsis.json > output.template
# you can also compile remote files
cfn-include https://raw.githubusercontent.com/monken/cfn-include/master/examples/synopsis.json > output.template
```


The output will be something like this:
```javascript
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Mappings": {
    "Region2AMI": {
      "Metadata": {
        "Name": "amzn-ami-hvm-2016.09.0.20161028-x86_64-gp2",
        "Owner": "amazon",
        "CreationDate": "2016-10-29T00:49:47.000Z"
      },
      "us-east-2": {
        "AMI": "ami-58277d3d"
      },
      // ...
  } },
  "Resources": {
    "Instance": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "ImageId": {
          "FindInMap": [ "Region2AMI", { "Ref": "AWS::Region" }, "AMI" ]
        },
        "UserData": {
          "Fn::Base64": {
            "Fn::Sub": {
              "Fn::Join": ["", [
                  "#!/bin/bash\n",
                  "\"/opt/aws/bin/cfn-init -s ${AWS::StackId} -r MyInstance --region ${AWS::Region}\n",
                  ""
] ] } } } } } } }
```

##  Fn::Include

Place `Fn::Include` anywhere in the template and it will be replaced by the contents it is referring to. The function accepts an object. Parameters are:

* **location**: The location to the file can be relative or absolute. A relative location is interpreted relative to the template. Included files can in turn include more files, i.e. recursion is supported.
* **type** (optional): either `json`, `string` or `api`. Defaults to `json`. `string` will include the file literally which is useful in combination with `Fn::Sub`. `api` will call any AWS API and return the response which can be included in the template. Choose `json` for both JSON and YAML files. The `literal` type is deprecated and uses the infamous `Fn::Join` syntax.
* **context** (optional, deprecated): If `type` is `literal` a context object with variables can be provided. The object can contain plain values or references to parameters or resources in the CloudFormation template (e.g. `{ "Ref": "StackId" }`). Use Mustache like syntax in the file. This option is deprecated in favor of the `Fn::Sub` syntax (see examples below).
* **query** (optional): If `type` is `json` a [JMESPath](http://jmespath.org/) query can be provided. The file to include is then queried using the value as a JMESPath expression.

Only applicable if **type** is `api`:

* **service**: Service to call (see [AWSJavaScriptSDK](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/index.html), case sensitive, e.g. `EC2`, `CloudFormation`)
* **action**: Action to call (case sensitive, e.g. `updateStack`, `describeRegions`)
* **parameters** (optional): Parameters passed to **action** (e.g. `{ StackName:  "MyStack" }`)
* **region** (optional): Either `AWS_DEFAULT_REGION` or this parameter have to be set which specifies the region where the API call is made.

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
{ "Fn::Sub": {
  "Fn::Include": {
    "type": "string",
    "location": "https://example.com/userdata.txt"
} } }
```

Include an AWS API response, e.g. loop through all regions and return the image id of a specific AMI:

```json
{ "Fn::Merge": {
    "Fn::Map": [{
      "Fn::Include": {
        "type": "api",
        "service": "EC2",
        "action": "describeRegions",
        "query": "Regions[*].RegionName[]"
    } }, {
      "_": {
        "AMI": {
          "Fn::Include": {
            "type": "api",
            "service": "EC2",
            "action": "describeImages",
            "region": "_",
            "query": "Images[*].ImageId | [0]",
            "parameters": {
              "Filters": [{
                "Name": "manifest-location",
                "Values": ["amazon/amzn-ami-hvm-2016.03.3.x86_64-gp2"],
              }]
} } } } } ] } }
```

```json
{ "ap-south-1": { "AMI": "ami-ffbdd790" },
  "eu-west-1": {"AMI": "ami-f9dd458a" },
  "ap-southeast-1": { "AMI": "ami-a59b49c6" },
  ...
}
```

## Fn::Map

`Fn::Map` is the equivalent of the JavaScript `map()` function allowing for the transformation of an input array to an output array.
By default the string `_` is used as the variable in the map function. A custom variable can be provided as a second parameter, see [`Fn::Flatten`](#fnflatten) for an example. If a custom variable is used, the variable will also be replaced if found in the object key, see [`Fn::Merge`](#fnmerge) for an example.

```yaml
Fn::Map:
  - [80, 443]
  - CidrIp: 0.0.0.0/0
    FromPort: _
    ToPort: )
    IpProtocol: tcp
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

```yaml
SecurityGroupIngress:
  Fn::Flatten:
    Fn::Map:
      - [80, 443]
      - $
      - Fn::Map:
          - [10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16]
          - CidrIp: _
            FromPort: $
            ToPort: $
            IpProtocol: tcp
```

Results in:

```json
{ "SecurityGroupIngress": [{
  "CidrIp": "10.0.0.0/8",
  "FromPort": "80",
  "ToPort": "80",
  "IpProtocol": "tcp"
}, {
  "CidrIp": "172.16.0.0/12",
  "FromPort": "80",
  "ToPort": "80",
  "IpProtocol": "tcp"
}, {
  "CidrIp": "192.168.0.0/16",
  "FromPort": "80",
  "ToPort": "80",
  "IpProtocol": "tcp"
}, {
  "CidrIp": "10.0.0.0/8",
  "FromPort": "443",
  "ToPort": "443",
  "IpProtocol": "tcp"
}, {
  "CidrIp": "172.16.0.0/12",
  "FromPort": "443",
  "ToPort": "443",
  "IpProtocol": "tcp"
}, {
  "CidrIp": "192.168.0.0/16",
  "FromPort": "443",
  "ToPort": "443",
  "IpProtocol": "tcp"
}]}
```

## Fn::Merge

`Fn::Merge` will merge an array of objects into a single object. See [lodash / merge](https://devdocs.io/lodash~4/index#merge) for details on its behavior. This function is useful if you want to add functionality to an existing template if you want to merge objects of your template that have been created with [`Fn::Map`](#fnmap).

`Fn::Merge` accepts a list of objects that will be merged together. You can use other `cfn-include` functions such as `Fn::Include` to pull in template from remote locations such as S3 buckets.

```yaml
Fn::Merge:
  - !Include s3://my-templates/my-template.json

  - !Include s3://my-templates/my-other-template.json

  - Parameters:
      MyCustomParameter:
        Type: String

    Resources:
      MyBucket:
        Type: AWS::S3::Bucket
```

This snippet shows how multiple subnets can be created for each AZ and then merged with the rest of the template.

```yaml
Resources:
  IAMUser:
    Type: AWS::IAM::User
  SecurityGroup:
    Type: AWS::EC2::SecurityGroup
  Fn::Merge:
    - Fn::Map:
      - [A, B]
      - AZ
      - Subnet${AZ}:
          Type: AWS::EC2::Subnet
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

## Fn::Stringify

`Fn::Stringify` will take the passed value and transform it to a JSON string. This is useful for parameters that require a JSON document as a string. Using this function, you can keep writing your configuration in YAML and let the function transform it into a JSON string.

Another useful application is the use of this function in a config file passed as `--cli-input-json` parameter.

```
# stack.config.yml

StackName: MyStack

TemplateBody:
  Fn::Stringify: !Include mytemplate.yml

Parameters:
  - ParameterKey: Foo
    ParameterValue: Bar
```

You can then simply run the following command to deploy a stack:

```
cfn-include stack.config.yml > stack.config.json
aws cloudformation create-stack --cli-input-json file://stack.config.json
```

## More Examples

See [/examples](https://github.com/monken/cfn-include/tree/master/examples) for templates that call an API Gateway endpoint to collect AMI IDs for all regions. There is also a good amount of [tests](https://github.com/monken/cfn-include/tree/master/t) that might be helpful.

A common pattern is to process a template, validate it against the AWS [validate-template](https://docs.aws.amazon.com/cli/latest/reference/cloudformation/validate-template.html) API, minimize it and upload the result to S3. You can do this with a single line of code:

```bash
cfn-include example.template -t -m | aws s3 cp - s3://bucket-name/output.template
```

## Proxy Support

`cfn-include` honors proxy settings defined in the `https_proxy` environmental variable. The module will attempt to load `proxy-agent`. Make sure `proxy-agent` is installed since it is not a dependency for this module.

## Compatibility

Node.js versions 4 and up are supported both on Windows and Linux.

## Web Service

    curl https://api.netcubed.de/latest/template?[options] -XPOST -d @<path>

* `path`

  the contents of `path` will be `POST`ed to the web service. See `man curl` for details.

Options:

Options are query parameters.

* `validate=false` do not validate template [true]

To compile the synopsis run the following command.

```
curl -Ssf -XPOST https://api.netcubed.de/latest/template -d '{"Fn::Include":"https://raw.githubusercontent.com/monken/cfn-include/master/examples/synopsis.json"}' > output.template
```
