module.exports = (obj, Model, requelize) => {
  if (!obj) {
    return
  }

  if (Array.isArray(obj)) {
    return obj.map(inst => Model._parse(inst))
  }

  obj = new Model(obj)

  for (let key of Object.keys(Model._joins)) {
    const join = Model._joins[key]

    if (obj.hasOwnProperty(join.field)) {
      obj[join.field] = requelize.models[join.model]._parse(obj[key])
    }
  }

  return obj
}
