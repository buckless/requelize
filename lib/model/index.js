const Joi = require('joi')
const Query = require('./query')
const validateSchema = require('./validateSchema')
const bindSchemaToModel = require('./bindSchemaToModel')
const bindRql = require('./bindRql')
const generateJoinTableName = require('./generateJoinTableName')

/**
 * Bind requelize instance for createModel function
 * @param  {requelize} requelize instance
 * @return {Function} createModel binded function
 */
function createModel (requelize) {
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
      constructor (initialData = {}) {
        bindSchemaToModel(Model, this)

        this._data = {}

        for (const key of Object.keys(initialData)) {
          this[key] = initialData[key]
        }
      }

      static ready () {
        return requelize.ready.modelReady(Model)
      }

      static index (name, func, opts) {
        Model._indexes.push({ name, func, opts })
      }

      static _relField (foreignKey) {
        Model.index(foreignKey)
        Model._schema[foreignKey] = Joi.alternatives().try(
          Joi.string().guid().optional().allow(null),
          Joi.array().items(Joi.string().guid().optional().allow(null))
        )
      }

      static hasOne (model, field, foreignKey) {
        Model._joins[field] = ({ type: 'hasOne', model, field, foreignKey })
      }

      static hasMany (model, field, foreignKey) {
        Model._joins[field] = ({ type: 'hasMany', model, field, foreignKey })
      }

      static belongsTo (model, field, localKey) {
        Model._relField(localKey)
        Model._joins[field] = ({ type: 'belongsTo', model, field, localKey })
      }

      static belongsToMany (model, field, tableName_) {
        const tableName = tableName_ || generateJoinTableName(Model._name, model)

        Model._relField(field)
        Model._joins[field] = ({ type: 'belongsToMany', model, field, tableName })
      }

      static run (...args) {
        return new Query(requelize.r.table(this._name), Model, requelize).run(...args)
      }

      static embed (tree) {
        return new Query(requelize.r.table(this._name), Model, requelize).embed(tree)
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
    Model._joins = {}

    bindRql(requelize, Model, Query)

    requelize.models[name] = Model

    return Model
  }
}

module.exports = createModel
