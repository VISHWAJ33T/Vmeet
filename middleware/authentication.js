const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");

const authenticateUser = async (req, res, next) => {
  try {
    let token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token && req.headers.cookie) {
      const cookieArray = req.headers.cookie.split("; ");
      const tokenCookie = cookieArray.find((cookie) =>
        cookie.startsWith("token=")
      );
      if (tokenCookie) {
        token = tokenCookie.split("=")[1];
      }
    }

    if (!token) {
      return res.status(StatusCodes.UNAUTHORIZED).redirect("/login");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // const decoded = jwt.verify(token, "jwtsecret123");
    // console.log(decoded);
    // Modify the following line to retrieve the user based on the decoded token data
    const user = await User.findOne({
      _id: decoded.userId,
      // _id: decoded._id,
      // "tokens.token": token,
    });

    if (!user) {
      throw new Error();
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    return res.status(StatusCodes.UNAUTHORIZED).redirect("/login");
    // .send("Unauthorized: Invalid token.");
  }
};

module.exports = authenticateUser;
