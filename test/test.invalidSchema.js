const Joi = require('joi')

const { test, requelize, dropDb } = require('./utils')

test('instance - invalid schema', (t) => {
  t.plan(2)

  const M = requelize.model('foo', {
    name: Joi.string(),
    createdAt: Joi.date()
  })

  M.index('name')
  M.index('createdAt')

  let inst

  dropDb()
    .then(() => requelize.sync())
    .then(() => {
      t.pass('database and model ready')

      inst = new M()

      inst.name = 2

      return inst.save()
    })
    .catch(err => {
      t.equal('ValidationError', err.name, 'joi validation error')
    })
    .then(() => {
      t.end()
    })
})
