/**
 * Triggers all events from Model hooks
 * Hooks are triggered sequentially
 * @internal
 * @param  {string} event event name
 * @param  {Class}  Model Model class
 * @param  {Model}  inst  Model instance. Must be instance of Model (fist argument)
 * @return {Promise<inst>} Promise resolving the instance modified by each hook
 */
module.exports = function (event, Model, inst) {
  let promise = Promise.resolve(inst)

  Model._events[event].forEach((hook) => {
    promise = promise.then((res) => hook(res))
  })

  return promise.then(() => inst)
}
