const { test, requelize, dropDb } = require('./utils')

test('basic commands', (t) => {
  t.plan(2)

  const M = requelize.model('foo')

  M.index('name')
  M.index('createdAt')

  dropDb()
    .then(() => requelize.sync())
    .then(() => {
      t.pass('database and model ready')

      return M.getAll()
    })
    .then((res) => {
      t.ok(Array.isArray(res) && res.length === 0, 'empty table')
    })
    .catch(err => {
      t.fail(err)
    })
    .then(() => {
      t.end()
    })
})
