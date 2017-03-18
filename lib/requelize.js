const r = require('rethinkdbdash')
const model = require('./model')
const ready = require('./ready')

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
    models: []
  }

  requelize.model = requelize.model(requelize)
  requelize.ready = requelize.ready(requelize)
  requelize.sync = requelize.ready.ready

  return requelize
}
