# REST API

- If a field does not exist then simply DO NOT send it. For instance, if I send the `description` field as an empty string `""` then it will be stored as `""` in the DB. If the field is not sent, then the field will be stored as null on the server. Hence, DO NOT send a field from the client side if it is empty.

```sql

# RESTful calls for debugging
GET /echo/:input echo input

# Collection's available RESTful API calls.
POST /collection creates collection with query params
GET /collection/:id get all collection data
GET /collection/:id/data get all collection movie input data

VIEW /collection/:id view all collection's processed data # Not implemented
VIEW /collection/:id/overview view collection processed overview data # Not implemented
VIEW /collection/:id/movies view collection's processed movie data # Not implemented
VIEW /collection/:id/series view collection processed series data # Not implemented
VIEW /collection/:id/genres view collection processed genre data # Not implemented
VIEW /collection/:id/people view collection processed people data # Not implemented
VIEW /collection/:id/keywords view collection processed keywords data # Not implemented

PUT /collection/:id/data/:data updates collection with processed data
PUT /collection/:id/name/:name updates collection name
PUT /collection/:id/descp/:descp updates collection description
PUT /collection/:id/id/:id updates collection id
PUT /collection/:id/movie/:imdbid adds movie in collection # Not implemented.
PUT /collection/:id/movie/:index/override/:imdbid overrides movie in collection for a movie index # Not implemented.
PUT /collection/:id/movie/:index/ignore ignore/delete movie in collection as per movie index # Not implemented.

LOCK /collection/:id sets collection to private
UNLOCK /collection/:id sets collection to public

DELETE /collection/:id deletes entire collection

# User's available RESTful API calls.
GET /user/:id get all user data
GET /movie get all movies matching query params: title, year, imdbid

POST /user creates user with query params

PUT /user/:id updates user with query params: username, email, name, password

UNLOCK /user/:id activates user
UNLOCK /user/activate/:id resend activation email # Not implemented
UNLOCK /user/forgot/:id resend password token # Not implemented
```


## MongoDB

- A document that does not have a property is equivalent to setting the property's value as null.

```sql
db.collections.find({foo: null})
```
returns all documents which has `{foo: null}` and the ones which do not have `foo` property atall.

### Todo

- Limit query size file storing a collection to prevent spamming of the DB by the client.

## Mongoose

Mongoose makes use of `Schema()` to define and search documents in a pre-defined way to help in validation of the user input.

### Todo

- Change default ordering while mongoose is saving the data

### Notes

- In a schema. If a property has default value to set to `null` AND if you've also defined `enum`, then the default value is not set to `null` which saving the document. Instead, it gives an error saying that it isn't present in `enum`'s array. A hack for this is to put in `null` as well into enum to make things easier. Reference: https://github.com/Automattic/mongoose/issues/3044

- The first parameter of a mongoose model is automatically interpretted by mongoose as a plural collection. That is,

```js
// Model for the mongo collection `users`
const User = mongoose.model('User', userSchema)
```


# Todo
- Separate npm `dependencies` and `devDependencies`.
- Fix `runtime`. It also has a unwanted ` min` string attached to the runtime.
- Change comma sparated data to arrays in `data.py`
- Create a language filter in `data.py` for searching movies like `'hindi', 'bollywood'` for client
- Convert `8` to `8.0` in `data.py` as we are doing a string search on cleint
- Change country -> countries in mongo.json and elastic.json and avoid consequences in parsesDocs


# Useful Snipets

```
db.tmdb.find({}, {id:1}).sort({_id:1}).forEach(function(doc){
    db.tmdb.remove({_id:{$gt:doc._id}, id:doc.id});
})
```

# Critical Bugs

- Why is `JSON.parse(JSON.stringify())` only working for cloning but not `_.cloneDeep()` or `Object.assign({},)` in populateEntries
