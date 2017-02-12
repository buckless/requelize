const Joi = require('joi')
const RequelizeError = require('../error')

/**
 * Validate a model instance before saving
 * @param  {Class} Model    Model class
 * @param  {Model} instance Model instance. Must be instance of Model (first argument)
 * @return {[type]}          [description]
 */
function validateSchema (Model, instance) {
  return new Promise((resolve, reject) => {
    Joi.validate(instance._data, Model._schema, (err) => {
      if (err) {
        return reject(new RequelizeError('ValidationError', err.details))
      }

      resolve()
    })
  })
}

module.exports = validateSchema
