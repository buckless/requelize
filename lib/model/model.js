const Joi = require('joi')
const Query = require('./query')
const validateSchema = require('./util/validateSchema')
const bindSchemaToModel = require('./util/bindSchemaToModel')
const bindVirtuals = require('./util/bindVirtuals')
const bindRql = require('./util/bindRql')
const generateJoinTableName = require('./util/generateJoinTableName')
const takeEvents = require('./util/takeEvents')
const parse = require('./parse')
const saveAll = require('./saveAll')

/**
 * Bind requelize instance for createModel function
 * @param  {Requelize} requelize requelize instance
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
  function bindedCreateModel (name, schema = {}, options_) {
    const options = Object.assign({
      primaryKey: 'id'
    }, options_)

    // Base schema
    const Model = class {
      constructor (initialData = {}) {
        if (initialData instanceof Model) {
          return initialData
        }

        bindSchemaToModel(Model, this)
        bindVirtuals(Model, this)

        this._data = {}
        this._pivot = {}
        this._validate = true

        for (const key of Object.keys(initialData)) {
          this[key] = initialData[key]
        }
      }

      static ready () {
        return requelize.ready.modelReady(Model)
      }

      static on (event, promise) {
        Model._events[event].push(promise)
      }

      static index (name, func, opts) {
        Model._indexes.push({ name, func, opts })
      }

      static virtual (name, func) {
        Model._virtuals.push({ name, func })
      }

      static _relField (foreignKey) {
        Model.index(foreignKey)
        Model._schema[foreignKey] = Joi.alternatives().try(
          Joi.string().guid().optional().allow(null),
          Joi.array().items(Joi.string().guid().optional().allow(null))
        )
      }

      static _relModel (field) {
        Model._schema[field] = Joi.any()
      }

      static hasOne (model, field, foreignKey) {
        Model._relModel(field)
        Model._joins[field] = ({ type: 'hasOne', model, field, foreignKey })
      }

      static hasMany (model, field, foreignKey) {
        Model._relModel(field)
        Model._joins[field] = ({ type: 'hasMany', model, field, foreignKey })
      }

      static belongsTo (model, field, localKey) {
        Model._relModel(field)
        Model._relField(localKey)
        Model._joins[field] = ({ type: 'belongsTo', model, field, localKey })
      }

      static belongsToMany (model, field, tableName) {
        tableName = tableName || generateJoinTableName(Model._name, model)

        const JoinModel = bindedCreateModel(tableName, {
          [Model._name]: Joi.string().guid(),
          [model]: Joi.string().guid()
        })

        JoinModel.index(Model._name)
        JoinModel.index(model)

        Model._relModel(field)
        Model._joins[field] = ({ type: 'belongsToMany', model, field, tableName, JoinModel })
      }

      static _parse (obj) {
        return parse(obj, Model, requelize)
      }

      setPivot (modelName, data) {
        this._pivot[modelName] = data
      }

      getPivot (modelName) {
        return Object.assign({}, this._pivot[modelName])
      }

      validate (newValue) {
        this._validate = newValue
        return this
      }

      save () {
        let promise = takeEvents('preValidate', Model, this)

        if (this._validate) {
          promise = validateSchema(Model, this)
            .then(() => takeEvents('postValidate', Model, this))
        }

        return promise
          .then(() => takeEvents('preSave', Model, this))
          .then(() => Model.insert(this._data, { conflict: 'update' }).run())
          .then((res) => {
            if (res.generated_keys) {
              this[Model._options.primaryKey] = res.generated_keys[0]
            }

            res.instance = this

            return res
          })
          .then(() => takeEvents('postSave', Model, this))
          .catch((err) => {
            throw err
          })
      }

      saveAll (tree) {
        return saveAll(Model, this, requelize, tree)
      }
    }

    // Add primaryKey to schema
    schema[options.primaryKey] = Joi.string().guid().optional().allow(null)

    Model._name = name
    Model._schema = schema
    Model._options = options
    Model._indexes = []
    Model._virtuals = []
    Model._joins = {}
    Model._events = { preSave: [], postSave: [], preValidate: [], postValidate: [] }

    bindRql(requelize, Model, Query)

    requelize.models[name] = Model

    return Model
  }

  return bindedCreateModel
}

module.exports = createModel
