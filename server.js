const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const app = express();

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URL || "mongodb://localhost:27017/urlshortener", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Basic middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Basic route
app.get("/", (req, res) => {
  res.send("URL Shortener - Coming Soon!");
});

// Health check route
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
