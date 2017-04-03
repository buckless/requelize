const { test, requelize, dropDb } = require('./utils')

test('isSaved', (t) => {
  t.plan(2)

  let Foo
  let foo

  dropDb()
    .then(() => {
      Foo = requelize.model('foo')

      return requelize.sync()
    })
    .then(() => {
      foo = new Foo()

      t.equal(false, foo.isSaved(), 'isSaved = false before saving')

      return foo.save()
    })
    .then(() => {
      t.equal(true, foo.isSaved(), 'isSaved = true after saving')
    })
    .catch((err) => {
      t.fail(err)
    })
    .then(() => {
      t.end()
    })
})
