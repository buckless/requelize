const debug = require('debug')('model:util')

/**
 * Bind rethinkdbdash methods to a Model
 * @internal
 * @param {Requelize} requelize requelize instance
 * @param {Class}     Model     Model class
 * @param {Class}     Query     Query class
 */
function bindRql (requelize, Model, Query) {
  // List all rethinkdb commands
  const Term = Object.getPrototypeOf(requelize.r.expr(1))

  // Theses are the functions that we do not want to copy from Term to Query and Model
  const DISABLED = ['constructor', 'run', 'then', 'catch', 'changes']

  for (let key of Object.keys(Term)) {
    if (DISABLED.indexOf(key) > -1 || key[0] === '_') {
      continue
    }

    (function (key) {
      Query.prototype[key] = function (...args) {
        return new Query(this._query[key](...args), this._Model, requelize, this._parse)
      }

      Model[key] = function (...args) {
        return new Query(requelize.r.table(Model._name)[key](...args), Model, requelize)
      }
    }(key))
  }

  debug('bound Term methods to Query and Model')

  // Theses are the functions that we want to copy from Query to Model
  const COPYSTATIC = ['run', 'embed', 'parse', 'then', 'catch', 'feed', 'changes']

  for (let staticMethod of COPYSTATIC) {
    Model[staticMethod] = function (...args) {
      return new Query(requelize.r.table(Model._name), Model, requelize)[staticMethod](...args)
    }
  }

  debug('bound Query statis methods to Model')
}

module.exports = bindRql
