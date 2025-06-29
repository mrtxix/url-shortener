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

// Basic middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Basic route - show all URLs
app.get("/", async (req, res) => {
  const shortUrls = await ShortUrl.find();
  res.json({
    message: "URL Shortener Service",
    urls: shortUrls,
    total: shortUrls.length,
  });
});

// Create short URL
app.post("/shortUrls", async (req, res) => {
  try {
    const newUrl = await ShortUrl.create({ full: req.body.fullUrl });
    res.json({
      message: "URL shortened successfully",
      url: newUrl,
      shortUrl: `${req.protocol}://${req.get("host")}/${newUrl.short}`,
    });
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
