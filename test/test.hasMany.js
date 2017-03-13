const Joi = require('joi')
const { test, requelize, dropDb } = require('./utils')

test('relationships - hasMany', (t) => {
  t.plan(3)

  let Foo
  let Bar

  let foo
  let bar
  let bar2

  dropDb()
    .then(() => {
      Foo = requelize.model('foo', { name: Joi.string() })
      Bar = requelize.model('bar', { name: Joi.string() })

      Foo.hasMany('bar', 'bars', 'foo_id')
      Bar.belongsTo('foo', 'foo', 'foo_id')

      return requelize.sync()
    })
    .then(() => {
      foo = new Foo({ name: 'foo1' })

      return foo.save()
    })
    .then(() => {
      bar = new Bar({ name: 'bar1', foo_id: foo.id })
      bar2 = new Bar({ name: 'bar2', foo_id: foo.id })

      return Promise.all([ bar.save(), bar2.save() ])
    })
    .then(() => {
      return Foo.get(foo.id).embed({ bars: true })
    })
    .then((res) => {
      t.ok(res && res.bars, 'embedded models')

      res.bars = res.bars.sort((a, b) => a.name.localeCompare(b.name))

      t.equal(res.bars[0].id, bar.id, 'relation A - B')
      t.equal(res.bars[1].id, bar2.id, 'relation A - B')
    })
    .catch((err) => {
      t.fail(err)
    })
    .then(() => {
      t.end()
    })
})

test('relationships - hasMany - nesting', (t) => {
  t.plan(4)

  let Foo
  let Bar
  let Baz

  let foo
  let bar
  let baz
  let baz2

  dropDb()
    .then(() => {
      Foo = requelize.model('foo', { name: Joi.string() })
      Bar = requelize.model('bar', { name: Joi.string() })
      Baz = requelize.model('baz', { name: Joi.string() })

      Foo.hasOne('bar', 'bar', 'foo_id')
      Bar.belongsTo('foo', 'foo', 'foo_id')
      Bar.hasMany('baz', 'bazes', 'bar_id')
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
      baz2 = new Baz({ name: 'baz2', bar_id: bar.id })

      return Promise.all([ baz.save(), baz2.save() ])
    })
    .then(() => {
      foo.bar_id = bar.id

      return foo.save()
    })
    .then(() => {
      return Foo.embed({
        bar: { bazes: true }
      })
    })
    .then((res) => {
      t.ok(res[0] && res[0].bar && res[0].bar.bazes, 'embedded models')
      t.equal(res[0].bar.id, bar.id, 'relation A-B')

      res[0].bar.bazes = res[0].bar.bazes.sort((a, b) => a.name.localeCompare(b.name))

      t.equal(res[0].bar.bazes[0].id, baz.id, 'relation B-C')
      t.equal(res[0].bar.bazes[1].id, baz2.id, 'relation B-C')
    })
    .catch((err) => {
      t.fail(err)
    })
    .then(() => {
      t.end()
    })
})

test('relationships - hasMany - nesting 2', (t) => {
  t.plan(7)

  let Foo
  let Bar
  let Baz

  let foo
  let bar
  let bar2
  let baz

  dropDb()
    .then(() => {
      Foo = requelize.model('foo', { name: Joi.string() })
      Bar = requelize.model('bar', { name: Joi.string() })
      Baz = requelize.model('baz', { name: Joi.string() })

      Foo.hasMany('bar', 'bars', 'foo_id')
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
      bar2 = new Bar({ name: 'bar2', foo_id: foo.id })

      return Promise.all([ bar.save(), bar2.save() ])
    })
    .then(() => {
      baz = new Baz({ name: 'baz1', bar_id: bar.id })

      return baz.save()
    })
    .then(() => {
      return Foo.embed({
        bars: { baz: true }
      })
    })
    .then((res) => {
      t.ok(res[0] && res[0].bars && res[0].bars[0] && (res[0].bars[0].baz || res[0].bars[1].baz), 'embedded models')

      res[0].bars = res[0].bars.sort((a, b) => a.name.localeCompare(b.name))
      t.equal(res[0].bars[0].id, bar.id, 'relation A - B')
      t.equal(res[0].bars[1].id, bar2.id, 'relation A - B')

      t.equal(res[0].bars[0].id, bar.id, 'relation B - C')

      return Baz.embed({
        bar: { foo: true }
      })
    })
    .then((res) => {
      t.ok(res[0] && res[0].bar && res[0].bar.foo, 'embedded models')
      t.equal(res[0].bar.id, bar.id, 'relation C - B')
      t.equal(res[0].bar.foo.id, foo.id, 'relation B - A')
    })
    .catch((err) => {
      t.fail(err)
    })
    .then(() => {
      t.end()
    })
})

