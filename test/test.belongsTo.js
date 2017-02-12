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
      Foo.index('name')

      Bar = requelize.model('bar', { name: Joi.string() })
      Bar.index('name')

      Foo.hasOne('bar', 'bar', 'foo_id')
      Bar.belongsTo('foo', 'foo', 'foo_id')

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
    .catch(err => {
      t.fail(err)
    })
    .then(() => {
      t.end()
    })
})

test('relationships - belongsTo - nesting', (t) => {
  t.plan(3)

  let Foo
  let Bar
  let Baz

  let foo
  let bar
  let baz

  dropDb()
    .then(() => {
      Foo = requelize.model('foo', { name: Joi.string() })
      Foo.index('name')

      Bar = requelize.model('bar', { name: Joi.string() })
      Bar.index('name')

      Baz = requelize.model('baz', { name: Joi.string() })

      Foo.hasOne('bar', 'bar', 'foo_id')
      Bar.belongsTo('foo', 'foo', 'foo_id')
      Bar.hasOne('baz', 'baz', 'bar_id')
      Baz.belongsTo('bar', 'bar', 'bar_id')

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
      baz = new Baz({ name: 'baz1', bar_id: bar.id })

      return baz.save()
    })
    .then(() => {
      foo.bar_id = bar.id
      bar.baz_id = baz.id

      return Promise.all([ foo.save(), bar.save() ])
    })
    .then(() => {
      return Baz.embed({
        bar: { foo: true }
      })
    })
    .then((res) => {
      t.ok(res[0] && res[0].bar && res[0].bar.foo, 'embedded models')
      t.equal(res[0].bar.id, bar.id, 'relation C - B')
      t.equal(res[0].bar.foo.id, foo.id, 'relation B - A')
    })
    .catch(err => {
      t.fail(err)
    })
    .then(() => {
      t.end()
    })
})
