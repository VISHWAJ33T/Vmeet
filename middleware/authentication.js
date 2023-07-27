const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");

const authenticateUser = async (req, res, next) => {
  try {
    let token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token && req.headers.cookie) {
      const cookieArray = req.headers.cookie.split("; ");
      const tokenCookie = cookieArray.find((cookie) => cookie.startsWith("token="));
      if (tokenCookie) {
        token = tokenCookie.split("=")[1];
      }
    }

    if (!token) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .send("Unauthorized: No token provided.");
    }
    console.log("token: " + token);
    const decoded = jwt.verify(token, "jwtsecret123");
    console.log("decoded: " + decoded);
    const user = await User.findOne({ _id: decoded._id, "tokens.token": token });
    console.log("user:" + user);

    if (!user) {
      throw new Error();
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .send("Unauthorized: Invalid token.");
  }
};

module.exports = authenticateUser;
