const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
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

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    const bookingsCollection = client
      .db("QuokkoParcelDB")
      .collection("bookings");

    // jwt related api
    app.post("/jwt", async (req, res) => {
      try {
        const user = req.body;
        // console.log(user);

        if (!process.env.ACCESS_TOKEN_SECRET) {
          console.error("ACCESS_TOKEN_SECRET is not set");
          return res.status(500).send("Server configuration error");
        }

        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: "1h",
        });
        // console.log(token);
        return res.send({ message: "Login successful", token: token });
      } catch (error) {
        console.error("Error generating token:", error);
        res.status(500).send("Error generating token");
      }
    });

    // middlewares
    const verifyToken = (req, res, next) => {
      console.log("inside verify token", req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access" });
        }
        req.decoded = decoded;
        next();
      });
    };

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

    // get a user info by email from db
    app.get("/users/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const result = await usersCollection.findOne({ email });
      res.send(result);
    });

    // bookings collection api's
    app.post("/bookings", verifyToken, async (req, res) => {
      const booking = req.body;
      console.log(booking);
      const result = await bookingsCollection.insertOne(booking);
      res.json(result);
    });

    app.get("/bookings/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      console.log(`Request received for email: ${email}`);
      try {
        const result = await bookingsCollection.find({ email }).toArray();
        if (result.length === 0) {
          console.log("No bookings found for this email.");
        } else {
          console.log("Bookings found:", result);
        }
        res.send(result);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).send({ message: "Error fetching bookings" });
      }
    });

    app.delete("/bookings/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      console.log(`Request received for id: ${id}`);
      try {
        const result = await bookingsCollection.deleteOne({
          _id: new ObjectId(id),
        });
        if (result.deletedCount === 1) {
          res.status(200).send({ message: "Document successfully deleted" });
        } else {
          res.status(404).send({ message: "Document not found" });
        }
      } catch (error) {
        res.status(500).send({ message: "An error occurred", error });
      }
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
