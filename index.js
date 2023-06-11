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

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const usersCollection = client.db('summer_camp').collection('users')
    const selectedClassesCollection = client.db('summer_camp').collection('selectedClasses')


// users 
app.post('/users',async(req,res)=>{
  const user =  req.body;
  console.log(user);
  const existing = await usersCollection.findOne({email:user.email})
   
      if(existing){
        return res.send({message:'user already existed'})
      }
  const result = await usersCollection.insertOne(user);
  res.send(result)
})

app.patch('/users/:id',async(req,res)=>{
  const id = req.params.id;
  const newRole= req.query.role;
  const filter = {_id: new ObjectId(id)};
  
  const updateDoc= {
    $set:{
      role: newRole
    }
  }
const result= await usersCollection.updateOne(filter,updateDoc);
res.send(result)


})

app.get('/users',async(req,res)=>{
  let filter = {};
  if(req.query.email){
  filter = {email: req.query.email};
  }
  if(req.query.role){
    filter ={role: req.query.role};
  }
  const result = await usersCollection.find(filter).toArray();
  res.send(result)
})

//selectedClasses

app.post('/selectedClass',async(req,res)=>{
  // console.log(req.body);
  const existedFilter =  {studentEmail: req.body.studentEmail,name: req.body.name}
 
  const existedClass = await selectedClassesCollection.findOne(existedFilter)
  
  if(existedClass){
    return res.send('already selected');
  
  }
  else{
    
    const selectedClasses = { ...req.body };
    delete selectedClasses._id; // Remove the _id field
    const result = await selectedClassesCollection.insertOne(selectedClasses);
    res.send(result);
  }


} )

app.get('/selectedClass',async(req,res)=>{
  let filter = {};
  if(req.query.email){
  filter = {studentEmail: req.query.email};
  }


  const result=  await selectedClassesCollection.find(filter).toArray();
  res.send(result)

})

//classes
app.post('/classes',async(req,res)=>{
 const classes = req.body;
// console.log(classes);
 const result= await classesCollection.insertOne(classes)
 res.send(result)


})

//class status update

app.patch('/classes/:id',async(req,res)=>{
  const id= req.params.id;
  const status= req.query.status;
  const filter = {_id: new ObjectId(id)}
  console.log(id,status);
  const updateDoc = {
    $set:{
        status: status,
    }
  }
  const result = await classesCollection.updateOne(filter,updateDoc);
  res.send(result)

})

//class feed back 
app.put('/classes',async(req,res)=>{
  const {id,feedback} = req.query;
 const filter = {_id: new ObjectId(id)}
 const updateDoc ={
  $set:{
    feedback: feedback
  }
 }
 const result = await classesCollection.updateOne(filter,updateDoc)
 res.send(result)
  // console.log(id,feedback);
  
})

//classes to frontend
app.get('/classes',async(req,res)=>{
  let filter = {};
  if(req.query.email){
  filter = {instructorEmail: req.query.email};
  }
  if(req.query.status){
    filter = {status: req.query.status};
  }
  const result = await classesCollection.find(filter).toArray()
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