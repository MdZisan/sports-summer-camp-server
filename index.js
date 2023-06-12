const express =  require('express');
const app =  express();
const cors = require('cors');
const jwt = require('jsonwebtoken')
const port =  process.env.PORT || 5000;
require('dotenv').config()
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY);
//middleware
app.use(cors());
app.use(express.json())

//jwt
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
    const paymentHistoryCollection = client.db('summer_camp').collection('paymentHistory')

//jwt 
app.post('/jwt', (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })

  res.send({ token })
})
// users 
app.post('/users',async(req,res)=>{
  const user =  req.body;
  // console.log(user);
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

app.get('/users',verifyJWT,async(req,res)=>{
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
  const classId = selectedClasses._id;
  delete selectedClasses._id;
  delete selectedClasses.status;
  delete selectedClasses.feedback;
  delete selectedClasses.studentEnrolled;
  selectedClasses.classId = classId;
  selectedClasses.classStatus= 'selected'

  const result = await selectedClassesCollection.insertOne(selectedClasses);
  res.send(result);
  }


} )
app.delete('/selectedClass/:id',async(req,res)=>{
  const id= req.params.id;
  const result= await selectedClassesCollection.deleteOne({_id: new ObjectId(id)})
  res.send(result)

})

app.get('/selectedClass',async(req,res)=>{
  let filter = {};
  if(req.query.email){
  filter = {studentEmail: req.query.email,classStatus: req.query.classStatus};
  }


  const result=  await selectedClassesCollection.find(filter).toArray();
  res.send(result)

})

//classes
app.post('/classes',async(req,res)=>{
 const classes = req.body;

 classes.studentEnrolled = 0;

// console.log(classes);
 const result= await classesCollection.insertOne(classes)
 res.send(result)


})

/// classes seats increases by instructor
app.patch('/updateClasses/:id',async(req,res)=>{
  const id= req.params.id;
  const  {seats}= req.body;
const filter = {_id: new ObjectId(id)};
const updateDoc = {
  $inc:{
    availableSeats: seats,
  }
}
const result =  await classesCollection.updateOne(filter,updateDoc)
res.send(result)
  // console.log(id, seats);

})
app.get('/updateClasses/:id',async(req,res)=>{
  const id = req.params.id;
  const result = await classesCollection.find({_id: new ObjectId(id)}).toArray();
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

app.get('/popularClasses',async(req,res)=>{
  
  let filter = {};
 
  if(req.query.status){
    filter = {status: req.query.status};
  }
  const result = await classesCollection.find(filter).sort({studentEnrolled:-1}).limit(6).toArray()
  res.send(result)
})
//payment
app.post('/payment',async(req,res)=>{
 
  const ids= req.body.allIDs;
  const classIds =req.body.classId;
  // const objIds = ids.map(id=> new ObjectId(id))
  // console.log(objIds);
  const selectedfilter = {
    _id: {$in: ids.map(id=> new ObjectId(id))} 
  };
  const selectedClassesUpdateDoc = {
    $set: {
      classStatus: 'enrolled',
    },
    $inc: {
      availableSeats: -1
    }
  };

  const allClassFilter = {
    _id: {$in: classIds.map(id=> new ObjectId(id))} 
  };
  const allClassesUpdateDoc = {
   
    $inc: {
      availableSeats: -1,
      studentEnrolled: 1
    }
  };


  const selectedClassesUpdate = await selectedClassesCollection.updateMany(selectedfilter,selectedClassesUpdateDoc)
  const allClassesUpdate = await classesCollection.updateMany(allClassFilter,allClassesUpdateDoc)
   const paymentInfo = req.body;
const result = await paymentHistoryCollection.insertOne(paymentInfo);

res.send({selectedClassesUpdate,allClassesUpdate,paymenthistory:result})

})


app.post('/create-payment-intent', async (req, res) => {
  const { price } = req.body;
  const amount = price * 100;
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: 'usd',
    payment_method_types: ['card']
  });

  res.send({
    clientSecret: paymentIntent.client_secret
  })
})

app.get('/paymentHistory',async(req,res)=>{
  const {email} = req.query;
  const result = await paymentHistoryCollection.find({email: email}).sort({date:-1}).toArray();
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