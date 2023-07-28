require("dotenv").config();
const path = require("path");
const express = require("express");
const http = require("http");
const moment = require("moment");
const socketio = require("socket.io");
const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const connectDB = require("./db/connect");
const authenticateUser = require("./middleware/authentication");
const authRouter = require("./routes/auth");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/signup", (req, res) => {
  res.sendFile("signup.html", { root: "public" });
});
app.get("/login", (req, res) => {
  res.sendFile("login.html", { root: "public" });
});
// app.get("/room.html", (req, res) => {
app.get("/room", authenticateUser, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "room.html"));
});
app.use(express.static(path.join(__dirname, "public")));
app.use("/auth", authRouter);

const io = socketio(server);

let rooms = {};
let socketroom = {};
let socketname = {};
let micSocket = {};
let videoSocket = {};
let roomBoard = {};

io.on("connect", (socket) => {
  socket.on("join room", (roomid, username) => {
    socket.join(roomid);
    socketroom[socket.id] = roomid;
    socketname[socket.id] = username;
    micSocket[socket.id] = "on";
    videoSocket[socket.id] = "on";

    if (rooms[roomid] && rooms[roomid].length > 0) {
      rooms[roomid].push(socket.id);
      socket
        .to(roomid)
        .emit(
          "joined",
          `${username} joined the room.`,
          "Bot",
          moment().format("h:mm a")
        );
      io.to(socket.id).emit(
        "join room",
        rooms[roomid].filter((pid) => pid != socket.id),
        socketname,
        micSocket,
        videoSocket
      );
    } else {
      rooms[roomid] = [socket.id];
      io.to(socket.id).emit("join room", null, null, null, null);
    }

    io.to(roomid).emit("user count", rooms[roomid].length);
  });

  socket.on("action", (msg) => {
    if (msg == "mute") micSocket[socket.id] = "off";
    else if (msg == "unmute") micSocket[socket.id] = "on";
    else if (msg == "videoon") videoSocket[socket.id] = "on";
    else if (msg == "videooff") videoSocket[socket.id] = "off";

    socket.to(socketroom[socket.id]).emit("action", msg, socket.id);
  });

  socket.on("video-offer", (offer, sid) => {
    socket
      .to(sid)
      .emit(
        "video-offer",
        offer,
        socket.id,
        socketname[socket.id],
        micSocket[socket.id],
        videoSocket[socket.id]
      );
  });

  socket.on("video-answer", (answer, sid) => {
    socket.to(sid).emit("video-answer", answer, socket.id);
  });

  socket.on("new icecandidate", (candidate, sid) => {
    socket.to(sid).emit("new icecandidate", candidate, socket.id);
  });

  socket.on("message", (msg, username, roomid) => {
    io.to(roomid).emit("message", msg, username, moment().format("h:mm a"));
  });

  socket.on("getCanvas", () => {
    if (roomBoard[socketroom[socket.id]])
      socket.emit("getCanvas", roomBoard[socketroom[socket.id]]);
  });

  socket.on("draw", (newx, newy, prevx, prevy, color, size) => {
    socket
      .to(socketroom[socket.id])
      .emit("draw", newx, newy, prevx, prevy, color, size);
  });

  socket.on("clearBoard", () => {
    socket.to(socketroom[socket.id]).emit("clearBoard");
  });

  socket.on("store canvas", (url) => {
    roomBoard[socketroom[socket.id]] = url;
  });

  socket.on("disconnect", () => {
    if (!socketroom[socket.id]) return;
    socket
      .to(socketroom[socket.id])
      .emit(
        "joined",
        `${socketname[socket.id]} left the chat.`,
        `Bot`,
        moment().format("h:mm a")
      );
    socket.to(socketroom[socket.id]).emit("remove peer", socket.id);
    var index = rooms[socketroom[socket.id]].indexOf(socket.id);
    rooms[socketroom[socket.id]].splice(index, 1);
    io.to(socketroom[socket.id]).emit(
      "user count",
      rooms[socketroom[socket.id]].length
    );
    delete socketroom[socket.id];
    console.log("--------------------");
    console.log(rooms[socketroom[socket.id]]);

    //toDo: push socket.id out of rooms
  });
});

const start = async () => {
  try {
    const mongoURI =
      // "mongodb+srv://VISHWAJEET:Qwerty123@cluster0.8g7q2zy.mongodb.net/?retryWrites=true&w=majority";
      process.env.MONGO_URI;
    // "mongodb://127.0.0.1:27017";
    await connectDB(mongoURI);
    server.listen(PORT, () =>
      console.log(`Server is up and running on port ${PORT}`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
