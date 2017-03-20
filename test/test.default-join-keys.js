const Joi = require('joi')
const { test, requelize, dropDb } = require('./utils')

test('relationships - belongsTo', (t) => {
  t.plan(2)

  let Foo
  let Bar

  let foo
  let bar

  dropDb()
    .then(() => {
      Foo = requelize.model('foo', { name: Joi.string() })
      Bar = requelize.model('bar', { name: Joi.string() })

      Foo.hasOne('bar', 'bar')
      Bar.belongsTo('foo', 'foo')

      return requelize.sync()
    })
    .then(() => {
      foo = new Foo({ name: 'foo1' })

      return foo.save()
    })
    .then(() => {
      bar = new Bar({ name: 'bar1', foo_id: foo.id })

      return bar.save()
    })
    .then(() => {
      foo.bar_id = bar.id

      return foo.save()
    })
    .then(() => {
      return Bar.get(bar.id).embed({ foo: true })
    })
    .then((res) => {
      t.ok(res && res.foo, 'embedded model')
      t.equal(res.foo.id, foo.id, 'relation B-A')
    })
    .catch((err) => {
      t.fail(err)
    })
    .then(() => {
      t.end()
    })
})
