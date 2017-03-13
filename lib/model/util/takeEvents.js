module.exports = function (event, Model, inst) {
  let promise = Promise.resolve(inst)

  Model._events[event].forEach((hook) => {
    promise = promise.then((res) => hook(res))
  })

  return promise.then(() => inst)
}
