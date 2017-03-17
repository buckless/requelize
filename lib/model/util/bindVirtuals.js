/**
 * Create virtual fields getters for instance
 * @param  {Class} Model    Model class
 * @param  {Model} instance Model instance. Must be instance of Model (first argument)
 */
function bindSchemaToModel (Model, instance) {
  Model._virtuals
    .forEach((virtual) => {
      Object.defineProperty(instance, virtual.name, {
        enumerable: true,
        get: () => virtual.func(instance)
      })
    })
}

module.exports = bindSchemaToModel
