const express = require("express");
const app = express();

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
