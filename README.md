# node-express-graphql-auth
example of basic auth for graphql queries

this just an example of how we can user GraphQL with user authentication to create new posts / to show user posts
To pass the `session` to the root argument for the solvers, we pass object with the session variable to `rootValue`:
```js
 .use('/graphql', bodyParser.json(), graphqlHTTP(req => ({
    
    // some code here..
    
    rootValue: { session: req.session },
    
})))
```

### Usage:
```bash
 npm i
 npm start
```
and then open http://localhost:3000/graphql in your browser

### GraphQL Queries:

#### Let's create user, using `createUser` mutatation request:
```graphql
mutation {
  createUser(login:"SomeUser", pw:"myPass") {
    _id
    login
    pw
  }
}
```
Result:
```json
{
  "data": {
    "createUser": {
      "_id": "5d036f8fe9ad5b24efab7eaf",
      "login": "SomeUser",
      "pw": "myPass"
    }
  }
}
```

#### and login using the same credentials:
```mutation {
  loginUser(login:"SomeUser", pw:"myPass") {
    _id
    login
    pw
  }
}
```
Result:
```json
{
  "data": {
    "loginUser": {
      "_id": "5d036f8fe9ad5b24efab7eaf",
      "login": "SomeUser",
      "pw": "myPass"
    }
  }
}
```

#### as an authorized user lets `createPost`:
```graphql
mutation {
  createPost(title:"First post", content:"this is my first post, just for test!") {
    _id
    title
    content
  }
}
```
Result:
```json
{
  "data": {
    "createPost": {
      "_id": "5d0378e9e9ad5b24efab7eb0",
      "title": "First post",
      "content": "this is my first post, just for test!"
    }
  }
}
```

#### lets query that post directly by `_id`:
```graphql
query {
  post(_id:"5d0378e9e9ad5b24efab7eb0") {
    _id
    userId
    title
    content
    comments {
      _id
      postId
      content
    }
  }
}
```
Result:
```json
{
  "data": {
    "post": {
      "_id": "5d0378e9e9ad5b24efab7eb0",
      "userId": "5d036f8fe9ad5b24efab7eaf",
      "title": "First post",
      "content": "this is my first post, just for test!",
      "comments": []
    }
  }
}
```
As you can see the userID field was set to your user._id

#### now lets create comment to the post
```graphql
mutation {
  createComment(postId:"5d0378e9e9ad5b24efab7eb0", content:"this is my first comment!") {
    _id
    postId
    content
  }
}
```

```json
{
  "data": {
    "createComment": {
      "_id": "5d0383640172c0552fbd515e",
      "postId": "5d0378e9e9ad5b24efab7eb0",
      "content": "this is my first comment!"
    }
  }
}
```

#### query for the posts & comments:
```json
{
  "data": {
    "posts": [
      {
        "_id": "5d0378e9e9ad5b24efab7eb0",
        "userId": "5d036f8fe9ad5b24efab7eaf",
        "title": "First post",
        "content": "this is my first post, just for test!",
        "comments": [
          {
            "_id": "5d0383640172c0552fbd515e",
            "postId": "5d0378e9e9ad5b24efab7eb0",
            "content": "this is my first comment!"
          }
        ]
      }
    ]
  }
}
```

#### now, in case user want to logout:
```graphql
mutation {
  logoutUser(_id:"5d036f8fe9ad5b24efab7eaf")
}
```
Result:
```json
{
  "data": {
    "logoutUser": true
  }
}
```

### and now try to query, it will give you empty result:
```graphql
query {
  posts {
    _id
    userId
    title
    content
  }
}
```
Result:
```json
{
  "data": {
    "posts": null
  }
}
```
