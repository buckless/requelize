const debug = require('debug')('requelize:model:saveAll')
const generateJoinId = require('./util/generateJoinId')

function baseSaveAll (Model, inst, requelize, key, join, RelModel, subTree, subInst_) {
  debug(`saving belongsToMany ${Model._name}:${key} -> ${RelModel._name}`)
  const subInst = (typeof subInst_ === 'string') ? RelModel.get(subInst_) : Promise.resolve(new RelModel(subInst_))

  return subInst
    .then(subInst => subInst.saveAll(subTree))
    .then((subInst) => {
      const joinId = generateJoinId(Model, RelModel, inst, subInst)
      const joinRel = new join.JoinModel({
        id: joinId,
        [Model._name]: inst[Model._options.primaryKey],
        [RelModel._name]: subInst[RelModel._options.primaryKey]
      })

      joinRel._data.pivot = subInst.getPivot(Model._name)
      debug(`getting pivot ${Model._name} ${JSON.stringify(joinRel._data.pivot)}`)

      return joinRel.validate(false).save()
    })
    .then(() => subInst)
}

function saveThrough (Model, inst, requelize, key, join, RelModel, subTree, subInst) {
  debug(`saving belongsToMany ${Model._name}:${key} -> ${RelModel._name} through ${join.JoinModel}`)

  const JoinModel = requelize.models[join.tableName]

  subInst.document = new RelModel(subInst.document)
  const joinRel = new JoinModel(subInst.through)

  return subInst.document.saveAll(subTree)
    .then(() => {
      joinRel.id = generateJoinId(Model, RelModel, inst, subInst.document)
      joinRel._data[Model._name] = inst[Model._options.primaryKey]
      joinRel._data[RelModel._name] = subInst.document[RelModel._options.primaryKey]

      joinRel._data.pivot = subInst.document.getPivot(Model._name)
      debug(`getting pivot ${Model._name} ${JSON.stringify(joinRel._data.pivot)}`)

      debug(`saving join document ${JSON.stringify(joinRel._data)}`)

      return joinRel.validate(false).saveAll(subInst.saveAll)
    })
    .then(() => {
      return Object.assign({
        _through: subInst.through
      }, subInst.document)
    })
}

module.exports = (Model, inst, requelize, key, join, RelModel, subTree) => {
  debug(`saving three way relationship`)

  return Promise.all(
    inst[join.field].map((subInst) => {
      if (subInst.document && subInst.through && subInst.saveAll) {
        return saveThrough(Model, inst, requelize, key, join, RelModel, subTree, subInst)
      } else {
        return baseSaveAll(Model, inst, requelize, key, join, RelModel, subTree, subInst)
      }
    })
  )
  .then((subInsts) => {
    debug(`adding ${Model._name}:${join.field} = ${RelModel._name}:${RelModel._options.primaryKey}`)
    inst[join.field] = subInsts
  })
}
