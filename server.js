const io = require("socket.io")(process.env.PORT || 3000, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const players = {};
const builds = [];

console.log("NoxiNite Server gestartet auf Port " + (process.env.PORT || 3000));

io.on("connection", (socket) => {
  console.log("Neuer Spieler verbunden:", socket.id);

  // Spieler-Daten initialisieren
  players[socket.id] = {
    x: 0,
    y: 5,
    z: 0,
    rotation: 0
  };

  // Aktuellen Spielzustand an den neuen Spieler senden
  socket.emit("currentPlayers", players);
  socket.emit("currentBuilds", builds);

  // Allen anderen Mitspielern den neuen Spieler melden
  socket.broadcast.emit("newPlayer", {
    id: socket.id,
    transform: players[socket.id]
  });

  // Position & Rotation synchronisieren
  socket.on("playerMove", (data) => {
    if (players[socket.id]) {
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;
      players[socket.id].z = data.z;
      players[socket.id].rotation = data.rotation;

      socket.broadcast.emit("playerMoved", {
        id: socket.id,
        transform: players[socket.id]
      });
    }
  });

  // Bau-Aktionen (z. B. Wände) synchronisieren
  socket.on("placeBuild", (buildData) => {
    builds.push(buildData);
    io.emit("buildPlaced", buildData);
  });

  // Verbindung getrennt
  socket.on("disconnect", () => {
    console.log("Spieler getrennt:", socket.id);
    delete players[socket.id];
    io.emit("playerDisconnected", socket.id);
  });
});
