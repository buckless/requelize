const Joi = require('joi')
const { test, requelize, dropDb } = require('./utils')

test('relationships - belongsToMany', (t) => {
  t.plan(2)

  let Foo
  let Bar
  let BarFoo

  let foo
  let foo2
  let bar
  let bar2

  dropDb()
    .then(() => requelize.sync())
    .then(() => {
      Foo = requelize.model('foo', { name: Joi.string() })
      Bar = requelize.model('bar', { name: Joi.string() })
      BarFoo = requelize.model('bar_foo', { foo: Joi.string(), bar: Joi.string() })
      BarFoo.index('foo')
      BarFoo.index('bar')

      Foo.belongsToMany('bar', 'bars', 'bar_foo')
      Bar.belongsToMany('foo', 'foos', 'bar_foo')

      return requelize.sync()
    })
    .then(() => {
      foo = new Foo({ name: 'foo1' })
      foo2 = new Foo({ name: 'foo2' })
      bar = new Bar({ name: 'bar1' })
      bar2 = new Bar({ name: 'bar2' })

      return Promise.all([
        foo.save(),
        foo2.save(),
        bar.save(),
        bar2.save()
      ])
    })
    .then(() => {
      return requelize.r.table('bar_foo').insert([
        { foo: foo.id, bar: bar.id },
        { foo: foo.id, bar: bar2.id },
        { foo: foo2.id, bar: bar.id },
        { foo: foo2.id, bar: bar2.id }
      ])
    })
    .then(() => {
      return Foo.embed({
        bars: true
      })
    })
    .then((res) => {
      t.ok(res[0] && res[0].bars && res[0].bars[0], 'embedded models')

      res[0].bars = res[0].bars.sort((a, b) => a.name.localeCompare(b.name))

      t.equal(bar.id, res[0].bars[0].id, 'A - B')
    })
    .catch((err) => {
      t.fail(err)
    })
    .then(() => {
      t.end()
    })
})

test('relationships - belongsToMany - nesting', (t) => {
  t.plan(3)

  let Foo
  let Bar
  let BarFoo
  let Baz

  let foo
  let foo2
  let bar
  let bar2
  let baz

  dropDb()
    .then(() => requelize.sync())
    .then(() => {
      Foo = requelize.model('foo', { name: Joi.string() })
      Bar = requelize.model('bar', { name: Joi.string() })
      BarFoo = requelize.model('bar_foo', { foo: Joi.string(), bar: Joi.string() })
      Baz = requelize.model('baz', { name: Joi.string() })
      BarFoo.index('foo')
      BarFoo.index('bar')

      Foo.belongsToMany('bar', 'bars', 'bar_foo')
      Bar.belongsToMany('foo', 'foos', 'bar_foo')
      Bar.hasOne('baz', 'baz', 'bar_id')
      Baz.belongsTo('bar', 'bar', 'bar_id')

      return requelize.sync()
    })
    .then(() => {
      foo = new Foo({ name: 'foo' })
      foo2 = new Foo({ name: 'foo2' })
      bar = new Bar({ name: 'bar' })
      bar2 = new Bar({ name: 'bar2' })

      return Promise.all([
        foo.save(),
        foo2.save(),
        bar.save(),
        bar2.save()
      ])
    })
    .then(() => {
      baz = new Baz({ name: 'baz', bar_id: bar.id })

      return baz.save()
    })
    .then(() => {
      return requelize.r.table('bar_foo').insert([
        { foo: foo.id, bar: bar.id },
        { foo: foo.id, bar: bar2.id },
        { foo: foo2.id, bar: bar.id },
        { foo: foo2.id, bar: bar2.id }
      ])
    })
    .then(() => {
      return Foo.embed({
        bars: {
          baz: true
        }
      })
    })
    .then((res) => {
      t.ok(res[0] && res[0].bars && res[0].bars[0] && (res[0].bars[0].baz || res[0].bars[1].baz), 'embedded models')

      res[0].bars = res[0].bars.sort((a, b) => a.name.localeCompare(b.name))

      t.equal(bar.id, res[0].bars[0].id, 'A - B')
      t.equal(baz.id, res[0].bars[0].baz.id, 'B - C')
    })
    .catch((err) => {
      t.fail(err)
    })
    .then(() => {
      t.end()
    })
})

test('relationships - belongsToMany - pivot', (t) => {
  t.plan(3)

  let Foo
  let Bar

  let foo
  let foo2
  let bar
  let bar2

  dropDb()
    .then(() => requelize.sync())
    .then(() => {
      Foo = requelize.model('foo', { name: Joi.string() })
      Bar = requelize.model('bar', { name: Joi.string() })

      Foo.belongsToMany('bar', 'bars')
      Bar.belongsToMany('foo', 'foos')

      return requelize.sync()
    })
    .then(() => {
      foo = new Foo({ name: 'foo' })
      foo2 = new Foo({ name: 'foo2' })
      bar = new Bar({ name: 'bar' })
      bar2 = new Bar({ name: 'bar2' })

      return Promise.all([
        foo.save(),
        foo2.save(),
        bar.save(),
        bar2.save()
      ])
    })
    .then(() => {
      return requelize.r.table('bar_foo').insert([
        { foo: foo.id, bar: bar.id, pivot: { john: 'doe' } },
        { foo: foo.id, bar: bar2.id, pivot: { john: 'doe' } },
        { foo: foo2.id, bar: bar.id, pivot: { john: 'doe' } },
        { foo: foo2.id, bar: bar2.id, pivot: { john: 'doe' } }
      ])
    })
    .then(() => {
      return Foo.embed({
        bars: true
      })
    })
    .then((res) => {
      t.ok(res[0] && res[0].bars && res[0].bars[0], 'embedded models')

      res[0].bars = res[0].bars.sort((a, b) => a.name.localeCompare(b.name))

      t.equal(bar.id, res[0].bars[0].id, 'A - B')
      t.deepEqual({ john: 'doe' }, res[0].bars[0]._pivot.foo, 'embedded pivot')
    })
    .catch((err) => {
      t.fail(err)
    })
    .then(() => {
      t.end()
    })
})
