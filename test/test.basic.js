const { test, requelize, dropDb } = require('./utils')

test('basic commands', (t) => {
  t.plan(6)

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
      return Foo.catch(err => err)
    })
    .then((res) => {
      t.ok(Array.isArray(res) && res.length === 0, 'catch / empty table')
      return Foo.embed()
    })
    .then((res) => {
      t.ok(Array.isArray(res) && res.length === 0, 'embed without arg / empty table')
      return Foo.getAll().filter(() => true)
    })
    .then((res) => {
      t.ok(Array.isArray(res) && res.length === 0, 'embed without arg / empty table')
    })
    .catch((err) => {
      t.fail(err)
    })
    .then(() => {
      t.end()
    })
})
