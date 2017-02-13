const { test, requelize, dropDb } = require('./utils')

test('basic commands', (t) => {
  t.plan(3)

  let Foo

  dropDb()
    .then(() => {
      Foo = requelize.model('foo')

      Foo.index('name')
      Foo.index('createdAt')

      return requelize.sync()
    })
    .then(() => {
      t.pass('database and model ready')

      return Foo.getAll()
    })
    .then((res) => {
      t.ok(Array.isArray(res) && res.length === 0, 'getAll / empty table')
      return Foo.run()
    })
    .then((res) => {
      t.ok(Array.isArray(res) && res.length === 0, 'run / empty table')
    })
    .catch((err) => {
      t.fail(err)
    })
    .then(() => {
      t.end()
    })
})
