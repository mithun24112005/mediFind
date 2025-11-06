//create server
const express = require("express");
const cookieParser = require("cookie-parser");
// const authRoutes = require('./routes/auth.routes');
const cors = require('cors');
const app = express();
// app.use(cors({
//   origin: 'http://localhost:5173', // Replace with your frontend URL
//   credentials: true, // Allow cookies to be sent
// }));
app.use(cookieParser());


app.use(express.json());


// Root route
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// app.use('/api/auth', authRoutes);

module.exports = app;