const express = require("express");
const path = require("path");
const router = express.Router();
const { signup, login } = require("../controllers/auth");
// const app = express();
// app.use(express.static(path.join(__dirname, "public")))
router.post("/signup", signup);
router.post("/login", login);

// router.get("/login", (req, res) => {
//   res.sendFile("login.html", { root: "public" });
// });
// router.get("/signup", (req, res) => {
//   res.sendFile("signup.html", { root: "public" });
// });
module.exports = router;
