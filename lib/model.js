const Joi = require('joi')

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

function validateSchema (Model, instance) {
  return new Promise((resolve, reject) => {
    Joi.validate(instance._data, Model._schema, (err) => {
      if (err) {
        return reject(err)
      }

      resolve()
    })
  })
}

/**
 * Bind requelize instance for createModel function
 * @param  {requelize} requelize instance
 * @return {Function} createModel binded function
 */
function createModel (requelize) {
  // List all rethinkdb commands
  const Term = Object.getPrototypeOf(requelize.r.expr(1))

  /**
   * Create a model
   * @param  {String} name    Model name and table
   * @param  {Schema} schema  Schema definition
   * @param  {Object} options Table options (find options [here](https://rethinkdb.com/api/javascript/table_create/))
   * @return {Model} Created model
   */
  return function (name, schema = {}, options_) {
    const options = Object.assign({
      primaryKey: 'id'
    }, options_)

    // Base schema
    const Model = class {
      constructor () {
        bindSchemaToModel(Model, this)

        this._data = {}
      }

      static ready () {
        return requelize.ready.modelReady(Model)
      }

      static index (name, func, opts) {
        Model._indexes.push({ name, func, opts })
      }

      save () {
        return validateSchema(Model, this)
          .then(() => Model.insert(this._data, { conflict: 'update' }))
          .then((res) => {
            if (res.generated_keys) {
              this[Model._options.primaryKey] = res.generated_keys[0]
            }

            return res
          })
      }
    }

    // Add primaryKey to schema
    schema[options.primaryKey] = Joi.string().guid().optional().allow(null)

    Model._name = name
    Model._schema = schema
    Model._options = options
    Model._indexes = []

    // Import rethinkdb commands
    for (let key of Object.keys(Term)) {
      if (key === 'constructor' || key === 'run' || key[0] === '_') {
        continue
      }

      (function (key) {
        Model[key] = function (...args) {
          return requelize.r.table(name)[key](...args)
        }
      }(key))
    }

    requelize.models[name] = Model

    return Model
  }
}

module.exports = createModel
