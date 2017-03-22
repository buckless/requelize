const Joi = require('joi')
const { test, requelize, dropDb } = require('./utils')

test('instance - invalid schema', (t) => {
  t.plan(1)

  let Foo
  let inst

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
      inst = new Foo()

      inst.name = 2

      return inst.save()
    })
    .catch((err) => {
      t.equal('RequelizeError', err.name, 'joi validation error')
    })
    .then(() => {
      t.end()
    })
})
