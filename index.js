const express =  require('express');
const app =  express();
const cors = require('cors')
// const jwt = require('jsonwebtoken')
const port =  process.env.PORT || 5000;
require('dotenv').config()

//middleware
app.use(cors());
app.use(express.json())

// MongoDB

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mcjrvhr.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const classesCollection = client.db('summer_camp').collection('classes')

app.get('/classes',async(req,res)=>{

  const result = await classesCollection.find().toArray()
  res.send(result)

})

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);













app.get('/',(req,res)=>{
    res.send('Summer camp is running')
})
app.get('/test',(req,res)=>{
    res.send('Summer camp is test running')
})


app.listen(port,()=>{
    console.log(`summer camp is running on ${port}`);
})