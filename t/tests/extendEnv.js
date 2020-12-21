const { omit } = require('lodash')

const extendEnv = (env, cb) => {
  if (env) {
    Object.assign(process.env, env);
  }
  cb()
  if (env) {
    omit(process.env, Object.keys(env));
  }
}

module.exports = extendEnv;