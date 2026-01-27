const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

const rooms = new Map();

// Palabras por categoría
const wordDatabase = {
  videojuegos: [
    'Mario', 'Zelda', 'Minecraft', 'Fortnite', 'Pokemon', 'Sonic', 'Pacman', 'Tetris',
    'Among Us', 'Roblox', 'GTA', 'FIFA', 'Clash Royale', 'Brawl Stars', 'Free Fire',
    'Call of Duty', 'Valorant', 'League of Legends', 'Overwatch', 'Apex Legends',
    'Resident Evil', 'God of War', 'Halo', 'Doom', 'Cyberpunk', 'Witcher', 'Skyrim',
    'Dark Souls', 'Elden Ring', 'Bloodborne', 'Final Fantasy', 'Dragon Ball', 'Naruto',
    'Street Fighter', 'Mortal Kombat', 'Tekken', 'Smash Bros', 'Animal Crossing'
  ],
  famosos: [
    'Messi', 'Ronaldo', 'Shakira', 'Bad Bunny', 'Dua Lipa', 'The Weeknd', 'Drake',
    'Taylor Swift', 'Billie Eilish', 'Justin Bieber', 'Ariana Grande', 'Ed Sheeran',
    'Rihanna', 'Beyoncé', 'Kanye West', 'Eminem', 'Post Malone', 'Travis Scott',
    'Daddy Yankee', 'J Balvin', 'Maluma', 'Ozuna', 'Karol G', 'Nicki Minaj',
    'Cardi B', 'Rosalía', 'Dwayne Johnson', 'Tom Cruise', 'Will Smith', 'Leonardo DiCaprio',
    'Robert Downey Jr', 'Chris Hemsworth', 'Scarlett Johansson', 'Jennifer Lawrence',
    'Zendaya', 'Tom Holland', 'Timothée Chalamet', 'Margot Robbie'
  ],
  series: [
    'Breaking Bad', 'Stranger Things', 'The Walking Dead', 'Game of Thrones', 'Friends',
    'The Office', 'Squid Game', 'Wednesday', 'The Last of Us', 'The Mandalorian',
    'The Boys', 'Peaky Blinders', 'Dark', 'Money Heist', 'Narcos', 'Black Mirror',
    'The Witcher', 'Vikings', 'Sherlock', 'The Crown', 'Bridgerton', 'Ozark',
    'Better Call Saul', 'Succession', 'The Bear', 'Rick and Morty', 'South Park',
    'Family Guy', 'The Simpsons', 'Avatar', 'Arcane', 'Attack on Titan', 'One Piece',
    'Death Note', 'Demon Slayer', 'My Hero Academia', 'Jujutsu Kaisen', 'Chainsaw Man'
  ],
  personajes_animados: [
    'Mickey Mouse', 'Bugs Bunny', 'Bob Esponja', 'Homero Simpson', 'Pikachu', 'Goku',
    'Naruto', 'Ash Ketchum', 'Batman', 'Superman', 'Spider-Man', 'Iron Man',
    'Elsa', 'Anna', 'Woody', 'Buzz Lightyear', 'Shrek', 'Donkey', 'Po', 'Sonic',
    'Mario', 'Luigi', 'Doraemon', 'Shin Chan', 'Nobita', 'Peppa Pig', 'Dora',
    'Tom', 'Jerry', 'Scooby Doo', 'Garfield', 'Snoopy', 'Patrick', 'Squidward',
    'Luffy', 'Zoro', 'Light Yagami', 'Eren Yeager', 'Tanjiro'
  ],
  deportes: [
    'Fútbol', 'Baloncesto', 'Tenis', 'Volleyball', 'Béisbol', 'Golf', 'Rugby',
    'Hockey', 'Cricket', 'Boxeo', 'MMA', 'Natación', 'Atletismo', 'Ciclismo',
    'Surf', 'Skateboarding', 'Snowboard', 'Esquí', 'Patinaje', 'Gimnasia',
    'Esgrima', 'Judo', 'Karate', 'Taekwondo', 'Lucha Libre', 'Halterofilia',
    'Crossfit', 'Parkour', 'Escalada', 'Polo', 'Waterpolo', 'Handball', 'Badminton',
    'Ping Pong', 'Bowling', 'Billar', 'Dardos', 'Ajedrez'
  ],
  paises: [
    'Argentina', 'Brasil', 'México', 'España', 'Estados Unidos', 'Canadá', 'Francia',
    'Italia', 'Alemania', 'Inglaterra', 'Portugal', 'Holanda', 'Bélgica', 'Suiza',
    'Suecia', 'Noruega', 'Dinamarca', 'Finlandia', 'Polonia', 'Rusia', 'Ucrania',
    'Turquía', 'Grecia', 'Egipto', 'Sudáfrica', 'Marruecos', 'Nigeria', 'Kenia',
    'Japón', 'China', 'Corea del Sur', 'India', 'Tailandia', 'Vietnam', 'Indonesia',
    'Australia', 'Nueva Zelanda', 'Colombia', 'Chile', 'Perú', 'Uruguay', 'Venezuela'
  ],
  peliculas: [
    'Titanic', 'Avatar', 'Avengers', 'Star Wars', 'Harry Potter', 'El Padrino',
    'Forrest Gump', 'Inception', 'Interstellar', 'The Matrix', 'Gladiator', 'Joker',
    'The Dark Knight', 'Pulp Fiction', 'Fight Club', 'Shawshank Redemption', 'Parasite',
    'Toy Story', 'Coco', 'Up', 'Frozen', 'Moana', 'Encanto', 'The Lion King',
    'Finding Nemo', 'Shrek', 'Jurassic Park', 'E.T.', 'Back to the Future', 'Indiana Jones',
    'Pirates of the Caribbean', 'Lord of the Rings', 'The Hobbit', 'Spider-Man',
    'Iron Man', 'Black Panther', 'Guardians of the Galaxy', 'Deadpool', 'John Wick'
  ],
  objetos: [
    'Celular', 'Computadora', 'Reloj', 'Auriculares', 'Teclado', 'Mouse', 'Monitor',
    'Cámara', 'Micrófono', 'Televisor', 'Control Remoto', 'Consola', 'Joystick',
    'Silla', 'Mesa', 'Lámpara', 'Ventilador', 'Aire Acondicionado', 'Heladera',
    'Microondas', 'Licuadora', 'Cafetera', 'Tostadora', 'Aspiradora', 'Plancha',
    'Secador de Pelo', 'Cepillo de Dientes', 'Peine', 'Espejo', 'Tijeras', 'Cuchillo',
    'Tenedor', 'Cuchara', 'Plato', 'Vaso', 'Botella', 'Mochila', 'Billetera', 'Llavero'
  ]
};

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  socket.on('createRoom', (playerName) => {
    const roomCode = generateRoomCode();
    const room = {
      code: roomCode,
      host: socket.id,
      players: [{
        id: socket.id,
        name: playerName,
        isHost: true,
        word: null,
        isImpostor: false,
        isAlive: true,
        hasVoted: false,
        votedFor: null
      }],
      config: {
        category: 'videojuegos',
        impostorCount: 1
      },
      gameState: 'lobby', // lobby, playing, voting, results, ended
      currentWord: null,
      votingOrder: [],
      currentVoterIndex: 0,
      votes: {},
      roundNumber: 1
    };
    
    rooms.set(roomCode, room);
    socket.join(roomCode);
    socket.emit('roomCreated', { roomCode, room });
    io.to(roomCode).emit('playerListUpdate', room.players);
  });

  socket.on('joinRoom', ({ roomCode, playerName }) => {
    const room = rooms.get(roomCode);
    
    if (!room) {
      socket.emit('error', 'Sala no encontrada');
      return;
    }

    if (room.gameState !== 'lobby') {
      socket.emit('error', 'La partida ya comenzó');
      return;
    }

    if (room.players.length >= 12) {
      socket.emit('error', 'Sala llena');
      return;
    }

    const player = {
      id: socket.id,
      name: playerName,
      isHost: false,
      word: null,
      isImpostor: false,
      isAlive: true,
      hasVoted: false,
      votedFor: null
    };

    room.players.push(player);
    socket.join(roomCode);
    socket.emit('roomJoined', { roomCode, room });
    io.to(roomCode).emit('playerListUpdate', room.players);
  });

  socket.on('updateConfig', ({ roomCode, config }) => {
    const room = rooms.get(roomCode);
    if (!room || room.host !== socket.id) return;
    
    room.config = config;
    io.to(roomCode).emit('configUpdate', config);
  });

  socket.on('startGame', (roomCode) => {
    const room = rooms.get(roomCode);
    if (!room || room.host !== socket.id) return;
    
    if (room.players.length < 4) {
      socket.emit('error', 'Se necesitan al menos 4 jugadores');
      return;
    }

    // Seleccionar palabra
    const words = wordDatabase[room.config.category];
    room.currentWord = words[Math.floor(Math.random() * words.length)];

    // Seleccionar impostores aleatoriamente
    const playerIndices = room.players.map((_, i) => i);
    const shuffledIndices = shuffleArray(playerIndices);
    const impostorIndices = shuffledIndices.slice(0, room.config.impostorCount);

    room.players.forEach((player, index) => {
      player.isAlive = true;
      player.hasVoted = false;
      player.votedFor = null;
      
      if (impostorIndices.includes(index)) {
        player.isImpostor = true;
        player.word = null;
      } else {
        player.isImpostor = false;
        player.word = room.currentWord;
      }
    });

    room.gameState = 'playing';
    room.roundNumber = 1;
    
    io.to(roomCode).emit('gameStarted');
    
    // Enviar rol individual a cada jugador
    room.players.forEach(player => {
      io.to(player.id).emit('yourRole', {
        isImpostor: player.isImpostor,
        word: player.word
      });
    });
  });

  socket.on('startVoting', (roomCode) => {
    const room = rooms.get(roomCode);
    if (!room || room.host !== socket.id) return;

    const alivePlayers = room.players.filter(p => p.isAlive);
    room.votingOrder = shuffleArray(alivePlayers.map(p => p.id));
    room.currentVoterIndex = 0;
    room.votes = {};
    
    alivePlayers.forEach(p => {
      p.hasVoted = false;
      p.votedFor = null;
    });

    room.gameState = 'voting';
    io.to(roomCode).emit('votingStarted', {
      votingOrder: room.votingOrder.map(id => {
        const player = room.players.find(p => p.id === id);
        return { id: player.id, name: player.name };
      }),
      currentVoterIndex: 0
    });
  });

  socket.on('castVote', ({ roomCode, votedForId }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    const voter = room.players.find(p => p.id === socket.id);
    if (!voter || !voter.isAlive || voter.hasVoted) return;

    const currentVoterId = room.votingOrder[room.currentVoterIndex];
    if (currentVoterId !== socket.id) return;

    voter.hasVoted = true;
    voter.votedFor = votedForId;
    
    if (!room.votes[votedForId]) {
      room.votes[votedForId] = 0;
    }
    room.votes[votedForId]++;

    io.to(roomCode).emit('voteCast', {
      voterId: socket.id,
      voterName: voter.name,
      votedForId: votedForId,
      votedForName: room.players.find(p => p.id === votedForId).name,
      votes: room.votes
    });

    room.currentVoterIndex++;

    if (room.currentVoterIndex < room.votingOrder.length) {
      io.to(roomCode).emit('nextVoter', {
        currentVoterIndex: room.currentVoterIndex,
        voterId: room.votingOrder[room.currentVoterIndex]
      });
    } else {
      // Votación terminada
      finishVoting(room, roomCode);
    }
  });

  function finishVoting(room, roomCode) {
    let maxVotes = 0;
    let eliminatedId = null;

    for (const [playerId, voteCount] of Object.entries(room.votes)) {
      if (voteCount > maxVotes) {
        maxVotes = voteCount;
        eliminatedId = playerId;
      }
    }

    const eliminated = room.players.find(p => p.id === eliminatedId);
    eliminated.isAlive = false;

    io.to(roomCode).emit('playerEliminated', {
      playerId: eliminatedId,
      playerName: eliminated.name,
      wasImpostor: eliminated.isImpostor,
      votes: room.votes
    });

    // Verificar condiciones de victoria
    setTimeout(() => {
      const alivePlayers = room.players.filter(p => p.isAlive);
      const aliveImpostors = alivePlayers.filter(p => p.isImpostor).length;
      const aliveInnocents = alivePlayers.filter(p => !p.isImpostor).length;

      if (aliveImpostors === 0) {
        // Ganaron los inocentes
        room.gameState = 'ended';
        io.to(roomCode).emit('gameEnded', {
          winner: 'innocents',
          players: room.players,
          word: room.currentWord
        });
      } else if (aliveImpostors >= aliveInnocents) {
        // Ganaron los impostores
        room.gameState = 'ended';
        io.to(roomCode).emit('gameEnded', {
          winner: 'impostors',
          players: room.players,
          word: room.currentWord
        });
      } else {
        // Continuar jugando
        room.gameState = 'playing';
        room.roundNumber++;
        io.to(roomCode).emit('continueGame', {
          alivePlayers: alivePlayers.map(p => ({ id: p.id, name: p.name }))
        });
      }
    }, 3000);
  }

  socket.on('resetGame', (roomCode) => {
    const room = rooms.get(roomCode);
    if (!room || room.host !== socket.id) return;

    room.players.forEach(player => {
      player.word = null;
      player.isImpostor = false;
      player.isAlive = true;
      player.hasVoted = false;
      player.votedFor = null;
    });

    room.gameState = 'lobby';
    room.currentWord = null;
    room.votingOrder = [];
    room.currentVoterIndex = 0;
    room.votes = {};
    room.roundNumber = 1;

    io.to(roomCode).emit('gameReset');
    io.to(roomCode).emit('playerListUpdate', room.players);
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
    
    rooms.forEach((room, roomCode) => {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        
        if (room.players.length === 0) {
          rooms.delete(roomCode);
        } else {
          if (room.host === socket.id && room.players.length > 0) {
            room.host = room.players[0].id;
            room.players[0].isHost = true;
          }
          io.to(roomCode).emit('playerListUpdate', room.players);
        }
      }
    });
  });
});

http.listen(PORT, () => {
  console.log(`🎮 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📱 Los jugadores pueden conectarse desde otros dispositivos usando tu IP local`);
});
