/**
 * Bind rethinkdbdash methods to a Model
 * @param {Requelize} requelize requelize instance
 * @param {Class}     Model     Model class
 * @param {Class}     Query     Query class
 */
function bindRql (requelize, Model, Query) {
  // List all rethinkdb commands
  const Term = Object.getPrototypeOf(requelize.r.expr(1))

  for (let key of Object.keys(Term)) {
    if (key === 'constructor' || key === 'run' || key[0] === '_') {
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
}

module.exports = bindRql
