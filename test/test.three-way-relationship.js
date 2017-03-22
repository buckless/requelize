const Joi = require('joi')
const { test, requelize, dropDb } = require('./utils')

test('three-way relationship', (t) => {
  t.plan(9)

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
      t.equal(true, user.roles[0].hasOwnProperty('document'), 'user has roles')
      t.equal(true, user.roles[0].hasOwnProperty('through'), 'user has roles')
      t.equal(user.roles[0].document.id, role.id, 'user has role')
      t.equal(user.roles[0].through.Period_id, period.id, 'user has userRole')
      t.end()
    })
    .catch((err) => {
      t.fail(err)
    })
})
