// Base de datos de palabras por categoría
const wordDatabase = {
    videojuegos: [
        'Mario', 'Zelda', 'Minecraft', 'Fortnite', 'Pokemon', 'Sonic', 'Pacman', 'Tetris',
        'Among Us', 'Roblox', 'GTA', 'FIFA', 'Clash Royale', 'Brawl Stars', 'Free Fire',
        'Call of Duty', 'Valorant', 'League of Legends', 'Overwatch', 'Apex Legends',
        'Resident Evil', 'God of War', 'Halo', 'Doom', 'Cyberpunk', 'Witcher', 'Skyrim',
        'Dark Souls', 'Elden Ring', 'Bloodborne', 'Final Fantasy', 'Street Fighter',
        'Mortal Kombat', 'Tekken', 'Smash Bros', 'Animal Crossing', 'Stardew Valley',
        'Terraria', 'Hollow Knight', 'Celeste', 'Undertale', 'Cuphead', 'Fall Guys',
        'Rocket League', 'Rainbow Six', 'Counter Strike', 'Diablo', 'World of Warcraft',
        'Destiny', 'Borderlands', 'Bioshock', 'Portal', 'Half Life', 'Left 4 Dead'
    ],
    famosos: [
        'Messi', 'Ronaldo', 'Shakira', 'Bad Bunny', 'Dua Lipa', 'The Weeknd', 'Drake',
        'Taylor Swift', 'Billie Eilish', 'Justin Bieber', 'Ariana Grande', 'Ed Sheeran',
        'Rihanna', 'Beyonce', 'Kanye West', 'Eminem', 'Post Malone', 'Travis Scott',
        'Daddy Yankee', 'J Balvin', 'Maluma', 'Ozuna', 'Karol G', 'Nicki Minaj',
        'Cardi B', 'Rosalia', 'Dwayne Johnson', 'Tom Cruise', 'Will Smith', 'DiCaprio',
        'Robert Downey Jr', 'Chris Hemsworth', 'Scarlett Johansson', 'Jennifer Lawrence',
        'Zendaya', 'Tom Holland', 'Timothee Chalamet', 'Margot Robbie', 'Keanu Reeves',
        'Ryan Reynolds', 'Chris Evans', 'Gal Gadot', 'Jason Momoa', 'Henry Cavill',
        'Selena Gomez', 'Demi Lovato', 'Miley Cyrus', 'Harry Styles', 'BTS', 'Blackpink',
        'Lady Gaga', 'Bruno Mars', 'Adele', 'Coldplay', 'Imagine Dragons'
    ],
    series: [
        'Breaking Bad', 'Stranger Things', 'The Walking Dead', 'Game of Thrones', 'Friends',
        'The Office', 'Squid Game', 'Wednesday', 'The Last of Us', 'The Mandalorian',
        'The Boys', 'Peaky Blinders', 'Dark', 'La Casa de Papel', 'Narcos', 'Black Mirror',
        'The Witcher', 'Vikings', 'Sherlock', 'The Crown', 'Bridgerton', 'Ozark',
        'Better Call Saul', 'Succession', 'The Bear', 'Rick and Morty', 'South Park',
        'Family Guy', 'Los Simpson', 'Arcane', 'Attack on Titan', 'One Piece',
        'Death Note', 'Demon Slayer', 'My Hero Academia', 'Jujutsu Kaisen', 'Chainsaw Man',
        'Euphoria', 'You', 'Elite', 'Outer Banks', 'Cobra Kai', 'Lucifer',
        'House of the Dragon', 'Rings of Power', 'Andor', 'Loki', 'WandaVision',
        'Ted Lasso', 'Severance', 'White Lotus', 'Yellowjackets', 'Only Murders'
    ],
    anime: [
        'Naruto', 'Dragon Ball', 'One Piece', 'Attack on Titan', 'Death Note',
        'Demon Slayer', 'My Hero Academia', 'Jujutsu Kaisen', 'Chainsaw Man', 'Spy x Family',
        'Fullmetal Alchemist', 'Hunter x Hunter', 'One Punch Man', 'Mob Psycho',
        'Tokyo Revengers', 'Bleach', 'Fairy Tail', 'Black Clover', 'Dr Stone',
        'Vinland Saga', 'Haikyuu', 'Kuroko no Basket', 'Slam Dunk', 'Captain Tsubasa',
        'Cowboy Bebop', 'Evangelion', 'Steins Gate', 'Code Geass', 'Tokyo Ghoul',
        'Parasyte', 'Erased', 'Promised Neverland', 'Made in Abyss', 'Violet Evergarden',
        'Your Name', 'Spirited Away', 'Howls Moving Castle', 'Akira', 'Ghost in the Shell',
        'Sword Art Online', 'Re Zero', 'Konosuba', 'Overlord', 'No Game No Life',
        'Toradora', 'Kaguya Sama', 'Bocchi the Rock', 'Oshi no Ko', 'Frieren',
        'Cyberpunk Edgerunners', 'Dandadan', 'Solo Leveling', 'Blue Lock', 'Jigokuraku'
    ],
    peliculas: [
        'Titanic', 'Avatar', 'Avengers', 'Star Wars', 'Harry Potter', 'El Padrino',
        'Forrest Gump', 'Inception', 'Interstellar', 'Matrix', 'Gladiator', 'Joker',
        'The Dark Knight', 'Pulp Fiction', 'Fight Club', 'Shawshank Redemption', 'Parasite',
        'Toy Story', 'Coco', 'Up', 'Frozen', 'Moana', 'Encanto', 'El Rey Leon',
        'Buscando a Nemo', 'Shrek', 'Jurassic Park', 'E.T.', 'Volver al Futuro',
        'Indiana Jones', 'Piratas del Caribe', 'El Senor de los Anillos', 'El Hobbit',
        'Spider-Man', 'Iron Man', 'Black Panther', 'Guardianes de la Galaxia', 'Deadpool',
        'John Wick', 'Rapidos y Furiosos', 'Mision Imposible', 'James Bond', 'Rocky',
        'Terminator', 'Alien', 'Depredador', 'Duro de Matar', 'Scarface',
        'Buenos Muchachos', 'Casino', 'Los Infiltrados', 'El Lobo de Wall Street',
        'Oppenheimer', 'Barbie', 'Top Gun', 'Dune', 'Todo en Todas Partes'
    ],
    musica: [
        'Rock', 'Pop', 'Reggaeton', 'Hip Hop', 'Trap', 'EDM', 'Jazz', 'Blues',
        'Metal', 'Punk', 'Indie', 'K-Pop', 'Cumbia', 'Salsa', 'Bachata', 'Merengue',
        'Tango', 'Folklore', 'Country', 'R&B', 'Soul', 'Disco', 'Techno', 'House',
        'Dubstep', 'Drum and Bass', 'Reggae', 'Ska', 'Grunge', 'Emo', 'Hardcore',
        'Clasica', 'Opera', 'Gospel', 'Funk', 'Lo-Fi', 'Synthwave', 'Vaporwave',
        'Phonk', 'Corridos', 'Banda', 'Norteno', 'Ranchera', 'Vallenato', 'Champeta',
        'Dembow', 'Afrobeat', 'Dancehall', 'Grime', 'Drill', 'Latin Pop', 'Urbano',
        'Acustico', 'Unplugged', 'Remix'
    ],
    deportes: [
        'Futbol', 'Basquet', 'Tenis', 'Voley', 'Beisbol', 'Golf', 'Rugby',
        'Hockey', 'Cricket', 'Boxeo', 'MMA', 'Natacion', 'Atletismo', 'Ciclismo',
        'Surf', 'Skate', 'Snowboard', 'Esqui', 'Patinaje', 'Gimnasia',
        'Esgrima', 'Judo', 'Karate', 'Taekwondo', 'Lucha Libre', 'Halterofilia',
        'Crossfit', 'Parkour', 'Escalada', 'Polo', 'Waterpolo', 'Handball', 'Badminton',
        'Ping Pong', 'Bowling', 'Billar', 'Dardos', 'Ajedrez', 'Poker', 'eSports',
        'Formula 1', 'NASCAR', 'Motocross', 'Rally', 'Karting', 'Triatlon', 'Maraton',
        'Clavados', 'Remo', 'Vela', 'Kayak', 'Rafting', 'Paracaidismo', 'Bungee'
    ],
    paises: [
        'Argentina', 'Brasil', 'Mexico', 'Espana', 'Estados Unidos', 'Canada', 'Francia',
        'Italia', 'Alemania', 'Inglaterra', 'Portugal', 'Holanda', 'Belgica', 'Suiza',
        'Suecia', 'Noruega', 'Dinamarca', 'Finlandia', 'Polonia', 'Rusia', 'Ucrania',
        'Turquia', 'Grecia', 'Egipto', 'Sudafrica', 'Marruecos', 'Nigeria', 'Kenia',
        'Japon', 'China', 'Corea del Sur', 'India', 'Tailandia', 'Vietnam', 'Indonesia',
        'Australia', 'Nueva Zelanda', 'Colombia', 'Chile', 'Peru', 'Uruguay', 'Venezuela',
        'Ecuador', 'Bolivia', 'Paraguay', 'Cuba', 'Puerto Rico', 'Costa Rica', 'Panama',
        'Guatemala', 'Honduras', 'El Salvador', 'Nicaragua', 'Republica Dominicana',
        'Jamaica', 'Haiti', 'Trinidad y Tobago', 'Islandia', 'Irlanda', 'Escocia'
    ],
    comidas: [
        'Pizza', 'Hamburguesa', 'Tacos', 'Sushi', 'Asado', 'Empanadas', 'Pasta',
        'Paella', 'Ceviche', 'Ramen', 'Pho', 'Curry', 'Kebab', 'Falafel', 'Hummus',
        'Burrito', 'Nachos', 'Hot Dog', 'Sandwich', 'Croissant', 'Bagel', 'Waffle',
        'Pancakes', 'Omelette', 'Milanesa', 'Choripan', 'Lomito', 'Alfajor',
        'Arepa', 'Pupusa', 'Tamales', 'Enchiladas', 'Quesadilla', 'Pozole', 'Birria',
        'Asado', 'Pollo Frito', 'Costillas', 'Brisket', 'Alitas', 'Nuggets',
        'Fish and Chips', 'Pad Thai', 'Dim Sum', 'Spring Rolls', 'Gyoza', 'Tempura',
        'Teriyaki', 'Bibimbap', 'Kimchi', 'Poke Bowl', 'Acai Bowl', 'Shawarma',
        'Gyros', 'Moussaka', 'Lasagna', 'Ravioli', 'Risotto', 'Gnocchi'
    ],
    marcas: [
        'Nike', 'Adidas', 'Apple', 'Samsung', 'Google', 'Microsoft', 'Amazon', 'Netflix',
        'Spotify', 'Disney', 'Coca Cola', 'Pepsi', 'McDonalds', 'Burger King', 'Starbucks',
        'Tesla', 'Mercedes', 'BMW', 'Ferrari', 'Lamborghini', 'Porsche', 'Audi', 'Toyota',
        'Honda', 'Volkswagen', 'Ford', 'Chevrolet', 'Jeep', 'Harley Davidson',
        'Louis Vuitton', 'Gucci', 'Prada', 'Chanel', 'Versace', 'Balenciaga', 'Supreme',
        'Zara', 'H&M', 'Uniqlo', 'Levis', 'Converse', 'Vans', 'Puma', 'New Balance',
        'PlayStation', 'Xbox', 'Nintendo', 'Steam', 'Epic Games', 'Twitch', 'YouTube',
        'TikTok', 'Instagram', 'Twitter', 'Facebook', 'WhatsApp', 'Snapchat', 'Discord',
        'Uber', 'Airbnb', 'PayPal', 'Visa', 'Mastercard'
    ],
    apps: [
        'WhatsApp', 'Instagram', 'TikTok', 'YouTube', 'Twitter', 'Facebook', 'Snapchat',
        'Discord', 'Telegram', 'Reddit', 'Pinterest', 'LinkedIn', 'Tinder', 'Bumble',
        'Spotify', 'Netflix', 'Disney Plus', 'HBO Max', 'Prime Video', 'Twitch',
        'Google Maps', 'Waze', 'Uber', 'Rappi', 'PedidosYa', 'Mercado Libre', 'Amazon',
        'Shein', 'AliExpress', 'eBay', 'PayPal', 'Mercado Pago', 'Binance', 'Coinbase',
        'Duolingo', 'Notion', 'Trello', 'Slack', 'Zoom', 'Teams', 'Google Meet',
        'ChatGPT', 'Canva', 'Photoshop', 'Premiere', 'CapCut', 'InShot', 'VSCO',
        'Lightroom', 'Procreate', 'Figma', 'Blender', 'Unity', 'Unreal Engine',
        'OBS', 'Streamlabs', 'Steam', 'Epic Games', 'Battle.net', 'Origin'
    ],
    youtubers: [
        'PewDiePie', 'MrBeast', 'Markiplier', 'Jacksepticeye', 'KSI', 'Logan Paul',
        'Jake Paul', 'David Dobrik', 'Emma Chamberlain', 'James Charles', 'Jeffree Star',
        'Ninja', 'Shroud', 'xQc', 'Pokimane', 'Valkyrae', 'Ludwig', 'Mizkif',
        'Rubius', 'Auronplay', 'Ibai', 'TheGrefg', 'Vegetta777', 'Willyrex', 'Fernanfloo',
        'Luisito Comunica', 'Juanpa Zurita', 'Kimberly Loaiza', 'Badabun', 'Yuya',
        'German Garmendia', 'Werevertumorro', 'Dross', 'Dalas Review',
        'DrDisrespect', 'TimTheTatman', 'Nickmercs', 'Tfue', 'Clix',
        'Dream', 'GeorgeNotFound', 'Sapnap', 'TommyInnit', 'Technoblade', 'Philza',
        'Quackity', 'Karl Jacobs', 'Corpse Husband', 'Sykkuno', 'Disguised Toast'
    ],
    memes: [
        'Doge', 'Pepe', 'Wojak', 'Chad', 'Karen', 'Stonks', 'Rickroll', 'Loss',
        'Distracted Boyfriend', 'Woman Yelling at Cat', 'Drake Hotline', 'Change My Mind',
        'This Is Fine', 'Surprised Pikachu', 'Expanding Brain', 'Galaxy Brain',
        'Trollface', 'Rage Comics', 'Bad Luck Brian', 'Success Kid', 'Grumpy Cat',
        'Nyan Cat', 'Keyboard Cat', 'Hide the Pain Harold', 'Roll Safe',
        'One Does Not Simply', 'Brace Yourselves', 'Y U No', 'Forever Alone',
        'Fuuuuu', 'Cereal Guy', 'Confused Math Lady', 'Blinking White Guy',
        'Side Eye Chloe', 'Disaster Girl', 'Evil Kermit', 'Kermit Sipping Tea',
        'Spiderman Pointing', 'Batman Slapping Robin', 'Always Has Been', 'Amogus',
        'Gigachad', 'Cope', 'Seethe', 'Touch Grass', 'No Bitches', 'Skill Issue',
        'Ratio', 'L + Ratio', 'Based', 'Cringe', 'Sus', 'Oof', 'Bruh'
    ],
    profesiones: [
        'Medico', 'Abogado', 'Ingeniero', 'Arquitecto', 'Profesor', 'Contador', 'Dentista',
        'Veterinario', 'Psicologo', 'Enfermero', 'Farmaceutico', 'Nutricionista',
        'Programador', 'Disenador', 'Fotografo', 'Camarografo', 'Editor', 'Periodista',
        'Escritor', 'Traductor', 'Musico', 'Actor', 'Director', 'Productor', 'DJ',
        'Chef', 'Panadero', 'Pastelero', 'Sommelier', 'Barista', 'Bartender', 'Mesero',
        'Piloto', 'Astronauta', 'Bombero', 'Policia', 'Militar', 'Paramedico', 'Socorrista',
        'Electricista', 'Plomero', 'Mecanico', 'Carpintero', 'Albanil', 'Pintor',
        'Jardinero', 'Agricultor', 'Ganadero', 'Pescador', 'Minero', 'Camionero',
        'Taxista', 'Repartidor', 'Vendedor', 'Cajero', 'Recepcionista', 'Secretario'
    ],
    animales: [
        'Perro', 'Gato', 'Leon', 'Tigre', 'Elefante', 'Jirafa', 'Cebra', 'Hipopotamo',
        'Rinoceronte', 'Gorila', 'Chimpance', 'Orangutan', 'Mono', 'Koala', 'Canguro',
        'Oso', 'Lobo', 'Zorro', 'Conejo', 'Ardilla', 'Raton', 'Hamster', 'Cobayo',
        'Caballo', 'Vaca', 'Cerdo', 'Oveja', 'Cabra', 'Burro', 'Llama', 'Alpaca',
        'Aguila', 'Halcon', 'Buho', 'Loro', 'Tucan', 'Flamenco', 'Pinguino', 'Pavo Real',
        'Cocodrilo', 'Caiman', 'Tortuga', 'Iguana', 'Camaleon', 'Serpiente', 'Lagarto',
        'Tiburon', 'Ballena', 'Delfin', 'Orca', 'Foca', 'Morsa', 'Pulpo', 'Medusa',
        'Cangrejo', 'Langosta', 'Estrella de Mar', 'Caballito de Mar', 'Pez Payaso'
    ],
    tecnologia: [
        'Smartphone', 'Laptop', 'Tablet', 'Smartwatch', 'Auriculares', 'Parlante',
        'Televisor', 'Monitor', 'Teclado', 'Mouse', 'Webcam', 'Microfono', 'Camara',
        'Drone', 'Robot', 'Impresora 3D', 'Realidad Virtual', 'Realidad Aumentada',
        'Inteligencia Artificial', 'Machine Learning', 'Blockchain', 'Criptomoneda',
        'NFT', 'Metaverso', 'Cloud Computing', 'Big Data', 'Internet de las Cosas',
        'WiFi', 'Bluetooth', '5G', 'Fibra Optica', 'Satelite', 'GPS', 'USB',
        'SSD', 'RAM', 'Procesador', 'Tarjeta Grafica', 'Placa Madre', 'Fuente de Poder',
        'Servidor', 'Router', 'Firewall', 'VPN', 'Antivirus', 'Malware', 'Hacker',
        'Codigo', 'Algoritmo', 'Base de Datos', 'API', 'Framework', 'Backend', 'Frontend'
    ]
};

const categoryNames = {
    videojuegos: 'Videojuegos',
    famosos: 'Famosos',
    series: 'Series y TV',
    anime: 'Anime',
    peliculas: 'Peliculas',
    musica: 'Generos Musicales',
    deportes: 'Deportes',
    paises: 'Paises',
    comidas: 'Comidas',
    marcas: 'Marcas',
    apps: 'Apps y Redes',
    youtubers: 'Youtubers y Streamers',
    memes: 'Memes e Internet',
    profesiones: 'Profesiones',
    animales: 'Animales',
    tecnologia: 'Tecnologia'
};

module.exports = { wordDatabase, categoryNames };
