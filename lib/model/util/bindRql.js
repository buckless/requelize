/**
 * Bind rethinkdbdash methods to a Model
 * @param {Requelize} requelize requelize instance
 * @param {Class}     Model     Model class
 * @param {Class}     Query     Query class
 */
function bindRql (requelize, Model, Query) {
  // List all rethinkdb commands
  const Term = Object.getPrototypeOf(requelize.r.expr(1))

  const DISABLED = ['constructor', 'run', 'then', 'catch']

  for (let key of Object.keys(Term)) {
    if (DISABLED.indexOf(key) > -1 || key[0] === '_') {
      continue
    }

    (function (key) {
      Query.prototype[key] = function (...args) {
        return new Query(this._query[key](...args), Model, requelize)
      }

      Model[key] = function (...args) {
        return new Query(requelize.r.table(Model._name)[key](...args), Model, requelize)
      }
    }(key))
  }

  const COPYSTATIC = ['run', 'embed', 'parse', 'then', 'catch', 'feed']

  for (let staticMethod of COPYSTATIC) {
    Model[staticMethod] = function (...args) {
      return new Query(requelize.r.table(Model._name), Model, requelize)[staticMethod](...args)
    }
  }
}

module.exports = bindRql
