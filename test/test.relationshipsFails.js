const { test, requelize, dropDb } = require('./utils')

test('relationships - failures', (t) => {
  t.plan(3)

  let Foo

  dropDb()
    .then(() => {
      Foo = requelize.model('foo')

      Foo.index('name')
      Foo.index('createdAt')
      Foo.hasOne('john', 'john', 'john_id')

      return requelize.sync()
    })
    .then(() => {
      return Foo.getAll().embed({ baz: false })
    })
    .then((res) => {
      t.equal(0, res.length, 'falsy tree')

      return Foo.getAll().embed({ baz: true })
    })
    .then((res) => {
      t.equal(0, res.length, 'unknown join')

      return Foo.getAll().embed({ john: true })
    })
    .then((res) => {
      t.equal(0, res.length, 'unknown model')
    })
    .catch(err => {
      t.fail(err)
    })
    .then(() => {
      t.end()
    })
})
