/**
 * Module dependecies
 */
const express = require("express");
const path = require("path");
const logger = require("morgan");
const sass = require("node-sass-middleware");
const errorHandler = require("errorhandler");
const chalk = require("chalk");
const mongoose = require("mongoose");
const passport = require("passport");
/**
 * Load environment variable from .env for configurations and API Keys
 */
require("dotenv").config();
/**
 * Controllers (routes handlers)
 */
const homeController = require("./controllers/home");
/**
 * Creates Express app
 */
const app = express();
/**
 * MongoDB configurations
 */
mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);
mongoose.set("useNewUrlParser", true);
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on("error", err => {
  console.error(err);
  console.log(
    "%s MongoDB connection error. Please make sure MongoDB is running.",
    chalk.red("✗")
  );
  process.exit();
});
/**
 * Express configurations.
 */
app.set("host", process.env.OPENSHIFT_NODEJS_IP || "0.0.0.0");
app.set("port", process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 3000);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(logger("dev"));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  sass({
    src: path.join(__dirname, "public"),
    dest: path.join(__dirname, "public"),
    outputStyle: "compressed"
  })
);
app.use(
  "/",
  express.static(path.join(__dirname, "public"), { maxAge: 31557600000 })
);
app.use(
  "/js/lib",
  express.static(path.join(__dirname, "node_modules/chart.js/dist"), {
    maxAge: 31557600000
  })
);
app.use(
  "/js/lib",
  express.static(path.join(__dirname, "node_modules/popper.js/dist/umd"), {
    maxAge: 31557600000
  })
);
app.use(
  "/js/lib",
  express.static(path.join(__dirname, "node_modules/bootstrap/dist/js"), {
    maxAge: 31557600000
  })
);
app.use(
  "/js/lib",
  express.static(path.join(__dirname, "node_modules/jquery/dist"), {
    maxAge: 31557600000
  })
);
app.use(
  "/webfonts",
  express.static(
    path.join(__dirname, "node_modules/@fortawesome/fontawesome-free/webfonts"),
    { maxAge: 31557600000 }
  )
);

/**
 * Primary routes
 */
app.get("/", homeController.index);

/**
 * Error Handler
 */
if (process.env.NODE_ENV === "development") {
  app.use(errorHandler());
} else {
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send("Server error");
  });
}
/**
 * Starting Express Server
 */
app.listen(app.get("port"), () => {
  console.log(
    "%s App listening at http://localhost:%d in %s mode",
    chalk.green("✓"),
    app.get("port"),
    app.get("env")
  );
  console.log("Press CTRL - C to stop\n");
});

module.exports = app;
