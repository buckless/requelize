/**
 * Create a hidden property
 * Useful when printing JSON models
 * @param {Object} obj   Object
 * @param {String} prop  Property name
 * @param {Object} value Any value
 */
module.exports = (obj, prop, value) => {
  Object.defineProperty(obj, prop, {
    enumerable: false,
    writable: true,
    value
  })
}
