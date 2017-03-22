const { test, requelize, dropDb } = require('./utils')

test('document not found error', (t) => {
  t.plan(2)

  let Foo

  dropDb()
    .then(() => {
      Foo = requelize.model('foo')

      return requelize.sync()
    })
    .then(() => {
      return Foo.get('foo').run()
    })
    .catch((err) => {
      t.equal('RequelizeError', err.name)
      t.equal('DocumentNotFound', err.details)
      t.end()
    })
})
