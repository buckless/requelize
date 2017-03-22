const { test, requelize, dropDb } = require('./utils')

test('basic commands', (t) => {
  t.plan(6)

  let Foo

  dropDb()
    .then(() => {
      Foo = requelize.model('foo')

      return requelize.sync()
    })
    .then(() => {
      return Foo.get('foo').run()
    })
    .then((res) => {
      console.log(res)
    })
    .catch((err) => {
      console.log(err)
    })
})
