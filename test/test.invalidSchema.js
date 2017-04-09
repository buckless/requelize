const Joi = require('joi')
const { test, requelize, dropDb } = require('./utils')

test('instance - default values', (t) => {
  t.plan(1)

  let Foo
  let foo

  dropDb()
    .then(() => {
      Foo = requelize.model('foo', {
        name: Joi.string().default('bar')
      })

      return requelize.sync()
    })
    .then(() => {
      foo = new Foo()

      return foo.save()
    })
    .then((res) => {
      t.equal('bar', res.name, 'default value')
    })
    .catch((err) => {
      t.fail(err)
    })
    .then(() => {
      t.end()
    })
})

test('instance - invalid schema', (t) => {
  t.plan(1)

  let Foo
  let foo

  dropDb()
    .then(() => {
      Foo = requelize.model('foo', {
        name: Joi.string(),
        createdAt: Joi.date()
      })

      Foo.index('name')
      Foo.index('createdAt')

      return requelize.sync()
    })
    .then(() => {
      foo = new Foo()

      foo.name = 2

      return foo.save()
    })
    .catch((err) => {
      t.equal('RequelizeError', err.name, 'joi validation error')
    })
    .then(() => {
      t.end()
    })
})
