const express = require("express");
const mongoose = require("mongoose");
const ShortUrl = require("./models/shortUrl");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const dotenv = require("dotenv");
dotenv.config();

const app = express();

// Get base URL for deployment
const getBaseUrl = () => {
  if (process.env.NODE_ENV === "production") {
    let baseUrl =
      process.env.BASE_URL ||
      `https://${process.env.RENDER_EXTERNAL_HOSTNAME}` ||
      "https://your-app-name.onrender.com";

    // Clean up the BASE_URL - remove @ symbol and trailing slashes
    baseUrl = baseUrl.replace(/^@/, "").replace(/\/+$/, "");

    return baseUrl;
  }
  return `http://localhost:${process.env.PORT || 5000}`;
};

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "URL Shortener API",
      version: "1.0.0",
      description: "A simple URL shortening service",
    },
    servers: [
      {
        url: getBaseUrl(),
        description:
          process.env.NODE_ENV === "production"
            ? "Production server"
            : "Development server",
      },
    ],
  },
  apis: ["./server.js"], // files containing annotations
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// MongoDB connection with better error handling
const connectDB = async () => {
  try {
    const mongoURL =
      process.env.MONGO_URL || "mongodb://localhost:27017/urlshortener";
    console.log("Connecting to MongoDB...");

    await mongoose.connect(mongoURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log("✅ Connected to MongoDB successfully");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
};

// Connect to database
connectDB();

// Set view engine
app.set("view engine", "ejs");

// Basic middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Add request logging for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Swagger UI route (keep this first)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check route (specific routes first)
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

// Create short URL route (specific routes first)
app.post("/shortUrls", async (req, res) => {
  try {
    console.log("Creating short URL for:", req.body.fullUrl);
    await ShortUrl.create({ full: req.body.fullUrl });
    res.redirect("/");
  } catch (error) {
    console.error("Error creating short URL:", error);
    res.status(400).json({ error: "Failed to create short URL" });
  }
});

// Delete URL route (specific routes first)
app.delete("/delete/:shortUrl", async (req, res) => {
  try {
    const shortUrl = await ShortUrl.findOneAndDelete({
      short: req.params.shortUrl,
    });
    if (shortUrl == null)
      return res.status(404).json({ error: "URL not found" });
    res.json({ message: "URL deleted successfully" });
  } catch (error) {
    console.error("Error deleting URL:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Main page route
app.get("/", async (req, res) => {
  try {
    const shortUrls = await ShortUrl.find().sort({ createdAt: -1 });
    res.render("index", {
      shortUrls: shortUrls,
      baseUrl: getBaseUrl(),
    });
  } catch (error) {
    console.error("Error loading main page:", error);
    res.status(500).send("Server error");
  }
});

// Redirect route (keep this LAST - catch-all route)
app.get("/:shortUrl", async (req, res) => {
  try {
    const shortCode = req.params.shortUrl;
    console.log("Looking for short URL:", shortCode);

    // Check if shortCode is empty or just whitespace
    if (!shortCode || shortCode.trim() === "") {
      console.log("Empty short code");
      return res.status(404).json({
        error: "URL not found - empty short code",
        shortCode: shortCode,
        timestamp: new Date().toISOString(),
      });
    }

    const shortUrl = await ShortUrl.findOne({ short: shortCode });

    if (shortUrl == null) {
      console.log("URL not found:", shortCode);
      return res.status(404).send(`
        <html>
          <body>
            <h1>404 - URL Not Found</h1>
            <p>The short URL "${shortCode}" was not found in our database.</p>
            <p><a href="/">Go back to URL Shortener</a></p>
          </body>
        </html>
      `);
    }

    shortUrl.clicks++;
    await shortUrl.save();

    console.log("Redirecting to:", shortUrl.full);
    res.redirect(shortUrl.full);
  } catch (error) {
    console.error("Redirect error:", error);
    res.status(500).send(`
      <html>
        <body>
          <h1>500 - Server Error</h1>
          <p>An error occurred while processing your request.</p>
          <p><a href="/">Go back to URL Shortener</a></p>
        </body>
      </html>
    `);
  }
});

// 404 handler for unmatched routes
app.use((req, res) => {
  console.log("404 - Route not found:", req.url);
  res.status(404).json({
    error: "Route not found",
    path: req.url,
    timestamp: new Date().toISOString(),
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error("Global error handler:", error);
  res.status(500).json({
    error: "Internal server error",
    message: error.message,
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📚 Swagger UI available at ${getBaseUrl()}/api-docs`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Base URL: ${getBaseUrl()}`);
});
