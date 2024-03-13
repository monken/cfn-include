# cft-utils

This projects goal is to provide information and capabilities of what AWS Cloudformation
actually provides. There are many missing gaps and this library intends to fill them. The
original goal of this library is to identify all AWS Resources which are actually Taggable via
a Cloudformation Template.

Note: the first time the library is run it processes the aws-cd-lib for taggable resources. This
is then cached inside of `./src/cache/*.json` .

## install

`npm i --save @cfn-include/utils`

## SDK

```js
const lib = require('@cfn-include/utils');
(async () => 
  console.log(await lib.resources.taggable.getResources())
  console.log(await lib.resources.taggable.getResourceMap())

  await lib.resources.taggable.isTaggableResource('AWS::IAM::Role') // true
)();
```

## CLI Tools

```bash
$ ./bin/taggableResourceMap.js
{"AWS::AccessAnalyzer::Analyzer":true,"AWS::ACMPCA::CertificateAuthority":true,"AWS::AmazonMQ::Broker":true,"AWS::AmazonMQ::Configuration":true,"AWS::Amplify::App":true,"AWS::Amplify::Branch":true,"AWS::AmplifyUIBuilder::Component":true,"AWS::AmplifyUIBuilder::Form":true,"AWS::AmplifyUIBuilder::Theme":true,"AWS::ApiGatewayV2::Api":true,"AWS::ApiGatewayV2::DomainName":true,"AWS::ApiGatewayV2::Stage":true,"AWS::ApiGatewayV2::VpcLink":true,"AWS::AppConfig::Extension":true,
... more items
```

```bash
$ ./bin/taggableResources.js
["AWS::AccessAnalyzer::Analyzer","AWS::ACMPCA::CertificateAuthority","AWS::AmazonMQ::Broker","AWS::AmazonMQ::Configuration","AWS::Amplify::App","AWS::Amplify::Branch","AWS::AmplifyUIBuilder::Component","AWS::AmplifyUIBuilder::Form","AWS::AmplifyUIBuilder::Theme",
... more items
```
