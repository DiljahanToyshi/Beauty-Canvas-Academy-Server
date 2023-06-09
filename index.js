const express = require('express')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')

const cors = require('cors')
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


        // students related apis
        app.get('/students',  async (req, res) => {
            const result = await studentsCollection.find().toArray();
            res.send(result);
        });

        app.post('/students', async (req, res) => {
            const user = req.body;
            // const query = { email: user.email }
            // const existingUser = await usersCollection.findOne(query);

            // if (existingUser) {
            //     return res.send({ message: 'user already exists' })
            // }

            const result = await studentsCollection.insertOne(user);
            res.send(result);
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

        app.get('/carts', async (req, res) => {
            const email = req.query.email;
            console.log(email)
            if (!email) {
                res.send([]);
            }

            // const decodedEmail = req.decoded.email;
            // if (email !== decodedEmail) {
            //     return res.status(403).send({ error: true, message: 'forbidden access' })
            // }

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