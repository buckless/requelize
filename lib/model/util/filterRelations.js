/**
 * Filter relationships
 * @internal
 * @param  {Class}     Model     Model class
 * @param  {Model}     inst      Model instance. Must be instance of Model (first argument)
 * @param  {Requelize} requelize requelize instance
 * @param  {Object}    tree      saveAll tree
 * @param  {...String} args      join type to filter
 * @return {Object[]} Object containing key join RelModel and subTree
 */
function filterRelations (Model, inst, requelize, tree, ...args) {
  return Object.keys(tree)
    .filter((key) => {
      return Model._joins.hasOwnProperty(key) &&
        inst.hasOwnProperty(Model._joins[key].field) &&
        args.indexOf(Model._joins[key].type) > -1
    })
    .map((key) => {
      const join = Model._joins[key]
      const RelModel = requelize.models[join.model]

      const subTree = (typeof tree[join.field] === 'object') ? tree[join.field] : null

      return { key, join, RelModel, subTree }
    })
}

module.exports = filterRelations
