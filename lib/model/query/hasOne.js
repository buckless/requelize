const debug = require('debug')('requelize:model:query')

/**
 * Retrieve related document from a hasOne relationship
 * @internal
 * @param  {Class}     Query     Query class
 * @param  {Requelize} requelize requelize instance
 * @param  {Class}     Model     Model definition
 * @param  {Object}    join      join object
 * @param  {Object}    tree      remaining tree
 * @param  {string}    key       relation name
 * @return {Function} retriever function
 */
module.exports = function (Query, requelize, Model, join, tree, key) {
  const RelModel = requelize.models[join.model]
  const relTable = requelize.r.table(RelModel._name)
  const hasNesting = (typeof tree[key] === 'object')
  const selfPk = Model._options.primaryKey

  debug(
    'hasOne - create wrapper to retrieve' +
    `${Model._name}:${key} -> ${RelModel._name}:${join.foreignKey}` +
    `(nesting: ${hasNesting})`
  )

  return function (doc) {
    const q = relTable
      .getAll(doc(selfPk), { index: join.foreignKey })
      .nth(0)
      .default(null)

    let embedQuery = new Query(q, RelModel, requelize)

    if (hasNesting) {
      embedQuery = embedQuery.embed(tree[key])
    }

    return embedQuery._query
  }
}
