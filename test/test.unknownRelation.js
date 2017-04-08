const Joi = require('joi')
const { test, requelize, dropDb } = require('./utils')

test('unknown relation - hasOne', (t) => {
  t.plan(1)

  let Foo
  let Bar
  let foo

  dropDb()
    .then(() => {
      Foo = requelize.model('foo', {
        name: Joi.string()
      })

      Bar = requelize.model('bar')

      Foo.hasOne('bar', 'bar')
      Bar.belongsTo('foo', 'foo')

      return requelize.sync()
    })
    .then(() => {
      foo = new Foo({ name: 'foo' })

      return foo.save()
    })
    .then((res) => {
      return Foo.embed({ bar: true })
    })
    .then((res) => {
      t.equal(null, res[0].bar, 'hasOne relation is null when not found')
    })
    .catch((err) => {
      t.fail(err)
    })
    .then(() => {
      t.end()
    })
})

test('unknown relation - belongsTo', (t) => {
  t.plan(1)

  let Foo
  let Bar
  let bar

  dropDb()
    .then(() => {
      Foo = requelize.model('foo', {
        name: Joi.string()
      })

      Bar = requelize.model('bar')

      Foo.hasOne('bar', 'bar')
      Bar.belongsTo('foo', 'foo')

      return requelize.sync()
    })
    .then(() => {
      bar = new Bar({ name: 'bar' })

      return bar.save()
    })
    .then((res) => {
      return Bar.embed({ foo: true })
    })
    .then((res) => {
      t.equal(null, res[0].foo, 'belongsTo relation is null when not found')
    })
    .catch((err) => {
      t.fail(err)
    })
    .then(() => {
      t.end()
    })
})

test('unknown relation - hasMany', (t) => {
  t.plan(1)

  let Foo
  let Bar
  let foo

  dropDb()
    .then(() => {
      Foo = requelize.model('foo', {
        name: Joi.string()
      })

      Bar = requelize.model('bar')

      Foo.hasMany('bar', 'bars')
      Bar.belongsTo('foo', 'foo')

      return requelize.sync()
    })
    .then(() => {
      foo = new Foo({ name: 'foo' })

      return foo.save()
    })
    .then((res) => {
      return Foo.embed({ bars: true })
    })
    .then((res) => {
      t.equal(0, res[0].bars.length, 'hasMany relation is empty array when not found')
    })
    .catch((err) => {
      t.fail(err)
    })
    .then(() => {
      t.end()
    })
})

test('unknown relation - belongsToMany', (t) => {
  t.plan(1)

  let Foo
  let Bar
  let foo

  dropDb()
    .then(() => {
      Foo = requelize.model('foo', {
        name: Joi.string()
      })

      Bar = requelize.model('bar')

      Foo.belongsToMany('bar', 'bars')
      Bar.belongsToMany('foo', 'foo')

      return requelize.sync()
    })
    .then(() => {
      foo = new Foo({ name: 'foo' })

      return foo.save()
    })
    .then((res) => {
      return Foo.embed({ bars: true })
    })
    .then((res) => {
      t.equal(0, res[0].bars.length, 'hasMany relation is empty array when not found')
    })
    .catch((err) => {
      t.fail(err)
    })
    .then(() => {
      t.end()
    })
})
