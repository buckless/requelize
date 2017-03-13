const generateJoinId = require('./util/generateJoinId')
const filterRelations = require('./util/filterRelations')

module.exports = function (Model, inst, requelize, tree) {
  if (!tree) {
    return inst.save()
  }

  const saveBelongsTo = () => filterRelations(Model, inst, requelize, tree, 'belongsTo')
    .map(({ key, join, RelModel, subTree }) => {
      const subInst = new RelModel(inst[join.field])

      return subInst
        .saveAll(subTree)
        .then(() => {
          inst[join.field] = subInst
          inst[join.localKey] = subInst[RelModel._options.primaryKey]
        })
    })

  const saveSelf = () => inst.save()

  const saveHasOneOrMany = () => filterRelations(Model, inst, requelize, tree, 'hasOne', 'hasMany')
    .map(({ key, join, RelModel, subTree }) => {
      if (Array.isArray(inst[join.field])) {
        return Promise
          .all(inst[join.field]
          .map((subInst) => {
            subInst = new RelModel(subInst)

            subInst[join.foreignKey] = inst[Model._options.primaryKey]

            return subInst
              .saveAll(subTree)
              .then(() => subInst)
          }))
          .then((subInsts) => {
            inst[join.field] = subInsts
          })
      }

      const subInst = new RelModel(inst[join.field])
      subInst[join.foreignKey] = inst[Model._options.primaryKey]

      return subInst
        .saveAll(subTree)
        .then(() => {
          inst[join.field] = subInst
        })
    })

  const saveBelongsToMany = () => filterRelations(Model, inst, requelize, tree, 'belongsToMany')
    .map(({ key, join, RelModel, subTree }) => {
      return Promise.all(inst[join.field].map((subInst) => {
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
      }))
      .then((subInsts) => {
        inst[join.field] = subInsts
      })
    })

  let promise

  // save belongsTo
  promise = Promise.all(saveBelongsTo())

  // Save self document
  promise = promise.then(saveSelf)

  // save hasOne / hasMany
  promise = promise.then(() => Promise.all(saveHasOneOrMany()))

  promise = promise.then(() => Promise.all(saveBelongsToMany()))

  return promise
}
