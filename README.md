# Requelize

## Installation

```sh
yarn add requelize joi
```

[joi](https://github.com/hapijs/joi) is a peer dependency to create schemas

## Configuration

```js
const requelize = require('requelize')({ host: 'localhost', db: 'myApp' })
```

`opts` are passed to [rethinkdbdash](https://github.com/neumino/rethinkdbdash) options

### Debugging

requelize uses [debug](https://github.com/visionmedia/debug) to debug your apps.
You can use the `DEBUG` environment variable as follows:

```sh
DEBUG=requelize:* yarn start
```

## Model definition

```js
const joi = require('joi')

const User = requelize.model('User', {
  email: joi.string()
  firstname: joi.string(),
  lastname: joi.string()
})

User.index('email')
```

You might also pass a third argument to requelize.model that looks like this: `{ primaryKey: string }`

## Querying

```js
requelize.sync()
  .then(() => User.getAll('john.doe@example.com', { index: 'email' }))
  .then((users) => {
    console.log(users)
  })
```

First you need to sync database with `requelize.sync`. To query documents, you can use any rql commands.
`User` is a sugar syntax for `r.db('...').table('User')`.

## Create / Update / Delete

You can instanciate models to create documents

```js
const user = new User({
  email: 'john.doe@example.com',
  firstname: 'John',
  lastname: 'Doe'
})

user
  .save()
  .then(() => console.log(user.id))
```

You can update users with subsequent `save` calls

```js
user.email = 'john@doe.com'

user.save()
```

You can delete documents with the `delete` model method.

```js
user
  .delete()
  .then(() => assert.equal(null, user.id))
```

## Relationships

### hasOne

```js
User.hasOne('Role', 'role', 'User_id')
```

Arguments are:

  1. Relation Model name (the first argument of `requelize.model`)
  2. The virutal field on the instance (so that you have `user.role.id`)
  3. The foreign key to use. requelize defaults to `SelfModel_id`

### hasMany

```js
User.hasMany('Post', 'posts', 'User_id')
```

Arguments are:

  1. Relation Model name (the first argument of `requelize.model`)
  2. The virutal field on the instance (so that you have `user.posts[0].id`)
  3. The foreign key to use. requelize defaults to `SelfModel_id`

The foreign key have to be equal to the local key used on `belongsTo` method

### belongsTo

```js
Role.belongsTo('User', 'user', 'User_id')
Post.belongsTo('User', 'user', 'User_id')
```

Arguments are:

  1. Relation Model name (the first argument of `requelize.model`)
  2. The virutal field on the instance (so that you have `role.user.id` or `post.user.id`)
  3. The local key to use (usually: `model_id` or `modelId` or `Model_id`). requelize defaults to `Model_id`

### belongsToMany

```js
User.belongsToMany('Right', 'rights')
Right.belongsToMany('User', 'users')
```

Arguments are:

  1. Relation Model name (the first argument of `requelize.model`)
  2. The virutal field on the instance (so that you have `right.users[0].id` or `user.rights[0].id`)
  3. An optional join table name. Default is `ModelA_ModelB` with ModelA and ModelB being sorted

### embed and saveAll

To query an instance with its relationships, you can use `embed`:

```js
User
  .get('someId')
  .embed({
    role: true,
    rights: true,
    group: {
      admin: true
    }
  })
  .then((user) => {
    console.log(user.role.id)
    assert.equal(true, user.role instanceof Role)
  })
```

You may have nested relations with sub object (as in `group: { admin: true }`)

To save an instance with its relationships, you can use `saveAll`:

```js
user.role = roleA
user.rights = [ rightA, rightB ]

user.saveAll({
  role: true,
  rights: true
})
```

You can also save an array of ids with hasMany or belongsToMany:

```js
user.role = roleA
user.rights = [ rightA.id, rightB.id ]

user.saveAll({
  role: true,
  rights: true
})
```

Note: be careful that user.rights will be repopulated with rightA and rightB, but those objects will not
be the same as the original rightA and rightB.
That means `rightA.User_id` is undefined (because saveAll knows nothing about it), but `user.rights[0].User_id` will be set.

Tree has the same possibilities that you have in `embed`

### pivot data

If you want to save pivot data (data you store in a belongsToMany relationship), use `setPivot` and `getPivot`


```js
user.rights = [ rightA, rightB ]

rightA.setPivot('User', { period: 'infinity' })
rightB.setPivot('User', { period: 'this month' })

user.saveAll({ rights: true })
```

The data will be stored in the joint table. It is shared between the user instance and the right instance

```js
Right
  .get('rightAId')
  .embed({ users: true })
  .then((rightA) => {
    console.log(rightA.users[0].getPivot('User')) // should be equal
  })

User
  .get('userId')
  .embed({ rights: true })
  .then((user) => {
    console.log(user.rights[0].getPivot('User')) // should be equal
  })
```

Note: a race condition exists here because of `users[0]` and `rights[0]`.
A proper way to do it would be to use: `rights.find(right => right.id === rightA.id)`

### Custom joins tables — three-way relationships

You can provide your own model to join tables:

```js
User = requelize.model('User', { name: Joi.string() })
Role = requelize.model('Role', { name: Joi.string() })
Period = requelize.model('Period', { name: Joi.string() })
UserRole = requelize.model('UserRole')

// This is important (creates indexes for relation fields)
UserRole.customJoinTable('User', 'Role')

Period.hasMany('UserRole', 'userroles')
UserRole.belongsTo('Period', 'period')

User.belongsToMany('Role', 'roles', 'UserRole')
Role.belongsToMany('User', 'users', 'UserRole')
```

To save a three-way document:

```js
user = new User({ name: 'John Doe' })
role = new Role({ name: 'Admin' })
period = new Period({ name: 'Infinity' })
userRole = new UserRole()

user.roles = [
  {
    // this is the related document
    document: role,
    // this is the join document
    through: userRole,
    // this will be used when saving the join document
    saveAll: { period: true }
  }
]

userRole.period = period

return user.saveAll({
  roles: true
})
```

To retrieve a three-way document:

```js
User
  .embed({ roles: { _through: { period: true } } })
  .nth(0)
  .then((res) => {
    console.log(res.roles[0]._through.period)
  })
```

## Changefeeds

requelize provide a changefeed structure with the library [rxjs](https://github.com/Reactive-Extensions/RxJS) and Observables.
You are free to use original cursors if you want (by using `changes((err, cursor) => { ... })` and not `.feed()`)

```js
let feed = User.feed()

feed
  .filter(event => event.type === 'create')
  .subscribe(
    (event) => console.log(event),
    (err) => console.error(err)
  )
```

`event` is a simple object that contains:

  - type (string): 'create', 'update' or 'delete'
  - from (Object): the original value (null when event.type === 'create')
  - to (Object): the target value (null when event.type === 'delete')

You should unsubscribe when you do not have any use of it by using the custom Observable method `close()`:

```js
let feed = User.feed()

let subscription = feed
  .filter(event => event.type === 'create')
  .subscribe(
    (event) => console.log(event),
    (err) => console.error(err)
  )

somePromise()
  .then(() => {
    feed.close()
    subscription.unsubscribe()
  })
```

Note: in the example above, the subscription is also closed

## Hooks

A few hooks are available in requelize: `validating`, `validated`, `saving`, `saved`, `creating`, `created`, `updating` and `updated`.

```js
User.on('saving', (user) => {
  user.editedAt = new Date()
})

User.on('creating', (user) => {
  user.createdAt = new Date()
})
```

Hooks also support promises

```js
User.on('saving', (user) => {
  return somePromise()
    .then(() => {
      user.foo = 'bar'
    })
})
```

## Parse and validation

If you plan to use queries that do *not* resolve to a Model instance, but starts from a model, use `parse()` :

```js
User
  .parse(false)
  .getAll()
  .map((user) => 1)
  .reduce((a, b) => a.add(b))
  .run()
  .then((res) => {
    assert.equal('number', typeof res)
  })
```

Note: you need to call `run()`

You can also disable validation when saving a document. Documents are only validated at insert, not at retrieval

```js
user.someInvalidField = 'foo'

user.validate(false).save()
```

## Virtuals

If you need virtual fields, you can use `virtual` method from model:

```js
const User = requelize.model('User', {
  email: joi.string()
  firstname: joi.string(),
  lastname: joi.string()
})

User.virtual('fullname', user => `${user.firstname} ${user.lastname}`)

let user = new User({ firstname: 'John', lastname: 'Doe' })

assert.equal('John Doe', user.fullname)
```

## Access to requelize

If you need `r` for any use (`r.row`, etc.) you can find it under `requelize`: `requelize.r`
