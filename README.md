# REST API


## Routes

```sql
# Debug
GET /debug/echo/:input echos input

# Collection's available RESTful API calls.
POST /collection creates collection with query params
GET /collection/:id get all collection data
GET /collection/:id/data get all collection movie input data

GET /collection/:id get all collection's processed data
GET /collection/:id/overview get collection processed overview data # Not implemented
GET /collection/:id/movies get collection's processed movie data # Not implemented
GET /collection/:id/series get collection processed series data # Not implemented
GET /collection/:id/genres get collection processed genre data # Not implemented
GET /collection/:id/people get collection processed people data # Not implemented
GET /collection/:id/keywords get collection processed keywords data # Not implemented

PUT /collection/:id/inputs updates collection with processed inputs
PUT /collection/:id/setting/:name updates collection id, name,description, visibility
PUT /collection/:id/entryid/:entryid/override/:imdbid overrides movie in collection at an entryid
PUT /collection/:id/entryid/:index/ignore ignores entryid in collection.

LOCK /collection/:id sets collection to private
UNLOCK /collection/:id sets collection to public

DELETE /collection/:id deletes entire collection

# User's available RESTful API calls. (Not in Production)
GET /user/:id get all user data
GET /movie get all movies matching query params: title, year, imdbid

POST /user creates user with query params

PUT /user/:id updates user with query params: username, email, name, password

UNLOCK /user/:id activates user
UNLOCK /user/activate/:id resend activation email # Not implemented
UNLOCK /user/forgot/:id resend password token # Not implemented
```

### Notes

- A document that does not have a property is equivalent to setting the property's value as null.

```sql
db.collections.find({foo: null})
```
returns all documents which has `{foo: null}` and the ones which do not have `foo` property at all.

- In a schema. If a property has default value to set to `null` AND if you've also defined `enum`, then the default value is not set to `null` which saving the document. Instead, it gives an error saying that it isn't present in `enum`'s array. A hack for this is to put in `null` as well into enum to make things easier. Reference: https://github.com/Automattic/mongoose/issues/3044

- The first parameter of a mongoose model is automatically interpretted by mongoose as a plural collection. That is,

```js
// Model for the mongo collection `users`
const User = mongoose.model('User', userSchema)
```


# Todo
- Change country -> countries in mongo.json and elastic.json and avoid consequences in parsesDocs

# Useful Snipets

```
db.tmdb.find({}, {id:1}).sort({_id:1}).forEach(function(doc){
    db.tmdb.remove({_id:{$gt:doc._id}, id:doc.id});
})
```

# Critical Bugs

- Why is `JSON.parse(JSON.stringify())` only working for cloning but not `_.cloneDeep()` or `Object.assign({},)` in populateEntries
- Titles are being searched against TMDb database currently, but you're referencing all data with respect to IMDb. Any TMDB title without IMDb ID will land into a lot of issues because of this. Therefore, you need to restrict elasticsearch to only titles with non empty imdbid
