// const Joi = require('joi')

const { test, requelize, dropDb } = require('./utils')

test('instance - pivot', (t) => {
  t.plan(3)

  let Foo
  let Bar
  let foo
  let bar

  dropDb()
    .then(() => {
      Foo = requelize.model('foo')

      Bar = requelize.model('bar')

      Foo.belongsToMany('bar', 'bars')
      Bar.belongsToMany('foo', 'foos')

      return requelize.sync()
    })
    .then(() => {
      foo = new Foo({ name: 'foo' })
      bar = new Bar({ name: 'bar' })

      foo.bars = [ bar ]

      bar.setPivot('foo', { data: 'pivot' })

      return foo.saveAll({
        bars: true
      })
    })
    .then(() => Foo.embed({ bars: true }))
    .then((res) => {
      t.ok(Array.isArray(res[0].bars), 'has bars')
      t.equal('object', typeof res[0].bars[0].getPivot('foo'), 'has pivot')
      t.equal('pivot', res[0].bars[0].getPivot('foo').data, 'has pivot data')
    })
    .catch((err) => {
      t.fail(err)
    })
    .then(() => {
      t.end()
    })
})

test('instance - pivot - embed', (t) => {
  t.plan(3)

  let Foo
  let Bar
  let Baz
  let foo
  let bar
  let baz

  dropDb()
    .then(() => {
      Foo = requelize.model('foo')

      Bar = requelize.model('bar')

      Baz = requelize.model('baz')

      Foo.belongsToMany('bar', 'bars')
      Bar.belongsToMany('foo', 'foos')

      Bar.hasOne('baz', 'baz', 'bar_id')
      Baz.belongsTo('bar', 'bar', 'bar_id')

      return requelize.sync()
    })
    .then(() => {
      foo = new Foo({})
      bar = new Bar({})
      baz = new Baz({})

      foo.bars = [ bar ]
      bar.baz = baz

      bar.setPivot('foo', { data: 'pivot' })

      return foo.saveAll({
        bars: {
          baz: true
        }
      })
    })
    .then(() => Foo.embed({ bars: { baz: true } }))
    .then((res) => {
      t.ok(Array.isArray(res[0].bars), 'has bars')
      t.equal('object', typeof res[0].bars[0].getPivot('foo'), 'has pivot')
      t.equal('pivot', res[0].bars[0].getPivot('foo').data, 'has pivot data')
    })
    .catch((err) => {
      t.fail(err)
    })
    .then(() => {
      t.end()
    })
})

test('instance - pivot - with multiple models', (t) => {
  t.plan(4)

  let Foo
  let Bar
  let Baz
  let foo
  let bar
  let baz

  dropDb()
    .then(() => {
      Foo = requelize.model('foo')

      Bar = requelize.model('bar')

      Baz = requelize.model('baz')

      Foo.belongsToMany('bar', 'bars')
      Bar.belongsToMany('foo', 'foos')

      Baz.belongsToMany('bar', 'bars')
      Bar.belongsToMany('baz', 'bazes')

      return requelize.sync()
    })
    .then(() => {
      foo = new Foo({})
      bar = new Bar({})
      baz = new Baz({})

      bar.foos = [ foo ]
      bar.bazes = [ baz ]

      foo.setPivot('bar', { data: 'pivot' })
      baz.setPivot('bar', { data: 'pivotForBaz' })

      return bar.saveAll({
        bazes: true,
        foos: true
      })
    })
    .then(() => Bar.embed({ bazes: true, foos: true }))
    .then((res) => {
      t.ok(Array.isArray(res[0].bazes), 'has bars')
      t.ok(Array.isArray(res[0].foos), 'has bars')
      t.equal('pivotForBaz', res[0].bazes[0].getPivot('bar').data)
      t.equal('pivot', res[0].foos[0].getPivot('bar').data)
    })
    .catch((err) => {
      t.fail(err)
    })
    .then(() => {
      t.end()
    })
})
