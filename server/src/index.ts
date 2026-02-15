import express from "express";
import mongoose from "mongoose";

const app = express();
const port = 5000;

// Middleware
app.use(express.json());

// MongoDB Connection (Updated for Mongoose v6+)
mongoose.connect("mongodb://localhost:27017/mydb")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("MongoDB connection error:", err));

// Routes
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
