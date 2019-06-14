const 	express = require('express'),
		session = require('express-session'),
		bodyParser = require('body-parser'),
		cors = require('cors'),
		{MongoClient, ObjectId} = require('mongodb'),
		graphqlHTTP = require('express-graphql'),
		{makeExecutableSchema} = require('graphql-tools'),

		mongoURI = 'mongodb://localhost:27017',
		mongoDB = 'test',
		PORT = 3000

const prepare = o => {
	if (!o._id) return o
    o._id = o._id.toString()
    return o
}

const start = async () => {
    try {
        const mongo = await MongoClient.connect(mongoURI, { useNewUrlParser: true })
		const db = mongo.db(mongoDB)

		const Users = db.collection('users')
        const Posts = db.collection('posts')
        const Comments = db.collection('comments')

        const typeDefs = [`
		  type Query {
			post(_id: String): Post
			posts: [Post]
			comment(_id: String): Comment
		  }

		  type User {
			_id: String
			login: String
			pw: String
			posts: [Post]
			comments: [Comment]
		  }

		  type Post {
			_id: String
			userId: String
			title: String
			content: String
			comments: [Comment]
		  }

		  type Comment {
			_id: String
			userId: String
			postId: String
			content: String
			post: Post
		  }

		  type Mutation {
		  	createUser(login: String, pw: String): User
		  	loginUser(login: String, pw: String): User
		  	logoutUser(_id: String): Boolean
			createPost(title: String, content: String): Post
			createComment(postId: String, content: String): Comment
		  }

		  schema {
			query: Query
			mutation: Mutation
		  }
		`];

        const resolvers = {
            Query: {

                post: async (root, args) => {
					if (!root.session.auth) return null

					return prepare(await Posts.findOne({ _id: ObjectId(args._id), userId: root.session.auth }))
                },

                posts: async (root) => {
					if (!root.session.auth) return null

                    return (await Posts.find({ userId: root.session.auth }).toArray()).map(prepare)
                },

                comment: async (root, args) => {
					if (!root.session.auth) return null

                    return prepare(await Comments.findOne(ObjectId(args._id)))
                },
            },

            Post: {
                comments: async (root, args, context, info) => {
					if (!info.rootValue.session.auth) return null
                    return (await Comments.find({userId: info.rootValue.session.auth, postId: root._id}).toArray()).map(prepare)
                }
            },

            Comment: {
                post: async (root, args, context, info) => {
					if (!info.rootValue.session.auth) return null
                    return prepare(await Posts.findOne({_id: ObjectId(root.postId), userId: info.rootValue.session.auth }))
                }
            },

            Mutation: {
				createUser: async (root, args, context, info) => {
					const res = await Users.insertOne(args)
					return prepare(res.ops[0])
				},

				loginUser: async (root, args, context, info) => {
					const res = await Users.findOne(args)
					if (!res || !res._id) return null

					res.loged = true
					root.session.auth = res._id
					return prepare(res)
				},

				logoutUser: (root, args, context, info) => {
					if (root.session.auth === args._id) {
						root.session.auth = false
						return true
					}
					return false
				},

                createPost: async (root, args, context, info) => {
					if (!root.session.auth) throw "Call loginUser() please!"
					args.userId = root.session.auth
                    const res = await Posts.insertOne(args)
                    return prepare(res.ops[0])
                },

                createComment: async (root, args, context, info) => {
					if (!root.session.auth) throw "Call loginUser() please!"
					args.userId = root.session.auth
                    const res = await Comments.insert(args)
                    console.log('createComment => ', res)
                    return prepare(await Comments.findOne({_id: res.insertedIds[0]}))
                },
            },
        }

        const schema = makeExecutableSchema({
            typeDefs,
            resolvers
        })

        var app = express();
		let sess = {
		  secret: 'keyboarat',
		  resave: false,
		  saveUninitialized: true,
		  cookie: { secure: false, maxAge: 86400000 } // maxAge = 1 day
		}

		if (process.env.NODE_ENV === 'production') {
 			app.set('trust proxy', 1) // trust first proxy
			sess.cookie.secure = true // serve secure cookies
		}

        app	.use(cors())
        	.use(session(sess))
			.use('/graphql', bodyParser.json(), graphqlHTTP(req => ({
					schema,
					rootValue: { session: req.session },
					graphiql: process.env.NODE_ENV !== 'production',
				})
			))
	 		.listen(PORT, () => {
            console.log(`Visit http://localhost:${PORT}/graphql`)
        })
    } catch (e) {
        console.log(e)
    }
}

start()
