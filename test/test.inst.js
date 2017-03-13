const Joi = require('joi')

const { test, requelize, dropDb } = require('./utils')

test('instance - create and update', (t) => {
  t.plan(4)

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

      inst.name = 'foo'

      t.equal(inst.name, inst._data.name, 'props should be binded to data dictionnary')

      return inst.save()
    })
    .then((res) => {
      t.pass('created instance')

      t.ok(inst._data.id && inst._data.id.length > 0, 'model should have an id')

      inst.name = 'bar'

      return inst.save()
    })
    .then((res) => {
      t.equal(1, res.replaced, 'updated instance')
    })
    .catch((err) => {
      t.fail(err)
    })
    .then(() => {
      t.end()
    })
})
