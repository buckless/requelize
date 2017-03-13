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
