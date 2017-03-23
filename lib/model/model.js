const debug = require('debug')('requelize:model')

const Joi = require('joi')
const Query = require('./query')
const RequelizeError = require('../error')
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
 * @internal
 * @param  {Requelize} requelize requelize instance
 * @return {Function} createModel binded function
 */
function createModel (requelize) {
  /**
   * Create a model
   * @param  {string} name    Model name and table
   * @param  {Schema} schema  Schema definition
   * @param  {Object} options Table options (find options [here](https://rethinkdb.com/api/javascript/table_create/))
   * @return {Model} Created model
   */
  function bindedCreateModel (name, schema = {}, options_) {
    const options = Object.assign({
      primaryKey: 'id'
    }, options_)

    debug(`creating model ${name}`)

    // Base schema
    const Model = class {
      constructor (initialData = {}) {
        if (initialData instanceof Model) {
          return initialData
        }

        // Create getters/setters
        bindSchemaToModel(Model, this)
        // Create virtual getters
        bindVirtuals(Model, this)

        this._data = {}
        this._pivot = {}
        this._validate = true

        // Set initial values (must be after getters/setters)
        for (const key of Object.keys(initialData)) {
          this[key] = initialData[key]
        }

        debug(`instanciating ${Model._name} with data ${JSON.stringify(this._data)}`)
      }

      /**
       * Wait for the model to be ready
       * @return {Promise<void>} Resolves when ready
       */
      static ready () {
        return requelize.ready.modelReady(Model)
      }

      /**
       * Add hook to Model
       * @param {string}   event    Event name
       * @param {Function} callback Event callback (called with instance as argument). Must return Promise if asynchronous
       */
      static on (event, callback) {
        debug(`adding hook ${Model._name}@${event}`)

        if (!Model._events.hasOwnProperty(event)) {
          Model._events[event] = []
        }

        Model._events[event].push(callback)
      }

      /**
       * Add index to Model. All three arguments will be passed to indexCreate rql function
       * @param {string}   name   Index name (should be equal to model field)
       * @param {Function} [func] Optional index descriptor
       * @param {Object}   [opts] Optional index options
       */
      static index (name, func, opts) {
        debug(`adding index ${Model._name}:${name}`)
        Model._indexes.push({ name, func, opts })
      }

      /**
       * Add a virtual getter to Model
       * @param {string}   name Virtual field name
       * @param {Function} func Getter. Will be called with instance as argument
       */
      static virtual (name, func) {
        debug(`adding virtual ${Model._name}:${name}`)
        Model._virtuals.push({ name, func })
      }

      /**
       * Generate an index and a schema entry for a relationship. Useful for belongsTo only
       * @internal
       * @param {string} foreignKey Field name (= foreign key)
       */
      static _relField (foreignKey) {
        Model.index(foreignKey)
        Model._schema[foreignKey] = Joi.alternatives().try(
          Joi.string().guid().optional().allow(null),
          Joi.array().items(Joi.string().guid().optional().allow(null))
        )
      }

      /**
       * Generate a schema entry for a relationship. Useful for hasOne/hasMany/belongsToMany
       * @internal
       * @param {string} field Field name
       */
      static _relModel (field) {
        Model._schema[field] = Joi.any()
      }

      /**
       * Generate an hasOne relation
       * @param {string} model        Model name
       * @param {string} field        Field name
       * @param {string} [foreignKey] Foreign key. Defaults to {thismodel}_id
       */
      static hasOne (model, field, foreignKey = `${Model._name}_id`) {
        Model._relModel(field)
        Model._joins[field] = ({ type: 'hasOne', model, field, foreignKey })
      }

      /**
       * Generate an hasMany relation
       * @param {string} model      Model name
       * @param {string} field      Field name
       * @param {string} foreignKey Foreign key
       */
      static hasMany (model, field, foreignKey = `${Model._name}_id`) {
        Model._relModel(field)
        Model._joins[field] = ({ type: 'hasMany', model, field, foreignKey })
      }

      /**
       * Generate a belongsTo relation
       * @param {string} model      Model name
       * @param {string} field      Field name
       * @param {string} localKey Foreign key
       */
      static belongsTo (model, field, localKey = `${model}_id`) {
        Model._relModel(field)
        Model._relField(localKey)
        Model._joins[field] = ({ type: 'belongsTo', model, field, localKey })
      }

      /**
       * Generate a belongsToMany relation
       * @param {string} model      Model name
       * @param {string} field      Field name
       * @param {string} through Join table name
       */
      static belongsToMany (model, field, through) {
        if (!through) {
          const tableName = generateJoinTableName(Model._name, model)
          const JoinModel = bindedCreateModel(tableName, {
            [Model._name]: Joi.string().guid(),
            [model]: Joi.string().guid()
          })

          JoinModel.index(Model._name)
          JoinModel.index(model)
          Model._joins[field] = ({ type: 'belongsToMany', model, field, tableName, JoinModel })
        } else {
          Model._joins[field] = ({ type: 'belongsToMany', model, field, tableName: through })
        }

        Model._relModel(field)
      }

      /**
       * Create two indexes when makeing a custom join table
       * @param {string} ModelA Model name
       * @param {string} ModelB Model name
       */
      static customJoinTable (ModelA, ModelB) {
        Model.index(ModelA)
        Model.index(ModelB)
      }

      /**
       * Parse an object to a model instance
       * @internal
       * @param  {Object} obj Plain object
       * @return {Model} Model instance
       */
      static _parse (obj) {
        return parse(obj, Model, requelize)
      }

      /**
       * Add pivot data to a belongsToMany relationship
       * @param {string} modelName Target model name.
       * @param {Object} data      Stringifiable json data
       */
      setPivot (modelName, data) {
        debug(`adding pivot ${JSON.stringify(data)}`)
        this._pivot[modelName] = data
      }

      /**
       * Get pivot data from a belongsToMany relationship
       * @param  {string} [modelName] Source model name. Return full pivot object if no modelName provided
       * @return {Object} Retrieved data
       */
      getPivot (modelName) {
        return modelName ? Object.assign({}, this._pivot[modelName]) : this._pivot
      }

      /**
       * Disable or enable validation
       * @param  {boolean} newValue validation status
       * @return {Model} Self instance (chaining)
       */
      validate (newValue) {
        this._validate = newValue
        return this
      }

      /**
       * Save a model to database
       * @return {Promise<inst>} Promise resolving to instance
       */
      save () {
        debug(`saving ${Model._name} -> ${JSON.stringify(this._data)}`)
        let promise = takeEvents('validating', Model, this)
        let isSaved = Boolean((this[Model._options.primaryKey]))

        if (this._validate) {
          promise = promise
            .then(() => validateSchema(Model, this))
            .then(() => takeEvents('validated', Model, this))
        }

        if (isSaved) {
          promise = promise.then(() => takeEvents('updating', Model, this))
        } else {
          promise = promise.then(() => takeEvents('creating', Model, this))
        }

        promise = promise
          .then(() => takeEvents('saving', Model, this))
          .then(() => Model.parse(false).insert(this._data, { conflict: 'update' }).run())
          .then((res) => {
            // istanbul ignore if
            if (res.errors.length > 0) {
              return Promise.reject(new RequelizeError('WriteError', res.errors))
            }

            if (res.generated_keys) {
              debug(`adding ${Model._name}:${Model._options.primaryKey} = ${res.generated_keys[0]}`)
              this[Model._options.primaryKey] = res.generated_keys[0]
            }

            return this
          })

        if (isSaved) {
          promise = promise.then(() => takeEvents('updated', Model, this))
        } else {
          promise = promise.then(() => takeEvents('created', Model, this))
        }

        return promise.then(() => takeEvents('saved', Model, this))
      }

      /**
       * Delete a model from database
       * @return {Promise<inst>} Promise resolving to instance without primary key
       */
      delete () {
        debug(`deleting key ${Model._name}:${Model._options.primaryKey}(${this[options.primaryKey]})`)

        if (!(this[Model._options.primaryKey])) {
          return Promise.resolve(this)
        }

        return takeEvents('deleting', Model, this)
          .then(() => Model
            .get(this[Model._options.primaryKey])
            .delete()
            .run()
          )
          .then((res) => {
            // istanbul ignore if
            if (res.errors.length > 0) {
              return Promise.reject(new RequelizeError('WriteError', res.errors))
            }

            this[options.primaryKey] = null

            return takeEvents('deleted', Model, this)
          })
      }

      /**
       * Save model with relationships
       * tree should look like this : {
       *   relA: true,
       *   relB: {
       *     relInsideB: true
       *   }
       * }
       * @param  {Object} tree Tree relationship
       * @return {Promise<inst>} Promise resolving to instance with relationships
       */
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
    Model._events = {}

    bindRql(requelize, Model, Query)

    requelize.models[name] = Model

    return Model
  }

  return bindedCreateModel
}

module.exports = createModel
