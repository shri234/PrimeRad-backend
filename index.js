const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const logger = require("./config/logger");
const { expiryDateCronSchedule } = require("./config/cronUtil");
require("dotenv").config();
const env = require("./config/validateEnv");
const cors = require("cors");
const auth = require("./routes/authentication");
const dashboard = require("./routes/dashboard");
const session = require("./routes/session");
const moduleRoutes = require("./routes/module");
const pathology = require("./routes/pathology");
const subscription = require("./routes/subscription");
const observation = require("./routes/observation");
const masterylevels = require("./routes/masterylevels");
const faculty = require("./routes/faculty");
const assessment = require("./routes/assessment");
const reviews = require("./routes/reviews");
const playbackprogress = require("./routes/playbackprogress");
const swaggerUi = require("swagger-ui-express");
const swaggerDocs = require("./config/swaggerConfig");

const app = express();
app.use(express.json());
app.use(cookieParser());
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://yourdomain.com",
  "https://heroic-crisp-76fe7e.netlify.app",
  "https://primerad-subscription.netlify.app",
  "https://wj0w04hv-3000.inc1.devtunnels.ms/",
];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {});
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

connectDB();

expiryDateCronSchedule();

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/auth", auth);
app.use("/api/dashboard", dashboard);
app.use("/api/sessions", session);
app.use("/api/playback-progress", playbackprogress);
app.use("/api/modules", moduleRoutes);
app.use("/api/pathologies", pathology);
app.use("/api/subscription", subscription);
app.use("/api/observation", observation);
app.use("/api/masterylevel", masterylevels);
app.use("/api/playback-progress", playbackprogress);
app.use("/api/faculty", faculty);
app.use("/api/assessments", assessment);
app.use("/api/reviews", reviews);

app.use((err, req, res, next) => {
  logger.error(
    `${err.status || 500} - ${err.message} - ${req.originalUrl} - ${
      req.method
    } - ${req.ip}`
  );
  res.status(err.status || 500).send("Internal Server Error");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
