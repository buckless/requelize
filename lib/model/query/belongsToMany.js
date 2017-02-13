module.exports = function (Query, requelize, Model, join, tree, key) {
  const RelModel = requelize.models[join.model]
  const relTable = requelize.r.table(join.tableName)
  const hasNesting = (typeof tree[key] === 'object')

  return function (doc) {
    const q = relTable
      .getAll(doc(Model._options.primaryKey), { index: Model._name })
      .map((joinRow) => {
        return requelize.r.table(RelModel._name)
          .get(joinRow(RelModel._name))
          .merge((rel) => {
            return {
              _pivot: joinRow.without('id', Model._name, RelModel._name).default(null)
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
