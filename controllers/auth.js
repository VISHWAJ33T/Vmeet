const User = require("../models/User");
const { StatusCodes } = require("http-status-codes");

const signup = async (req, res) => {
  console.log("Received signup request");
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: "Please provide all required fields.",
    });
  }

  try {
    const existingUser = await User.findOne({ name });
    if (existingUser) {
      return res.status(StatusCodes.CONFLICT).json({
        error: "User already exists.",
      });
    }

    const user = await User.create({ name, password });
    console.log("User created:", user);

    const token = user.createJWT();
    console.log("JWT created:", token);

    return res.status(StatusCodes.CREATED).json({
      user: { name: user.name },
      token,
      created: true,
    });
  } catch (error) {
    console.error("Error during signup:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Something went wrong.",
    });
  }
};

const login = async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: "Please provide a valid username and password.",
    });
  }

  try {
    const user = await User.findOne({ name });
    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: "Invalid username or password.",
      });
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: "Invalid username or password.",
      });
    }

    const token = user.createJWT();
    console.log(token);
    res.status(StatusCodes.OK).json({
      user: { name: user.name },
      token,
    });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Something went wrong.",
    });
  }
};

module.exports = {
  signup,
  login,
};
