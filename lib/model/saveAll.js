const debug = require('debug')('requelize:model:saveAll')

const saveBelongsToMany = require('./saveAll.belongsToMany')
const filterRelations = require('./util/filterRelations')

/**
 * Save a model and its sub instances
 * @param  {Class}     Model     Model class
 * @param  {Model}     inst      Model instance. Must be instance of Model (first argument)
 * @param  {Requelize} requelize Requelize instance
 * @param  {Object}    tree      Tree definition
 * @return {Promise<inst>} Promise resolving to inst with primary key
 */
module.exports = function (Model, inst, requelize, tree) {
  if (!tree) {
    return inst.save()
  }

  debug(`saving ${Model._name} ${JSON.stringify(inst)} with tree ${JSON.stringify(tree)}`)

  // First : save belongs to relationships to have local keys
  const saverBelongsTo = () => filterRelations(Model, inst, requelize, tree, 'belongsTo')
    .map(({ key, join, RelModel, subTree }) => {
      const subInst = new RelModel(inst[join.field])

      debug(`saving belongsTo ${Model._name}:${key} -> ${RelModel._name}`)

      return subInst
        .saveAll(subTree)
        .then(() => {
          // Add sub instance to result
          inst[join.field] = subInst

          // Add localKey
          debug(`adding ${Model._name}:${join.localKey} = ${RelModel._name}:${RelModel._options.primaryKey}`)
          inst[join.localKey] = subInst[RelModel._options.primaryKey]
        })
    })

  // Second : save itself
  const saverSelf = () => {
    debug(`saving self document ${Model._name}`)
    return inst.save()
  }

  // Third : save hasOne/hasMany relations (with inst primaryKey)
  const saverHasOneOrMany = () => filterRelations(Model, inst, requelize, tree, 'hasOne', 'hasMany')
    .map(({ key, join, RelModel, subTree }) => {
      // hasMany
      if (Array.isArray(inst[join.field])) {
        debug(`saving hasMany ${Model._name}:${key} -> ${RelModel._name}`)
        return Promise
          .all(
            inst[join.field].map((subInst) => {
              subInst = new RelModel(subInst)

              debug(`adding ${Model._name}:${join.foreignKey} = ${RelModel._name}:${RelModel._options.primaryKey}`)
              subInst[join.foreignKey] = inst[Model._options.primaryKey]

              return subInst
                .saveAll(subTree)
                .then(() => subInst)
            })
          )
          .then((subInsts) => {
            inst[join.field] = subInsts
          })
      }

      // hasOne
      debug(`saving hasOne ${Model._name}:${key} -> ${RelModel._name}`)
      const subInst = new RelModel(inst[join.field])
      subInst[join.foreignKey] = inst[Model._options.primaryKey]

      return subInst
        .saveAll(subTree)
        .then(() => {
          debug(`adding ${Model._name}:${join.field} = ${RelModel._name}:${RelModel._options.primaryKey}`)
          inst[join.field] = subInst
        })
    })

  // Last : save belongsToMany relationships
  const saverBelongsToMany = () => {
    return filterRelations(Model, inst, requelize, tree, 'belongsToMany')
      .map(({ key, join, RelModel, subTree }) => {
        return saveBelongsToMany(Model, inst, requelize, key, join, RelModel, subTree)
      })
  }

  return Promise.all(saverBelongsTo())
    .then(() => saverSelf())
    .then(() => Promise.all(saverHasOneOrMany()))
    .then(() => Promise.all(saverBelongsToMany()))
    .then(() => inst)
}
