const Joi = require('joi')

const { test, requelize, dropDb } = require('./utils')

test('instance - saveAll', (t) => {
  t.plan(10)

  let John
  let Foo
  let Bar
  let Baz
  let Boz
  let john
  let foo
  let bar
  let baz
  let boz

  dropDb()
    .then(() => {
      John = requelize.model('john', {
        name: Joi.string()
      })

      Foo = requelize.model('foo', {
        name: Joi.string()
      })

      Bar = requelize.model('bar', {
        name: Joi.string()
      })

      Baz = requelize.model('baz', {
        name: Joi.string()
      })

      Boz = requelize.model('boz', {
        name: Joi.string()
      })

      John.hasOne('foo', 'foo', 'john_id')
      Foo.belongsTo('john', 'john', 'john_id')

      Foo.hasOne('bar', 'bar', 'foo_id')
      Bar.belongsTo('foo', 'foo', 'foo_id')

      Foo.hasMany('baz', 'bazes', 'foo_id')
      Baz.belongsTo('foo', 'foo', 'foo_id')

      Foo.belongsToMany('boz', 'bozes')
      Boz.belongsToMany('foo', 'foos')

      return requelize.sync()
    })
    .then(() => {
      john = new John({ name: 'john' })
      foo = new Foo({ name: 'foo' })
      bar = new Bar({ name: 'bar' })
      baz = new Baz({ name: 'baz' })
      boz = new Boz({ name: 'boz' })

      foo.john = john
      foo.bar = bar
      foo.bazes = [ baz ]
      foo.bozes = [ boz ]

      return foo.saveAll({
        john: true,
        bar: true,
        bazes: true,
        bozes: true
      })
    })
    .then(() => {
      t.equal('string', typeof john.id, 'john is saved')
      t.equal('string', typeof foo.id, 'foo is saved')
      t.equal('string', typeof bar.id, 'bar is saved')
      t.equal('string', typeof baz.id, 'baz is saved')
      t.equal('string', typeof boz.id, 'boz is saved')
      t.equal(john.id, foo.john_id, 'belongsTo relationship')
      t.equal(foo.id, bar.foo_id, 'hasOne relationship')
      t.equal(foo.id, baz.foo_id, 'hasMany relationship')

      return Foo.embed({ bozes: true })
    })
    .then((res) => {
      t.equal(true, Array.isArray(res[0].bozes), 'belongsToMany relationship')
      t.equal(1, res[0].bozes.length, 'belongsToMany relationship')
    })
    .catch((err) => {
      t.fail(err)
    })
    .then(() => {
      t.end()
    })
})
