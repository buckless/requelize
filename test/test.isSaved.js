const { test, requelize, dropDb } = require('./utils')

test('isSaved', (t) => {
  t.plan(4)

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

      return Foo.run()
    })
    .then((foos) => {
      t.equal(true, foos[0].isSaved(), 'isSaved = true on query')

      const newInst = new Foo({ id: 'bar' })
      t.equal(false, newInst.isSaved(), 'isSaved = false when creating an instance with primaryKey set')
    })
    .catch((err) => {
      t.fail(err)
    })
    .then(() => {
      t.end()
    })
})
