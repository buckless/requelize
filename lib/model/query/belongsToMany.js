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
  const JoinModel = requelize.models[join.tableName]
  const hasNesting = (typeof tree[key] === 'object')

  debug(
    'belongsToMany - create wrapper to retrieve' +
    `${Model._name}:${key} <- ${join.tableName} -> ${RelModel._name}:${RelModel._options.primaryKey}` +
    `(nesting: ${hasNesting})`
  )

  let thirdTree = null
  if (tree[key]._through) {
    thirdTree = Object.assign({}, tree[key]._through)
    tree[key] = null
  }

  return function (doc) {
    const q = JoinModel
      .getAll(doc(Model._options.primaryKey), { index: Model._name })
      .map((joinRow) => {
        return RelModel
          .get(joinRow(RelModel._name))
          .merge((rel) => {
            return {
              _pivot: joinRow('pivot').default(null),
              _through: new Query(joinRow, JoinModel, requelize).embed(thirdTree)._query
            }
          })
          ._query
      })
      ._query
      .coerceTo('array')

    let embedQuery = new Query(q, RelModel, requelize)

    if (hasNesting) {
      embedQuery = embedQuery.embed(tree[key])
    }

    return embedQuery._query
  }
}
