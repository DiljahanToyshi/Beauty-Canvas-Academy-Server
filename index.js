const express = require('express')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')

const cors = require('cors')
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000

// middleware
const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus: 200,
}
app.use(cors(corsOptions))
app.use(express.json())


const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorized access' });
    }
    // bearer token
    const token = authorization.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
    })
}

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mq0mae1.mongodb.net/?retryWrites=true&w=majority`

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ist6ay7.mongodb.net/?retryWrites=true&w=majority`;


const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
})

async function run() {
    try {
        const studentsCollection = client.db('BeautyCanvas').collection('students')
        const coursesCollection = client.db('BeautyCanvas').collection('courseCollectin')
        const cartCollection = client.db('BeautyCanvas').collection('carts')
        const bookingsCollection = client.db('aircncDb').collection('bookings')

        // jwt token
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })

            res.send({ token })
        })

        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email }
            const user = await studentsCollection.findOne(query);
            if (user?.role !== 'Admin') {
                return res.status(403).send({ error: true, message: 'forbidden message' });
            }
            next();
        }
        const verifyInstructor = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email }
            const user = await studentsCollection.findOne(query);
            if (user?.role !== 'Instructor') {
                return res.status(403).send({ error: true, message: 'forbidden message' });
            }
            next();
        }

        // students related apis
        app.get('/students',  async (req, res) => {
            const result = await studentsCollection.find().toArray();
            res.send(result);
        });


         app.get('/students/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email:email }
            const result = await studentsCollection.findOne(query);
            res.send(result);
        });
        app.post('/students', async (req, res) => {
            const user = req.body;
            const query = { email: user.email }
            const existingUser = await studentsCollection.findOne(query);

            if (existingUser) {
                return res.send({ message: 'user already exists' })
            }

            const result = await studentsCollection.insertOne(user);
            res.send(result);
        });


        app.get('/students/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;

            if (req.decoded.email !== email) {
                res.send({ Admin: false })
            }

            const query = { email: email }
            const user = await studentsCollection.findOne(query);
            const result = { Admin: user?.role === 'Admin' }
            res.send(result);
        })
        app.get('/students/instructor/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;

            if (req.decoded.email !== email) {
                res.send({ Instructor: false })
            }

            const query = { email: email }
            const user = await studentsCollection.findOne(query);
            const result = { Instructor: user?.role === 'Instructor' }
            res.send(result);
        })

        app.patch('/students/admin/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const filter = { _id: new ObjectId(id) };
                const updateDoc = {
                    $set: {
                        role: 'Admin'
                    }
                };

                const result = await studentsCollection.updateOne(filter, updateDoc);

                res.send(result);
            } catch (error) {
                console.log('Error updating user role:', error);
                res.status(500).json({ error: 'Failed to update user role' });
            }
        });

        app.patch('/students/instructor/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const filter = { _id: new ObjectId(id) };
                const updateDoc = {
                    $set: {
                        role: 'Instructor'
                    }
                };

                const result = await studentsCollection.updateOne(filter, updateDoc);

                res.send(result);
            } catch (error) {
                console.log('Error updating user role:', error);
                res.status(500).json({ error: 'Failed to update user role' });
            }
        });

          

        // All course related apis
        app.get('/coursedata', async (req, res) => {
            const cursor = coursesCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/courses', async (req, res) => {
            const query = {};
            const options = {
                // sort matched documents in descending order by stundenNumber
                sort: {
                    "studentNumber": -1
                }
            };
            const cursor = coursesCollection.find(query, options);
            const result = await cursor.toArray();
            res.send(result);
        })

       app.get('/courses/:email',async(req,res) =>{
           const email = req.params.email;
           const query = { email: email }
           console.log(query);
           const result = await coursesCollection.find(query).toArray();
           res.send(result)
       })

       

        app.post('/courses', verifyJWT, verifyInstructor, verifyAdmin, async (req, res) => {
            const newItem = req.body;
            const result = await coursesCollection.insertOne(newItem);
            res.send(result);
        })
  // Approve class
        app.patch('/courses/:id', async (req, res) => {
            const id = req.params.id;
                const filter ={_id: new ObjectId(id)};
            const updateCourse = req.body;
            const updateDoc = {
                $set: {
                    status: updateCourse.status
                }
            };
            const result = await coursesCollection.updateOne(filter, updateDoc);
            res.send(result);
            
        });
       

         app.delete('/courses/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
             const result = await coursesCollection.deleteOne(query);
            res.send(result);
        })


        app.get('/carts', verifyJWT, async (req, res) => {
            const email = req.query.email;
            console.log(email)
            if (!email) {
                res.send([]);
            }

            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ error: true, message: 'no access' })
            }

            const query = { email: email };
            const result = await cartCollection.find(query).toArray();
            res.send(result);
        });


        app.post('/carts', async (req, res) => {
            const item = req.body;
          
            const result = await cartCollection.insertOne(item);
            res.send(result);
        })

        // app.patch('/carts/status/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const status = req.body.status;

        //     console.log(id);
        //     const query = { _id: new ObjectId(id) };
        //     const updateDoc = {
        //         $set: {
        //             booked: status,
        //         },
        //     };

        //     const result = await cartCollection.updateOne(query, updateDoc);
        //     res.send(result);

        // })

        app.delete('/carts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await cartCollection.deleteOne(query);
            res.send(result);
        })

        // Send a ping to confirm a successful connection
        await client.db('admin').command({ ping: 1 })
        console.log(
            'Pinged your deployment. You successfully connected to MongoDB!'
        )
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('BeautyCanvas Server is running..')
})

app.listen(port, () => {
    console.log(`BeautyCanvas is running on port ${port}`)
})