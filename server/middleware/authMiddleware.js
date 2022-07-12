const jwt = require("jsonwebtoken");
const GoodToken = require("../models/GoodToken");

// middleware to authenticate the user's access token
const authenticateToken = async (req, res, next) => {
  // get auth header
  const authHeader = req.headers["authorization"];

  // check if bearer exists and get token from header (format: Bearer <TOKEN>),
  // split into array by space and retrieve second element to get the token
  const token = authHeader && authHeader.split(" ")[1];
  // check if there was no token
  if (token == null || !authHeader.startsWith("Bearer"))
    return res.status(401).json({ message: "Unauthorized, no token" });

  // verify the token
  try {
    const doc = await GoodToken.findOne({ token });
    if (!doc) return res.status(401).json({ message: "Unauthorized" });
    if (Date.parse(doc.expiresAt) <= Date.now()) {
      // delete token from mongodb if it has expired
      await GoodToken.deleteOne({ token });
      return res.status(401).json({ message: "Token expired" });
    }
  } catch (e) {
    console.log(e);
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    // return a 403 if the token was not valid
    if (err) return res.status(401).json({ message: "Invalid token" });

    // set the userId in the request for the callback function
    req.userId = user.id;
    // call the callback function
    next();
  });
};

module.exports = authenticateToken;
