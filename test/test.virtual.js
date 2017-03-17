const joi = require('joi')
const { test, requelize, dropDb } = require('./utils')

test('virtuals', (t) => {
  t.plan(1)

  let Foo
  let foo

  dropDb()
    .then(() => {
      Foo = requelize.model('foo', {
        firtname: joi.string(),
        lastname: joi.string()
      })

      Foo.virtual('fullname', inst => `${inst.firstname} ${inst.lastname}`)

      return requelize.sync()
    })
    .then(() => {
      foo = new Foo({
        firstname: 'John',
        lastname: 'Doe'
      })

      t.equal('John Doe', foo.fullname, 'has virtual getter')
    })
    .catch((err) => {
      t.fail(err)
    })
    .then(() => {
      t.end()
    })
})
