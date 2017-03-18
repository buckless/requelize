const generateJoinId = require('./util/generateJoinId')
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

  // First : save belongs to relationships to have local keys
  const saveBelongsTo = () => filterRelations(Model, inst, requelize, tree, 'belongsTo')
    .map(({ key, join, RelModel, subTree }) => {
      const subInst = new RelModel(inst[join.field])

      return subInst
        .saveAll(subTree)
        .then(() => {
          // Add sub instance to result
          inst[join.field] = subInst

          // Add localKey
          inst[join.localKey] = subInst[RelModel._options.primaryKey]
        })
    })

  // Second : save itself
  const saveSelf = () => inst.save()

  // Third : save hasOne/hasMany relations (with inst primaryKey)
  const saveHasOneOrMany = () => filterRelations(Model, inst, requelize, tree, 'hasOne', 'hasMany')
    .map(({ key, join, RelModel, subTree }) => {
      // hasMany
      if (Array.isArray(inst[join.field])) {
        return Promise
          .all(
            inst[join.field].map((subInst) => {
              subInst = new RelModel(subInst)

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
      const subInst = new RelModel(inst[join.field])
      subInst[join.foreignKey] = inst[Model._options.primaryKey]

      return subInst
        .saveAll(subTree)
        .then(() => {
          inst[join.field] = subInst
        })
    })

  // Last : save belongsToMany relationships
  const saveBelongsToMany = () => filterRelations(Model, inst, requelize, tree, 'belongsToMany')
    .map(({ key, join, RelModel, subTree }) => {
      return Promise.all(
        inst[join.field].map((subInst) => {
          subInst = new RelModel(subInst)

          return subInst.saveAll(subTree)
            .then(() => {
              const joinId = generateJoinId(Model, RelModel, inst, subInst)
              const joinRel = new join.JoinModel({
                id: joinId,
                [Model._name]: inst[Model._options.primaryKey],
                [RelModel._name]: subInst[RelModel._options.primaryKey]
              })

              joinRel._data.pivot = subInst.getPivot(Model._name)

              return joinRel.validate(false).save()
            })
            .then(() => subInst)
        })
      )
      .then((subInsts) => {
        inst[join.field] = subInsts
      })
    })

  return Promise.all(saveBelongsTo())
    .then(saveSelf)
    .then(() => Promise.all(saveHasOneOrMany()))
    .then(() => Promise.all(saveBelongsToMany()))
    .then(() => inst)
}
