const hasOne = require('./hasOne')
const belongsTo = require('./belongsTo')
const hasMany = require('./hasMany')
const belongsToMany = require('./belongsToMany')
const { ReplaySubject } = require('rxjs')

const relations = { hasOne, belongsTo, hasMany, belongsToMany }

class Query {
  constructor (query, Model, requelize, parse = true) {
    this._query = query
    this._Model = Model
    this._requelize = requelize
    this._parse = parse
  }

  parse (newValue) {
    this._parse = newValue

    return this
  }

  run () {
    let q = this._query.run()

    // enable model parsing for query result
    if (this._parse) {
      q = q.then((res) => this._Model._parse(res))
    }

    return q
  }

  // Allow query without run()
  then (success, error) {
    return this.run().then(success, error)
  }

  // Allow query without run()
  catch (error) {
    return this.then(null, error)
  }

  changes (callback) {
    return this._query.changes().run(callback)
  }

  // Create observable from changes cursor
  feed () {
    const subject = new ReplaySubject()
    let cursor

    this._query.changes().run((err, cursor_) => {
      /* istanbul ignore if */
      if (err) {
        subject.error(err)
        return
      }

      cursor = cursor_

      cursor.each((err, data) => {
        /* istanbul ignore if */
        if (err) {
          subject.error(err)
          return
        }

        if (data.old_val && data.new_val) {
          subject.next({ type: 'update', from: data.old_val, to: data.new_val })
        } else if (data.old_val && !data.new_val) {
          subject.next({ type: 'delete', from: data.old_val, to: null })
        } else {
          subject.next({ type: 'create', from: null, to: data.new_val })
        }
      })
    })

    let obs = subject.asObservable()

    /**
     * Closes the cursor used by the changefeed observable
     */
    obs.close = () => {
      cursor.close()
    }

    return obs
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

    /*
     * For each relationship, helpers return a function that can be used in a merge rql function
     * The request basically looks like that :
     * (...query).merge(function (doc) {
     *   return {
     *     foos: hasMany(..., FooModel, doc)
     *   }
     * })
     *
     * with hasMany getting foos from the relationship
     */
    this._query = this._query.merge(function (doc) {
      const allEmbeds = {}
      for (const key of Object.keys(mapper)) {
        allEmbeds[key] = mapper[key](doc)
      }

      return allEmbeds
    })

    return new Query(this._query, Model, requelize, this._parse)
  }
}

module.exports = Query
