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
    .catch((err) => {
      t.equal('Missing relationship foo.baz', err.message)

      return Foo.getAll().embed({ john: true })
    })
    .catch((err) => {
      t.equal('Missing model john in relationship foo.john', err.message)

      return Promise.resolve()
    })
    .then(() => {
      t.end()
    })
})
