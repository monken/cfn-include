const {
  CloudFormationClient,
  ValidateTemplateCommand,
} = require('@aws-sdk/client-cloudformation');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { addProxyToClient } = require('aws-sdk-v3-proxy');

const { posix: path } = require('path');
const crypto = require('crypto');

const S3 = (opts = {}) => addProxyToClient(new S3Client(opts));
const CloudFormation = (opts = {}) => addProxyToClient(new CloudFormationClient(opts));

class Client {
  constructor({ region = 'us-east-1', bucket, prefix }) {
    this.client = CloudFormation({
      region,
    });
    this.s3 = S3();
    this.bucket = bucket;
    this.prefix = prefix;
    this.region = region;
  }

  digest(input) {
    const hash = crypto.createHash('md5');
    hash.update(input);
    return hash.digest('hex');
  }

  async uploadTemplate(tpl, callback) {
    const key = path.join(this.prefix, `${this.digest(tpl)}.json`);
    await this.s3.Send(
      new PutObjectCommand({
        Body: tpl,
        Bucket: this.bucket,
        Key: key,
      })
    );

    let res, err;
    try {
      res = await callback(key);
    } catch (e) {
      err = e;
    }
    await this.s3
      .send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      )
      .catch(() => {});
    if (err) throw err;
    return res;
  }

  async validateTemplate(tpl = '') {
    const needsUpload = tpl.length > 51200;
    if (needsUpload && !this.bucket) {
      throw 'Cannot validate template larger than 50k without a bucket. Please provide a bucket name.';
    }
    if (needsUpload && tpl.length > 460800) {
      throw 'Template exceeds maximum size of 450k';
    }
    if (needsUpload) {
      return this.uploadTemplate(tpl, (key) =>
        this.client
          .send(
            new ValidateTemplateCommand({
              TemplateURL: `https://s3.${this.region}.amazonaws.com/${this.bucket}/${key}`,
            })
          )
          .promise()
      );
    }

    return this.client.send(
      new ValidateTemplateCommand({
        TemplateBody: tpl,
      })
    );
  }
}

module.exports = Client;
