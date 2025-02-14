"use strict";
const { Server } = require("socket.io"); // Use CommonJS syntax
const { default: axios } = require("axios");

module.exports = {
  register(/*{ strapi }*/) {},

  bootstrap(/*{ strapi }*/) {
    const io = new Server(strapi.server.httpServer, {
      cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true,
      },
    });

    io.on("connection", function (socket) {

      socket.on("join", async ({ username }) => {
        console.log("user connected");
        console.log("username is ", username);
        if (username) {
          socket.join("group");
          socket.emit("welcome", {
            user: "bot",
            text: `${username}, Welcome to the group chat`,
            userData: username,
          });
          let strapiData = {
            data: {
              users: username,
              socketid: socket.id,
            },
          };
          console.log(strapiData)
          await axios
            .post("http://localhost:1337/api/active-users", strapiData)
            .then(async (e) => {
              socket.emit("roomData", { done: "true" });
            })
            .catch((e) => {
              if (e.message == "Request failed with status code 400") {
                socket.emit("roomData", { done: "existing" });
              }
            });
        } else {
          console.log("e no work");
        }
      });

      socket.on("sendMessage", async (data) => {
        const strapiData = {
          data: {
            user: data.user,
            message: data.message,
          },
        };

        await axios
          .post("http://localhost:1337/api/messages", strapiData)
          .then(() => {
            socket.broadcast.to("group").emit("message", {
              user: data.username,
              text: data.message,
            });
          })
          .catch((e) => console.log("error", e.message));
      });
    });
  },
};