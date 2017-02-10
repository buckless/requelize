/**
 * Ensure database existance
 * @param  {Requelize} requelize requelize instance
 * @return {Promise<Database>} Resolve the database when it is ensured
 */
const ensureDb = ({ r, opts }) => {
  return r
    .dbCreate(opts.db)
    .run()
    .catch((err) => {
      /* istanbul ignore else */
      if (err.message.match(/^Database `.*` already exists in/)) {
        return Promise.resolve()
      }

      /* istanbul ignore next */
      throw err
    })
}

/**
 * Ensure a table is created based on a model definition
 * @param  {Model}     model     Model instance
 * @param  {Requelize} requelize requelize instance
 * @return {Promise<Table>} Resolve the table when it is ensured
 */
const ensureTable = (model, { r, opts }) => {
  return r
    .tableCreate(model._name, model._options)
    .run()
    .catch((err) => {
      /* istanbul ignore else */
      if (err.message.match(/^Table `.*` already exists/)) {
        return r.table(model._name)
      }

      /* istanbul ignore next */
      throw err
    })
}

/**
 * Ensure all indexes are created based on a model definition
 * @param  {Model}     model     Model instance
 * @param  {Requelize} requelize requelize instance
 * @return {Promise<Table>} Resolve the table when it is ensured
 */
const ensureIndexes = (model, { r, opts }) => {
  const indexes = model._indexes.map((index) => {
    return r.branch(
        r.table(model._name).info()('primary_key').eq(index.name),
        r.table(model._name).indexWait(index.name),
        r.table(model._name).indexCreate(index.name, index.func, index.opts)
          .do(function () {
            return r.table(model._name).indexWait(index.name)
          })
      )
      .run()
      .catch((err) => {
        /* istanbul ignore else */
        if (err.message.match(/^Index/)) {
          return r.table(model._name).indexWait(index.name)
        }

        /* istanbul ignore next */
        throw err
      })
  })

  return Promise.all(indexes)
}

/**
 * @param  {Requelize} requelize requelize instance
 * @return {Promise} Resolve when all models are ready
 */
function ready (requelize) {
  return ensureDb(requelize)
    .then(() => {
      const modelsReady = Object
        .keys(requelize.models)
        .map(name => requelize.models[name].ready())

      return Promise.all(modelsReady)
    })
}

/**
 * Ensure a model is ready. Ensure table exists and indexes ready
 * @param  {Model}     model     Model instance
 * @param  {Requelize} requelize requelize instance
 * @return {Promise} Resolve when all tables are created and indexes ready
 */
function modelReady (model, requelize) {
  return ensureTable(model, requelize)
    .then(() => ensureIndexes(model, requelize))
    .then(() => requelize.r.db(requelize.opts.db).wait())
    .then(() => requelize.r.table(model._name).wait())
    .then(() => requelize.r.table(model._name).indexWait())
}

/**
 * @param  {Requelize} requelize requelize instance
 * @return {Object} Object containing two functions : ready and modelReady
 */
module.exports = (requelize) => {
  return {
    ready: () => ready(requelize),
    modelReady: (model) => modelReady(model, requelize)
  }
}
