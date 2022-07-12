const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const usersRouter = require("./routes/users");
const postsRouter = require("./routes/posts");

const app = express();

const port = process.env.PORT || 5000;

app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());

app.use("/api/users", usersRouter);
app.use("/api/posts", postsRouter);

const connectionString = process.env.DB_CONNECTION_STRING;
mongoose.connect(
  connectionString,
  {},
  () => {
    console.log("Connected to MongoDB");
  },
  (error) => {
    console.log("Error connecting to MongoDB: " + error);
  }
);

app.listen(port, () => console.log(`Server started at port ${port}`));
