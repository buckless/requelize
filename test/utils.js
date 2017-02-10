const requelize = require('../')({ db: 'requelize_test' })
const { test } = require('tape')

function quitDb () {
  return requelize.r.getPoolMaster().drain()
}

test.onFinish(() => {
  quitDb()
})

module.exports.test = test
module.exports.requelize = requelize

module.exports.dropDb = () => {
  return requelize.r
    .dbDrop('requelize_test')
    .catch((err) => {
      if (err.message.match(/Database `.*` does not exist/)) {
        return Promise.resolve()
      }

      throw err
    })
}
