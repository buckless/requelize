const debug = require('debug')('requelize:model:util')

const Joi = require('joi')
const RequelizeError = require('../../error')

/**
 * Validate a model instance before saving
 * @internal
 * @param  {Class} Model    Model class
 * @param  {Model} instance Model instance. Must be instance of Model (first argument)
 * @return {Promise<void>} Resolves without value or reject with RequelizeError
 */
function validateSchema (Model, instance) {
  return new Promise((resolve, reject) => {
    debug(`validating ${JSON.stringify(instance._data)}`)
    Joi.validate(instance._data, Model._schema, (err) => {
      if (err) {
        return reject(new RequelizeError('ValidationError', err.details))
      }

      resolve()
    })
  })
}

module.exports = validateSchema
