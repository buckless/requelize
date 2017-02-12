/**
 * Create getters and setters for instance
 * @param  {Class} Model    Model class
 * @param  {Model} instance Model instance. Must be instance of Model (first argument)
 */
function bindSchemaToModel (Model, instance) {
  Object
    .keys(Model._schema)
    .forEach(key => {
      Object.defineProperty(instance, key, {
        enumerable: true,
        get: () => instance._data[key],
        set: (v) => { instance._data[key] = v }
      })
    })
}

module.exports = bindSchemaToModel
