const Joi = require('joi')

const { test, requelize, dropDb } = require('./utils')

test('instance - parse result', (t) => {
  t.plan(3)

  let Foo
  let Bar

  let foo
  let bar

  dropDb()
    .then(() => {
      Foo = requelize.model('foo', { name: Joi.string() })
      Bar = requelize.model('bar', { name: Joi.string() })

      Foo.index('name')
      Bar.index('name')

      Foo.hasOne('bar', 'bar', 'foo_id')
      Bar.belongsTo('foo', 'foo', 'foo_id')

      return requelize.sync()
    })
    .then(() => {
      foo = new Foo({ name: 'foo' })

      return foo.save()
    })
    .then(() => {
      bar = new Bar({ name: 'bar', foo_id: foo.id })

      return bar.save()
    })
    .then(() => {
      return Foo.embed({
        bar: true
      })
    })
    .then((res) => {
      t.ok(res[0] instanceof Foo, 'instanceof Foo')
      t.ok(res[0].bar instanceof Bar, 'instanceof Bar')

      return Foo.parse(false).run()
    })
    .then((res) => {
      t.notOk(res[0] instanceof Foo, 'not instanceof Foo')
    })
    .catch((err) => {
      t.fail(err)
    })
    .then(() => {
      t.end()
    })
})

test('no parsing', (t) => {
  t.plan(1)

  let Foo

  dropDb()
    .then(() => {
      Foo = requelize.model('foo', { name: Joi.string() })

      return requelize.sync()
    })
    .then(() => {
      let fooA = new Foo({ name: 'bar' })
      let fooB = new Foo({ name: 'baz' })

      return Promise.all([ fooA.save(), fooB.save() ])
    })
    .then(() => {
      return Foo
          .parse(false)
          .map((user) => 1)
          .reduce((a, b) => a.add(b))
          .run()
          .then((res) => {
            t.equal(2, res)
          })
    })
    .catch((err) => {
      t.fail(err)
    })
    .then(() => {
      t.end()
    })
})
