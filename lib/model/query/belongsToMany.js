module.exports = function (Query, requelize, Model, join, tree, key) {
  const RelModel = requelize.models[join.model]
  const relTable = requelize.r.table(join.tableName)
  const hasNesting = (typeof tree[key] === 'object')

  return function (doc) {
    const q = relTable
      .getAll(doc(Model._options.primaryKey), { index: Model._name })
      .map((rel) => {
        return requelize.r.table(RelModel._name).get(rel(RelModel._name))
      })
      .coerceTo('array')

    let embedQuery = new Query(q, RelModel, requelize)

    if (hasNesting) {
      embedQuery = embedQuery.embed(tree[key])
    }

    return embedQuery._query
  }
}
