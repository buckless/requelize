const Joi = require('joi')
const { test, requelize, dropDb } = require('./utils')

test('deletion', (t) => {
  t.plan(2)

  let Foo
  let foo

  dropDb()
    .then(() => {
      Foo = requelize.model('foo', {
        name: Joi.string()
      })

      return requelize.sync()
    })
    .then(() => {
      foo = new Foo({ name: 'bar' })

      return foo.save()
    })
    .then(() => {
      return foo.delete()
    })
    .then(() => {
      t.equal(null, foo.id, 'deleted document')

      return Foo.run()
    })
    .then((res) => {
      t.equal(0, res.length, 'ensure deleted documents')
    })
    .catch((err) => {
      t.fail(err)
    })
    .then(() => {
      t.end()
    })
})

test('deletion - inexistant document', (t) => {
  t.plan(1)

  let Foo
  let foo

  dropDb()
    .then(() => {
      Foo = requelize.model('foo', {
        name: Joi.string()
      })

      return requelize.sync()
    })
    .then(() => {
      foo = new Foo({ name: 'bar' })

      return foo.delete()
    })
    .then(() => {
      t.ok(!foo.id, 'deleted document')
    })
    .catch((err) => {
      t.fail(err)
    })
    .then(() => {
      t.end()
    })
})
