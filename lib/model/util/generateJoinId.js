const debug = require('debug')('requelize:model:util')

/**
 * Return join id based on two model instances
 * @internal
 * @param  {Class} ModelA First model
 * @param  {Class} ModelB Second model
 * @param  {Model} instA  First instance. Must be instance of ModelA (first argument)
 * @param  {Model} instB  Second instance. Must be instance of ModelB (second argument)
 * @return {string} Genreated id
 */
module.exports = (ModelA, ModelB, instA, instB) => {
  const idA = instA[ModelA._options.primaryKey]
  const idB = instB[ModelB._options.primaryKey]

  debug(`generating join id between ${ModelA._name} and ${ModelB._name}`)

  return [ModelA._name, ModelB._name]
    .sort((n1, n2) => n1.toLowerCase().localeCompare(n2.toLowerCase()))
    .map((name, index) => (index === 0) ? idA : idB)
    .join('_')
}
