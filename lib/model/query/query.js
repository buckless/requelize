const hasOne = require('./hasOne')
const belongsTo = require('./belongsTo')
const hasMany = require('./hasMany')
const belongsToMany = require('./belongsToMany')

const relations = { hasOne, belongsTo, hasMany, belongsToMany }

class Query {
  constructor (query, Model, requelize) {
    this._query = query
    this._Model = Model
    this._requelize = requelize
    this._parse = true
  }

  parse (newValue) {
    this._parse = newValue

    return this
  }

  run () {
    let q = this._query.run()

    if (this._parse) {
      q = q.then((res) => this._Model._parse(res))
    }

    return q
  }

  then (success, error) {
    return this.run().then(success, error)
  }

  catch (error) {
    return this.then(null, error)
  }

  embed (tree) {
    if (!tree) {
      return this
    }

    const mapper = {}
    const Model = this._Model
    const requelize = this._requelize
    const r = requelize.r

    Object.keys(tree).map((key) => {
      if (!tree[key]) {
        return
      }

      if (!Model._joins.hasOwnProperty(key)) {
        return new Query(r.error(`Missing relationship ${Model._name}.${key}`))
      }

      if (!requelize.models.hasOwnProperty(Model._joins[key].model)) {
        return new Query(r.error(`Missing model ${Model._joins[key].model} in relationship ${Model._name}.${key}`))
      }

      const join = Model._joins[key]
      const embedResult = relations[join.type](Query, requelize, Model, join, tree, key)

      mapper[join.field] = embedResult
    })

    this._query = this._query.merge(function (doc) {
      const allEmbeds = {}
      for (const key of Object.keys(mapper)) {
        allEmbeds[key] = mapper[key](doc)
      }

      return allEmbeds
    })

    return new Query(this._query, Model, requelize)
  }
}

module.exports = Query
