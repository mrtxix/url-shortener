const express = require("express");
const mongoose = require("mongoose");
const ShortUrl = require("./models/shortUrl");
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

// Set view engine
app.set("view engine", "ejs");

// Basic middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Basic route - render main page
app.get("/", async (req, res) => {
  const shortUrls = await ShortUrl.find();
  res.render("index", {
    shortUrls: shortUrls,
    baseUrl: `${req.protocol}://${req.get("host")}`,
  });
});

// Create short URL
app.post("/shortUrls", async (req, res) => {
  try {
    await ShortUrl.create({ full: req.body.fullUrl });
    res.redirect("/");
  } catch (error) {
    res.status(400).json({ error: "Failed to create short URL" });
  }
});

// Redirect to original URL
app.get("/:shortUrl", async (req, res) => {
  const shortUrl = await ShortUrl.findOne({ short: req.params.shortUrl });
  if (shortUrl == null) return res.sendStatus(404);

  shortUrl.clicks++;
  shortUrl.save();

  res.redirect(shortUrl.full);
});

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
