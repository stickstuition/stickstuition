export const categories = [
  ["cities", "🌆", "Cities"], ["countries", "🌍", "Countries"],
  ["animals", "🐶", "Animals"], ["food", "🍕", "Food"],
  ["drinks", "🥤", "Drinks"], ["sport", "🏀", "Sport"],
  ["football", "⚽", "Football"], ["movies", "🎬", "Movies"],
  ["tv-shows", "📺", "TV Shows"], ["music", "🎵", "Music"],
  ["video-games", "🎮", "Video Games"], ["famous-people", "⭐", "Famous People"],
  ["jobs", "💼", "Jobs"], ["school", "📚", "School"],
  ["nature", "🌿", "Nature"], ["landmarks-places", "🏛️", "Landmarks & Places"],
  ["transport", "🚗", "Transport"], ["objects", "💡", "Objects"],
  ["brands", "🛍️", "Brands"], ["random-mix", "🎲", "Random Mix"],
].map(([id, icon, name]) => ({ id, icon, name }));

const codePoint = (emoji) => Array.from(emoji)
  .map((character) => character.codePointAt(0).toString(16))
  .filter((part) => part !== "fe0f")
  .join("-");

const clue = (word, emoji, alt = `A clear illustration of ${word}`) => ({
  word,
  image: `./assets/clues/${codePoint(emoji)}.svg`,
  alt,
  emoji,
});

