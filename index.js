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
        // students related apis
        app.get('/students',  async (req, res) => {
            const result = await studentsCollection.find().toArray();
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

       
        // app.get('/api/classes', async (req, res) => {
        //     try {
        //         const classes = await db.collection('classes').find().toArray();
        //         res.json(classes);
        //     } catch (error) {
        //         console.log('Error retrieving classes:', error);
        //         res.status(500).json({ error: 'Failed to retrieve classes' });
        //     }
        // });
       


        // Approve class
        app.patch('/courses/:id/approved', async (req, res) => {
            try {
                const { id } = req.params;

                const result = await db
                    .collection('coursesCollection')
                    .updateOne({ _id: ObjectId(id) }, { $set: { status: 'approved' } });

                if (result.modifiedCount === 1) {
                    res.json({ success: true });
                } else {
                    res.status(404).json({ error: 'Class not found' });
                }
            } catch (error) {
                console.log('Error approving class:', error);
                res.status(500).json({ error: 'Failed to approve class' });
            }
        });

        // Deny class
        app.patch('/courses/:id/denied', async (req, res) => {
            try {
                const { id } = req.params;

                const result = await db
                    .collection('coursesCollection')
                    .updateOne({ _id: ObjectId(id) }, { $set: { status: 'denied' } });

                if (result.modifiedCount === 1) {
                    res.json({ success: true });
                } else {
                    res.status(404).json({ error: 'Class not found' });
                }
            } catch (error) {
                console.log('Error denying class:', error);
                res.status(500).json({ error: 'Failed to deny class' });
            }
        });

        // Send feedback
        app.patch('/courses/:id/feedback', async (req, res) => {
            try {
                const { id } = req.params;
                const { feedback } = req.body;

                const result = await db
                    .collection('coursesCollection')
                    .updateOne({ _id: ObjectId(id) }, { $set: { feedback } });

                if (result.modifiedCount === 1) {
                    res.json({ success: true });
                } else {
                    res.status(404).json({ error: 'Class not found' });
                }
            } catch (error) {
                console.log('Error sending feedback:', error);
                res.status(500).json({ error: 'Failed to send feedback' });
            }
        });


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