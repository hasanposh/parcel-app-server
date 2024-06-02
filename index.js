const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

// middleware
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://parcel-app-client.web.app",
      "https://parcel-app-client.firebaseapp.com",
    ],
    credentials: true,
  })
);

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tlu13v2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const usersCollection = client.db("QuokkoParcelDB").collection("users");

    // user collection api's
    app.post("/users", async (req, res) => {
      const user = req.body;
    //   console.log(user);
      const query = { email: user.email };
      const existInUser = await usersCollection.findOne(query);
      if (existInUser) {
        return res.send({ message: "User already exist", insertedId: null });
      }
      const result = await usersCollection.insertOne(user);
      res.json(result);
    });

    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("This is the parcel app Quokko");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
