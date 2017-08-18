const debug = require('debug')('requelize:init')

const r = require('rethinkdbdash')
const model = require('./model')
const ready = require('./ready')
const RequelizeError = require('./error')

/**
 * Create a requelize instance
 * @param  {Object} opts Databse passed to rethinkdb driver (find options [here](https://github.com/neumino/rethinkdbdash#importing-the-driver))
 * @return {Requelize} requelize instance
 */
module.exports = (opts_) => {
  const opts = Object.assign({
    db: 'test',
    silent: true
  }, opts_)

  const requelize = {
    r: r(opts),
    model,
    ready,
    opts,
    models: [],
    RequelizeError
  }

  requelize.model = requelize.model(requelize)
  requelize.ready = requelize.ready(requelize)
  requelize.sync = requelize.ready.ready

  debug(`requelize instance created with opts ${JSON.stringify(opts)}`)

  return requelize
}
