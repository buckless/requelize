const Joi = require('joi')
const { test, requelize, dropDb } = require('./utils')

test('Issue #28 - custom primary key type instead of guid', (t) => {
  t.plan(3)

  let Foo
  let foo

  dropDb()
    .then(() => {
      Foo = requelize.model('foo', { name: Joi.string() })

      return requelize.sync()
    })
    .then(() => {
      foo = new Foo({ id: 1, name: 'bar' })

      return foo.save()
    })
    .then(() => {
      return Foo.run()
    })
    .then((foos) => {
      t.equal(1, foos.length, 'found model')
      t.equal(1, foos[0].id, 'id is still the same')

      return Foo.get(1)
    })
    .then((foo) => {
      t.equal(1, foo.id, 'can query by id')
    })
    .catch((err) => {
      t.fail(err)
    })
    .then(() => {
      t.end()
    })
})