const definitions = {
  cities: [
    ["Gold Coast", [["gold", "🥇", "A shiny gold medal"], ["coast", "🏖️", "A sandy coastline"]], "A city on Australia's east coast."],
    ["Newcastle", [["new", "✨", "Bright new sparkles"], ["castle", "🏰", "A stone castle"]], "A city in north-east England."],
    ["Blackpool", [["black", "⬛", "A solid black square"], ["pool", "🏊", "A swimmer in a pool"]], "A seaside town in Lancashire."],
    ["Oxford", [["ox", "🐂", "A strong ox"], ["ford", "🌊", "A shallow river crossing"]], "A university city in southern England."],
    ["Cape Town", [["cape", "🦸", "A superhero wearing a flowing cape"], ["town", "🏘️", "A small group of town houses"]], "A city beneath Table Mountain."],
  ],
  countries: [
    ["Iceland", [["ice", "🧊", "A cube of ice"], ["land", "🏝️", "A small piece of land"]], "A Nordic island country."],
    ["Finland", [["fin", "🦈", "A shark fin above the water"], ["land", "🏝️", "A small piece of land"]], "A country in northern Europe."],
    ["Poland", [["pole", "🚩", "A flag on a tall pole"], ["land", "🏝️", "A small piece of land"]], "A country in central Europe."],
    ["Japan", [["jar", "🫙", "A glass storage jar"], ["pan", "🍳", "A frying pan"]], "An island country in East Asia."],
    ["Thailand", [["tie", "👔", "A smart necktie"], ["land", "🏝️", "A small piece of land"]], "A country in South-East Asia."],
  ],
  animals: [
    ["Butterfly", [["butter", "🧈", "A block of butter"], ["fly", "🪰", "A housefly"]], "An insect with colourful wings."],
    ["Starfish", [["star", "⭐", "A bright five-pointed star"], ["fish", "🐟", "A blue fish"]], "A sea animal with five arms."],
    ["Seahorse", [["sea", "🌊", "A curling sea wave"], ["horse", "🐴", "A horse's head"]], "A tiny upright sea animal."],
    ["Catfish", [["cat", "🐈", "A standing cat"], ["fish", "🐟", "A blue fish"]], "A fish named for its whiskers."],
    ["Jellyfish", [["jelly", "🍮", "A wobbling jelly dessert"], ["fish", "🐟", "A blue fish"]], "A soft sea animal with tentacles."],
  ],
  food: [
    ["Pancake", [["pan", "🍳", "A frying pan"], ["cake", "🎂", "A decorated cake"]], "A flat breakfast food."],
    ["Cupcake", [["cup", "🥤", "A drinking cup"], ["cake", "🎂", "A decorated cake"]], "A small individual cake."],
    ["Popcorn", [["pop", "💥", "A comic-style pop burst"], ["corn", "🌽", "An ear of corn"]], "A crunchy cinema snack."],
    ["Cheeseburger", [["cheese", "🧀", "A wedge of cheese"], ["burger", "🍔", "A burger in a bun"]], "A burger topped with cheese."],
    ["Meatball", [["meat", "🥩", "A cut of meat"], ["ball", "⚽", "A round ball"]], "A small round serving of minced meat."],
  ],
  drinks: [
    ["Milkshake", [["milk", "🥛", "A glass of milk"], ["shake", "🤝", "Two hands shaking"]], "A cold, creamy drink."],
    ["Lemonade", [["lemon", "🍋", "A yellow lemon"], ["aid", "🩹", "A first-aid plaster"]], "A sweet citrus drink."],
    ["Fruit Punch", [["fruit", "🍎", "A red apple representing fruit"], ["punch", "👊", "A clenched fist throwing a punch"]], "A mixed fruit drink."],
    ["Hot Chocolate", [["hot", "🔥", "A bright flame"], ["chocolate", "🍫", "A bar of chocolate"]], "A warm, sweet drink."],
    ["Iced Tea", [["ice", "🧊", "A cube of ice"], ["tea", "🍵", "A cup of tea"]], "Tea served cold."],
  ],
  sport: [
    ["Basketball", [["basket", "🧺", "A woven basket"], ["ball", "🏀", "An orange ball"]], "A court sport played through a hoop."],
    ["Baseball", [["base", "🧱", "A solid building base"], ["ball", "⚾", "A white stitched ball"]], "A bat-and-ball sport."],
    ["Skateboard", [["skate", "⛸️", "An ice skate"], ["board", "🪵", "A wooden board"]], "A wheeled board used for tricks."],
    ["Table Tennis", [["table", "🪑", "A table and chair"], ["tennis", "🎾", "A tennis ball"]], "A fast indoor racket sport."],
    ["Volleyball", [["volley", "🙌", "Hands volleying upwards"], ["ball", "🏐", "A striped ball"]], "A net sport with six players per side."],
  ],
  football: [
    ["Goalkeeper", [["goal", "🥅", "A football goal"], ["key", "🔑", "A golden key"], ["keeper", "🧍", "A person standing guard"]], "The player allowed to use their hands."],
    ["Red Card", [["red", "🟥", "A bright red square"], ["card", "🃏", "A playing card"]], "A referee shows this for a sending-off."],
    ["Half Time", [["half", "🌓", "A moon split exactly in half"], ["time", "⏰", "An alarm clock"]], "The break in the middle of a match."],
    ["Corner Kick", [["corner", "📐", "A right-angle corner"], ["kick", "🦵", "A leg kicking"]], "A restart taken from beside the corner flag."],
    ["Football Boot", [["football", "⚽", "A black and white football"], ["boot", "🥾", "A sturdy boot"]], "A studded shoe worn on the pitch."],
  ],
  movies: [
    ["Star Wars", [["star", "⭐", "A bright star"], ["wars", "⚔️", "Two crossed swords"]], "A space-film saga."],
    ["The Lion King", [["lion", "🦁", "A lion's face"], ["king", "👑", "A gold crown"]], "An animated royal adventure."],
    ["Toy Story", [["toy", "🧸", "A teddy bear toy"], ["story", "📖", "An open storybook"]], "A film about toys that come alive."],
    ["Spider-Man", [["spider", "🕷️", "A black spider"], ["man", "👨", "A man's face"]], "A web-slinging superhero film."],
    ["Black Panther", [["black", "⬛", "A solid black square"], ["panther", "🐆", "A large spotted cat"]], "A superhero film set in Wakanda."],
  ],
  "tv-shows": [
    ["Love Island", [["love", "❤️", "A red heart"], ["island", "🏝️", "A tropical island"]], "A reality show set in a villa."],
    ["Dragon's Den", [["dragon", "🐉", "A green dragon"], ["den", "🕳️", "A dark animal den"]], "Entrepreneurs pitch ideas to investors."],
    ["Doctor Who", [["doctor", "🧑‍⚕️", "A doctor"], ["who", "❓", "A large question mark"]], "A time-travelling science-fiction show."],
    ["Stranger Things", [["stranger", "🕵️", "A mysterious stranger"], ["things", "📦", "A box of assorted things"]], "A supernatural show set in Hawkins."],
    ["Top Gear", [["top", "🔝", "An arrow pointing to the top"], ["gear", "⚙️", "A metal gear"]], "A motoring show about cars and challenges."],
  ],
  music: [
    ["Rock Star", [["rock", "🪨", "A grey rock"], ["star", "⭐", "A bright star"]], "A famous popular musician."],
    ["Drumstick", [["drum", "🥁", "A marching drum"], ["stick", "🪵", "A wooden stick"]], "A tool used to play percussion."],
    ["Keyboard", [["key", "🔑", "A golden key"], ["board", "🪵", "A wooden board"]], "An electronic instrument with black and white keys."],
    ["Headphones", [["head", "🙂", "A smiling head"], ["phones", "📱", "Two mobile phones"]], "You wear these to listen privately."],
    ["Playlist", [["play", "▶️", "A triangular play button"], ["list", "📋", "A clipboard list"]], "A chosen sequence of songs."],
  ],
  "video-games": [
    ["Minecraft", [["mine", "⛏️", "A mining pickaxe"], ["craft", "🛠️", "Crafting tools"]], "A block-building survival game."],
    ["Fortnite", [["fort", "🏰", "A strong fort"], ["night", "🌙", "A crescent moon at night"]], "A colourful battle royale game."],
    ["Mario Kart", [["Mario", "👨‍🔧", "A moustached mechanic in a red cap"], ["kart", "🏎️", "A racing kart"]], "A racing game with famous Nintendo characters."],
    ["Rocket League", [["rocket", "🚀", "A space rocket"], ["league", "🏆", "A league trophy"]], "A game that mixes cars and football."],
    ["Candy Crush", [["candy", "🍬", "A wrapped sweet"], ["crush", "💥", "A colourful crushing impact"]], "A match-three puzzle game."],
  ],
  "famous-people": [
    ["Taylor Swift", [["tailor", "🪡", "A tailor's sewing needle"], ["swift", "🐦", "A swift bird in flight"]], "A singer-songwriter with an Eras tour."],
    ["Tiger Woods", [["tiger", "🐅", "A tiger"], ["woods", "🌲", "A group of woodland trees"]], "A famous golfer."],
    ["Tom Cruise", [["tom", "🐈", "A tom cat"], ["cruise", "🛳️", "A cruise ship"]], "An actor known for Mission: Impossible."],
    ["Will Smith", [["wheel", "🎡", "A giant wheel"], ["smith", "⚒️", "A blacksmith's hammer and pick"]], "An actor known for Men in Black."],
    ["Jack Black", [["jack", "🃏", "A jack playing card"], ["black", "⬛", "A solid black square"]], "An actor and musician from School of Rock."],
  ],
  jobs: [
    ["Firefighter", [["fire", "🔥", "A bright fire"], ["fighter", "🥊", "A boxing glove"]], "A person who tackles fires and rescues people."],
    ["Hairdresser", [["hair", "💇", "A haircut"], ["dresser", "🗄️", "A chest of drawers"]], "A person who cuts and styles hair."],
    ["Zookeeper", [["zoo", "🦓", "A zebra at the zoo"], ["keeper", "🧍", "A person caring for something"]], "A person who cares for animals at a zoo."],
    ["Bus Driver", [["bus", "🚌", "A yellow bus"], ["driver", "🧑‍✈️", "A uniformed driver"]], "A person who takes passengers along a route."],
    ["Window Cleaner", [["window", "🪟", "A glass window"], ["cleaner", "🧽", "A cleaning sponge"]], "A person who washes glass for a living."],
  ],
  school: [
    ["Homework", [["home", "🏠", "A house"], ["work", "🔨", "A work hammer"]], "Learning tasks completed away from school."],
    ["Textbook", [["text", "💬", "A speech bubble with writing marks"], ["book", "📕", "A closed book"]], "A book used for studying a subject."],
    ["Playground", [["play", "🛝", "Children's play equipment"], ["ground", "🌱", "Green shoots growing from the ground"]], "An outdoor school area used at break."],
    ["Classroom", [["class", "👩‍🏫", "A teacher leading a class"], ["room", "🚪", "A door into a room"]], "The place where a lesson happens."],
    ["Timetable", [["time", "⏰", "An alarm clock"], ["table", "🪑", "A table and chair"]], "A schedule of lessons."],
  ],
  nature: [
    ["Sunflower", [["sun", "☀️", "A bright yellow sun"], ["flower", "🌼", "A yellow flower"]], "A tall plant with a large yellow head."],
    ["Waterfall", [["water", "💧", "A drop of water"], ["fall", "🍂", "A falling autumn leaf"]], "Water dropping over a steep edge."],
    ["Rainbow", [["rain", "🌧️", "A cloud releasing rain"], ["bow", "🎀", "A tied bow"]], "A colourful arc seen after rain."],
    ["Snowflake", [["snow", "❄️", "A snow crystal"], ["flake", "🥣", "A bowl of cereal flakes"]], "A tiny ice crystal that falls from clouds."],
    ["Moonlight", [["moon", "🌙", "A crescent moon"], ["light", "💡", "A glowing light bulb"]], "Natural light seen at night."],
  ],
  "landmarks-places": [
    ["Tower Bridge", [["tower", "🗼", "A tall tower"], ["bridge", "🌉", "A bridge at dusk"]], "A famous bascule bridge in London."],
    ["Central Park", [["central", "🎯", "The centre of a target"], ["park", "🏞️", "A green public park"]], "A huge city park in Manhattan."],
    ["Golden Gate Bridge", [["golden", "🥇", "A gold medal"], ["gate", "🚪", "An open gate"], ["bridge", "🌉", "A bridge at dusk"]], "A red suspension bridge in San Francisco."],
    ["Sydney Opera House", [["Sydney", "🇦🇺", "The flag of Australia"], ["opera", "🎭", "Theatre masks"], ["house", "🏠", "A house"]], "A sail-shaped performing arts venue."],
    ["Stonehenge", [["stone", "🪨", "A heavy stone"], ["hinge", "🚪", "A door swinging on a hinge"]], "A prehistoric stone circle in Wiltshire."],
  ],
  transport: [
    ["Airplane", [["air", "🌬️", "A gust of air"], ["plane", "✈️", "An aeroplane"]], "A vehicle that flies through the sky."],
    ["Sailboat", [["sail", "⛵", "A white sail"], ["boat", "🚤", "A small boat"]], "A wind-powered vessel."],
    ["Motorbike", [["motor", "⚙️", "A turning motor gear"], ["bike", "🚲", "A bicycle"]], "A powered two-wheeled vehicle."],
    ["Train Station", [["train", "🚆", "A passenger train"], ["station", "🚉", "A railway platform"]], "A place where rail passengers arrive and depart."],
    ["Fire Engine", [["fire", "🔥", "A bright fire"], ["engine", "🚒", "A fire engine"]], "An emergency vehicle used by firefighters."],
  ],
  objects: [
    ["Toothbrush", [["tooth", "🦷", "A white tooth"], ["brush", "🖌️", "A small brush"]], "An object used twice a day in the bathroom."],
    ["Sunglasses", [["sun", "☀️", "A bright sun"], ["glasses", "👓", "A pair of glasses"]], "Eyewear that shades your eyes."],
    ["Headphones", [["head", "🙂", "A smiling head"], ["phones", "📱", "Two mobile phones"]], "An object worn for private listening."],
    ["Notebook", [["note", "📝", "A handwritten note"], ["book", "📕", "A closed book"]], "A small book for writing ideas."],
    ["Doorbell", [["door", "🚪", "A wooden door"], ["bell", "🔔", "A ringing bell"]], "An object visitors press at an entrance."],
  ],
  brands: [
    ["Red Bull", [["red", "🟥", "A bright red square"], ["bull", "🐂", "A strong bull"]], "An energy-drink brand."],
    ["YouTube", [["you", "🫵", "A hand pointing at you"], ["tube", "🧪", "A glass tube"]], "A video-sharing brand."],
    ["PlayStation", [["play", "▶️", "A triangular play button"], ["station", "🚉", "A railway station"]], "A video game console brand."],
    ["Snapchat", [["snap", "🫰", "Fingers making a snap"], ["chat", "💬", "A speech bubble"]], "A picture-messaging brand."],
    ["KitKat", [["kit", "🧰", "A toolbox kit"], ["cat", "🐈", "A standing cat"]], "A chocolate-wafer brand."],
  ],
  "random-mix": [
    ["Moonwalk", [["moon", "🌙", "A crescent moon"], ["walk", "🚶", "A person walking"]], "A famous backward dance move."],
    ["Bookworm", [["book", "📕", "A closed book"], ["worm", "🪱", "A small worm"]], "Someone who loves reading."],
    ["Ladybird", [["lady", "👩", "A woman"], ["bird", "🐦", "A small bird"]], "A small red beetle with black spots."],
    ["Doorstep", [["door", "🚪", "A wooden door"], ["step", "👣", "A pair of footsteps"]], "The step immediately outside an entrance."],
    ["Brainstorm", [["brain", "🧠", "A human brain"], ["storm", "⛈️", "A thunderstorm cloud"]], "A lively burst of ideas."],
  ],
};

const difficultyPattern = (categoryIndex) => categoryIndex < 10
  ? [1, 1, 1, 2, 2]
  : [1, 1, 2, 2, 3];

const slugify = (value) => value.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const rebuses = categories.flatMap((category, categoryIndex) =>
  definitions[category.id].map(([answer, rawClues, hint, variants = []], puzzleIndex) => ({
    id: `${category.id}-${slugify(answer)}`,
    category: category.id,
    answer,
    acceptedAnswers: [answer, ...variants],
    clues: rawClues.map(([word, emoji, alt]) => clue(word, emoji, alt)),
    hint,
    difficulty: difficultyPattern(categoryIndex)[puzzleIndex],
    imageStatus: "ready",
    approved: true,
  })),
);

export const categoryById = new Map(categories.map((category) => [category.id, category]));
