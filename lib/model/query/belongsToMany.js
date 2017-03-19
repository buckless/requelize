const debug = require('debug')('requelize:model:query')

/**
 * Retrieve related document from a belongsToMany relationship
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
  const relTable = requelize.r.table(join.tableName)
  const hasNesting = (typeof tree[key] === 'object')

  debug(
    'belongsToMany - create wrapper to retrieve' +
    `${Model._name}:${key} <- ${join.tableName} -> ${RelModel._name}:${RelModel._options.primaryKey}` +
    `(nesting: ${hasNesting})`
  )

  return function (doc) {
    const q = relTable
      .getAll(doc(Model._options.primaryKey), { index: Model._name })
      .map((joinRow) => {
        return requelize.r.table(RelModel._name)
          .get(joinRow(RelModel._name))
          .merge((rel) => {
            return {
              _pivot: joinRow('pivot').default(null)
            }
          })
      })
      .coerceTo('array')

    let embedQuery = new Query(q, RelModel, requelize)

    if (hasNesting) {
      embedQuery = embedQuery.embed(tree[key])
    }

    return embedQuery._query
  }
}
