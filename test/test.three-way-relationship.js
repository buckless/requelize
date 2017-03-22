const Joi = require('joi')
const { test, requelize, dropDb } = require('./utils')

test('three-way relationship - saveAll', (t) => {
  t.plan(8)

  let User
  let Role
  let Period
  let UserRole

  let user
  let role
  let period
  let userRole

  dropDb()
    .then(() => {
      User = requelize.model('User', { name: Joi.string() })
      Role = requelize.model('Role', { name: Joi.string() })
      Period = requelize.model('Period', { name: Joi.string() })
      UserRole = requelize.model('UserRole')

      UserRole.index('User')
      UserRole.index('Role')

      Period.hasMany('UserRole', 'userroles')
      UserRole.belongsTo('Period', 'period')

      User.belongsToMany('Role', 'roles', 'UserRole')
      Role.belongsToMany('User', 'users', 'UserRole')

      return requelize.sync()
    })
    .then(() => {
      user = new User({ name: 'John Doe' })
      role = new Role({ name: 'Admin' })
      period = new Period({ name: 'Infinity' })
      userRole = new UserRole()

      user.roles = [
        {
          document: role,
          through: userRole,
          saveAll: { period: true }
        }
      ]

      userRole.period = period

      return user.saveAll({
        roles: true
      })
    })
    .then(() => {
      t.equal('string', typeof user.id, 'user is saved')
      t.equal('string', typeof role.id, 'role is saved')
      t.equal('string', typeof period.id, 'period is saved')
      t.equal('string', typeof userRole.id, 'userRole is saved')
      t.equal(1, user.roles.length, 'user has roles')
      t.equal(true, user.roles[0].hasOwnProperty('_through'), 'user has roles')
      t.equal(user.roles[0].id, role.id, 'user has role')
      t.equal(user.roles[0]._through.Period_id, period.id, 'user has userRole')
      t.end()
    })
    .catch((err) => {
      t.fail(err)
    })
})

test('three-way relationship - embed', (t) => {
  t.plan(6)

  let User
  let Role
  let Period
  let UserRole

  let user
  let role
  let period
  let userRole

  dropDb()
    .then(() => {
      User = requelize.model('User', { name: Joi.string() })
      Role = requelize.model('Role', { name: Joi.string() })
      Period = requelize.model('Period', { name: Joi.string() })
      UserRole = requelize.model('UserRole')

      UserRole.index('User')
      UserRole.index('Role')

      Period.hasMany('UserRole', 'userroles')
      UserRole.belongsTo('Period', 'period')

      User.belongsToMany('Role', 'roles', 'UserRole')
      Role.belongsToMany('User', 'users', 'UserRole')

      return requelize.sync()
    })
    .then(() => {
      user = new User({ name: 'John Doe' })
      role = new Role({ name: 'Admin' })
      period = new Period({ name: 'Infinity' })
      userRole = new UserRole()

      user.roles = [
        {
          document: role,
          through: userRole,
          saveAll: { period: true }
        }
      ]

      userRole.period = period

      return user.saveAll({
        roles: true
      })
    })
    .then(() => {
      return User.embed({
        roles: { _through: { period: true } }
      })
    })
    .then((res) => {
      t.ok(res.length === 1, 'user is retrieved')
      t.equal(res[0].id, user.id, 'user id is correct')
      t.ok(Array.isArray(res[0].roles) && res[0].roles.length === 1, 'user has roles')
      t.equal(userRole.id, res[0].roles[0]._through.id, 'user has userRole')
      t.equal(period.id, res[0].roles[0]._through.Period_id, 'userRole has period')
      t.equal(period.id, res[0].roles[0]._through.period.id, 'userRole has period joint')
      t.end()
    })
    .catch((err) => {
      t.fail(err)
    })
})
