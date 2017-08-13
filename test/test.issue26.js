const { test, requelize } = require('./utils')

test('Issue #26 - instantiate Model with null as initial data', (t) => {
  t.plan(1)

  const Foo = requelize.model('foo')

  try {
    let foo = new Foo(null)

    t.equal(true, foo.hasOwnProperty('id'), 'instance is created with null as initialData')
  } catch (err) {
    t.fail(err)
  }
})
