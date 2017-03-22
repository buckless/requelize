const Joi = require('joi')
const { test, requelize, dropDb } = require('./utils')

test('hooks - saving', (t) => {
  t.plan(3)

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

      Foo.on('saving', (inst) => {
        inst.updatedAt = new Date()
      })

      Foo.on('saving', () => {
        t.pass('multiple events on the same model')
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

test('hooks - saved', (t) => {
  t.plan(2)

  let Foo
  let inst

  dropDb()
    .then(() => {
      Foo = requelize.model('foo', {
        createdAt: Joi.date()
      })

      Foo.index('createdAt')

      Foo.on('saved', (inst) => {
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

test('hooks - validating', (t) => {
  t.plan(1)

  let Foo
  let inst

  dropDb()
    .then(() => {
      Foo = requelize.model('foo', {
        foo: Joi.equal(true)
      })

      Foo.on('validating', (inst) => {
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

test('hooks - validated', (t) => {
  t.plan(1)

  let Foo
  let inst

  dropDb()
    .then(() => {
      Foo = requelize.model('foo')

      Foo.on('validated', (inst) => {
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
