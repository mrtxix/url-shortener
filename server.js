const express = require("express");
const mongoose = require("mongoose");
const ShortUrl = require("./models/shortUrl");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const app = express();
const dotenv = require("dotenv");
dotenv.config();

// Get base URL for deployment
const getBaseUrl = () => {
  if (process.env.NODE_ENV === "production") {
    return (
      process.env.BASE_URL ||
      `https://${process.env.RENDER_EXTERNAL_HOSTNAME}` ||
      "https://your-app-name.onrender.com"
    );
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

// mongo connected
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// to render ejs pages
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));

// Swagger UI route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /:
 *   get:
 *     summary: Get the main page with all shortened URLs
 *     description: Renders the main page showing all shortened URLs in a table
 *     responses:
 *       200:
 *         description: HTML page with shortened URLs
 */
app.get("/", async (req, res) => {
  const shortUrls = await ShortUrl.find();
  res.render("index", { shortUrls: shortUrls, baseUrl: getBaseUrl() });
});

/**
 * @swagger
 * /shortUrls:
 *   post:
 *     summary: Create a new shortened URL
 *     description: Creates a new shortened URL from a full URL
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               fullUrl:
 *                 type: string
 *                 description: The full URL to be shortened
 *     responses:
 *       302:
 *         description: Redirects to the main page after creating the shortened URL
 */
app.post("/shortUrls", async (req, res) => {
  await ShortUrl.create({ full: req.body.fullUrl });

  res.redirect("/");
});

/**
 * @swagger
 * /{shortUrl}:
 *   get:
 *     summary: Redirect to the original URL
 *     description: Redirects to the original URL when accessing a shortened URL
 *     parameters:
 *       - in: path
 *         name: shortUrl
 *         required: true
 *         schema:
 *           type: string
 *         description: The shortened URL identifier
 *     responses:
 *       302:
 *         description: Redirects to the original URL
 *       404:
 *         description: Shortened URL not found
 */
app.get("/:shortUrl", async (req, res) => {
  const shortUrl = await ShortUrl.findOne({ short: req.params.shortUrl });
  if (shortUrl == null) return res.sendStatus(404);

  shortUrl.clicks++;
  shortUrl.save();

  res.redirect(shortUrl.full);
});

/**
 * @swagger
 * /delete/{shortUrl}:
 *   delete:
 *     summary: Delete a shortened URL
 *     description: Deletes a specific shortened URL by its short identifier
 *     parameters:
 *       - in: path
 *         name: shortUrl
 *         required: true
 *         schema:
 *           type: string
 *         description: The shortened URL identifier to delete
 *     responses:
 *       200:
 *         description: URL deleted successfully
 *       404:
 *         description: Shortened URL not found
 */
app.delete("/delete/:shortUrl", async (req, res) => {
  try {
    const shortUrl = await ShortUrl.findOneAndDelete({
      short: req.params.shortUrl,
    });
    if (shortUrl == null)
      return res.status(404).json({ error: "URL not found" });
    res.json({ message: "URL deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Swagger UI available at ${getBaseUrl()}/api-docs`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
