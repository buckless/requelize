const { test, requelize, dropDb } = require('./utils')

test('database/table/indexes creation', (t) => {
  t.plan(1)

  dropDb()
    .then(() => {
      const M = requelize.model('foo')

      M.index('name')
      M.index('createdAt')

      return requelize.sync()
    })
    .then(() => requelize.sync())
    .then(() => {
      t.pass('database and model ready')
    })
    .catch((err) => {
      t.fail(err)
    })
    .then(() => {
      t.end()
    })
})
