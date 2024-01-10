const Promise = require('bluebird');
const _ = require('lodash');

/*
  Maps over objects or iterables just like lodash.
*/
const mapWhatever = (promises, cb) =>
  Promise.try(() =>
    Promise.resolve(promises).then((arrayOrObject) => {
      if (_.isArray(arrayOrObject)) {
        return Promise.map(arrayOrObject, cb);
      }
      const size = Object.values(arrayOrObject).length;
      return Promise.all(_.map(arrayOrObject, (value, key) => cb(value, key, size)));
    })
  );

module.exports = {
  mapWhatever,
  mapX: mapWhatever,
};
