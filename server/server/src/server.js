const express = require('express');
const session = require('express-session');
require('dotenv').config();
const cors = require('cors');
const gemini = require('./routes/gemi.route');
const app = express();

// CORS configuration
app.use(cors({
  methods: ['GET', 'POST'],
  origin: '*',
  credentials: true,
}));

// Session middleware setup
app.use(session({
  secret: process.env.SESSION_SECRET || '3ab18a626272fd5481e5b69dbee0e4bfb3905af2ee72eaed939b718e9a0702cdf31d93b5a867f067f6e9dded1ddf51351da431adcd2c822e2a139b3e79a61a1d', // Use environment variable for secret
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to false for development (non-HTTPS)
}));

// Middleware to parse JSON request bodies
app.use(express.json());

// Route for gemini
app.use('/gemini', gemini);

app.get("/", (req, res) => {
  res.status(200).send({
    success: true,
    data: `Server Live${process.env.PORT === "production" ? "" : ` - ${process.env.PORT || 5000}`}`,
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('app is on Port ' + port);
});
