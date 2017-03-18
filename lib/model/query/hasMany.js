/**
 * Retrieve related document from a hasMany relationship
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

  return function (doc) {
    const q = relTable
      .getAll(doc(selfPk), { index: join.foreignKey })
      .coerceTo('array')

    let embedQuery = new Query(q, RelModel, requelize)

    if (hasNesting) {
      embedQuery = embedQuery.embed(tree[key])
    }

    return embedQuery._query
  }
}
