const Joi = require('joi')

const { test, requelize, dropDb } = require('./utils')

test('hooks - preSave', (t) => {
  t.plan(2)

  let Foo
  let inst

  dropDb()
    .then(() => {
      Foo = requelize.model('foo', {
        createdAt: Joi.date(),
        updatedAt: Joi.date()
      })

      Foo.index('createdAt')
      Foo.index('updatedAt')

      Foo.on('preSave', (inst) => {
        inst.updatedAt = new Date()
      })

      return requelize.sync()
    })
    .then(() => {
      inst = new Foo()

      inst.createdAt = new Date()

      return inst.save()
    })
    .then((res) => {
      t.equal('object', typeof res._data.createdAt, 'model should have createdAt')
      t.equal('object', typeof res._data.updatedAt, 'model should have updatedAt')
    })
    .catch((err) => {
      t.fail(err)
    })
    .then(() => {
      t.end()
    })
})

test('hooks - postSave', (t) => {
  t.plan(2)

  let Foo
  let inst

  dropDb()
    .then(() => {
      Foo = requelize.model('foo', {
        createdAt: Joi.date()
      })

      Foo.index('createdAt')

      Foo.on('postSave', (inst) => {
        inst.saved = true
      })

      return requelize.sync()
    })
    .then(() => {
      inst = new Foo()

      inst.createdAt = new Date()

      return inst.save()
    })
    .then((res) => {
      t.equal('object', typeof res._data.createdAt, 'model should have createdAt')
      t.equal(true, res.saved, 'model should have saved')
    })
    .catch((err) => {
      t.fail(err)
    })
    .then(() => {
      t.end()
    })
})

test('hooks - preValidate', (t) => {
  t.plan(1)

  let Foo
  let inst

  dropDb()
    .then(() => {
      Foo = requelize.model('foo', {
        foo: Joi.equal(true)
      })

      Foo.on('preValidate', (inst) => {
        inst.foo = true
      })

      return requelize.sync()
    })
    .then(() => {
      inst = new Foo()

      return inst.save()
    })
    .then((res) => {
      t.equal(true, res.foo, 'model should have foo')
    })
    .catch((err) => {
      t.fail(err)
    })
    .then(() => {
      t.end()
    })
})

test('hooks - postValidate', (t) => {
  t.plan(1)

  let Foo
  let inst

  dropDb()
    .then(() => {
      Foo = requelize.model('foo')

      Foo.on('postValidate', (inst) => {
        inst.foo = true
      })

      return requelize.sync()
    })
    .then(() => {
      inst = new Foo()

      return inst.save()
    })
    .then((res) => {
      t.equal(true, res.foo, 'model should have foo')
    })
    .catch((err) => {
      t.fail(err)
    })
    .then(() => {
      t.end()
    })
})
