const Joi = require('joi')
const { test, requelize, dropDb } = require('./utils')

test('changefeeds', (t) => {
  t.plan(8)

  let Foo
  let foo

  dropDb()
    .then(() => {
      Foo = requelize.model('foo', {
        name: Joi.string()
      })

      return requelize.sync()
    })
    .then(() => {
      let feed = Foo.feed()

      feed
        .filter(change => change.type === 'create')
        .subscribe((change) => {
          t.equal('create', change.type, 'subscribe to create')
          t.equal('bar', change.to.name, 'created document')
        })

      feed
        .filter(change => change.type === 'update')
        .subscribe((change) => {
          t.equal('update', change.type, 'subscribe to update')
          t.equal('bar', change.from.name, 'updated document - from')
          t.equal('baz', change.to.name, 'updated document - to')
        })

      feed
        .filter(change => change.type === 'delete')
        .subscribe((change) => {
          t.equal('delete', change.type, 'subscribe to delete')
          t.equal('baz', change.from.name, 'deleted document')
        })

      setTimeout(() => {
        foo = new Foo({ name: 'bar' })
        foo.save()
      }, 100)

      setTimeout(() => {
        foo.name = 'baz'
        foo.save()
      }, 750)

      setTimeout(() => {
        foo.delete()
      }, 1000)

      setTimeout(() => {
        feed.close()
        t.pass('unsubscribed from changes')
        t.end()
      }, 2000)
    })
    .catch((err) => {
      t.fail(err)
    })
})

test('original changefeeds', (t) => {
  t.plan(1)

  let Foo

  dropDb()
    .then(() => {
      Foo = requelize.model('foo', {
        name: Joi.string()
      })

      return requelize.sync()
    })
    .then(() => {
      Foo.changes((_, cursor) => {
        t.equal('function', typeof cursor.each)
        t.end()
      })
    })
    .catch((err) => {
      t.fail(err)
    })
})
