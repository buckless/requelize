const { test, requelize, dropDb } = require('./utils')

test('Issue #26', (t) => {
  t.plan(1)

  const Foo = requelize.model('foo')

  try {
    let foo = new Foo(null)
    t.pass('object is created with null as initial data')
  } catch (err) {
    t.fail(err)
  }
})
