const { CloudFormation, S3 } = require('aws-sdk-proxy');
const { posix: path } = require('path');
const crypto = require('crypto');

class Client {
  constructor({ region = 'us-east-1', bucket, prefix }) {
    this.client = new CloudFormation({
      region,
    });
    this.s3 = new S3();
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
    await this.s3.putObject({
      Body: tpl,
      Bucket: this.bucket,
      Key: key,
    }).promise();
    const res = await callback(key);
    await this.s3.deleteObject({
      Bucket: this.bucket,
      Key: key,
    }).promise().catch(() => {});
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
      return this.uploadTemplate(tpl, (key) => this.client.validateTemplate({
        TemplateURL: `https://s3.${this.region}.amazonaws.com/${this.bucket}/${key}`,
      }).promise());
    }

    return this.client.validateTemplate({
      TemplateBody: tpl,
    }).promise();
  }
}

module.exports = Client;
