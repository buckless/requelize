const debug = require('debug')('requelize:model:parse')

/**
 * Parse a plain object to a Model instance
 * @internal
 * @param  {Object}    obj       Plain JSON object
 * @param  {Object}    opts      Parse options
 * @param  {Class}     Model     Model
 * @param  {Requelize} requelize requelize instance
 * @return {Model} Model instance. Will be instance of Model (second argument)
 */
module.exports = (obj, opts, Model, requelize) => {
  if (!obj) {
    // return null if null, undefined if undefined
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(inst => Model._parse(inst, opts))
  }

  debug(`parsing ${Model._name} ${JSON.stringify(obj)}`)

  obj = new Model(obj)

  for (let key of Object.keys(Model._joins)) {
    const join = Model._joins[key]

    if (obj.hasOwnProperty(join.field)) {
      obj[join.field] = requelize.models[join.model]._parse(obj[key])
    }
  }

  if (opts.setIsSaved) {
    obj._saved = true
  }

  return obj
}
