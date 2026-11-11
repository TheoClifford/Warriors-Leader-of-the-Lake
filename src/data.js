/* =========================================================================
   DATA — the Clan, its neighbours, its land, its dead, and its stories
   ========================================================================= */

const SEASONS = ['Newleaf', 'Greenleaf', 'Leaf-fall', 'Leaf-bare'];
const YEARS = ['first', 'second', 'third', 'fourth'];
const SEASON_LINES = [
  ['Meltwater talks under the bracken. The first green spears of the year push up through last season\'s dead leaves, and the Clan wakes hungry and hopeful.',
   'The ice on the lake breaks with a sound like old bones. Birds come back to the Sky Oak, and the nursery smells of milk and new moss.'],
  ['The forest is loud with prey. Sun-high lies heavy on the hollow, and the warriors\' den smells of warm moss and long naps.',
   'Greenleaf, and the living is easy. Apprentices grow lazy and fat; the old warriors remember that easy seasons are when Clans grow careless.'],
  ['The oaks let go of their leaves one by one, like old cats giving up their names. Every patrol now is a race against the cold.',
   'Leaf-fall. The beech mast is down and the squirrels are frantic. So should you be: whatever the Clan does not store now, it will not eat later.'],
  ['Frost locks the hollow. Prey goes to ground, and the Clan counts its fresh-kill the way elders count their remaining moons.',
   'Leaf-bare. The wind comes off the frozen hills with nothing in it but cold. Warriors sleep pressed together and dream of mice.'],
];

const CLANS = {
  thunder: { name: 'ThunderClan', glyph: 'thunder' },
  wind: { name: 'WindClan', leader: 'Kestrelstar', glyph: 'wind', art: 'moor', start: { att: 0, str: 13 },
    who: 'Kestrelstar, a lean and scarred tom who measures every border in rabbits.',
    way: 'Moor-runners. Fast, proud, always a little hungry.' },
  river: { name: 'RiverClan', leader: 'Minnowstar', glyph: 'river', art: 'river', start: { att: 1, str: 15 },
    who: 'Minnowstar, a sleek she-cat with a fisher\'s patience and a bargainer\'s smile.',
    way: 'Swimmers and fishers. Sleek in greenleaf, sly in leaf-bare.' },
  shadow: { name: 'ShadowClan', leader: 'Adderstar', glyph: 'shadow', art: 'pines', start: { att: -1, str: 16 },
    who: 'Adderstar, an old black tom with cold green eyes who has outlived two deputies.',
    way: 'Night-hunters of the pines and marsh. They keep their own counsel.' },
  sky: { name: 'SkyClan', leader: 'Wrenstar', glyph: 'sky', art: 'border', start: { att: 1, str: 11 },
    who: 'Wrenstar, a small brown she-cat, barely a season a leader.',
    way: 'Leapers and climbers, the Clan that was lost and came home.' },
};
const OTHER_CLANS = ['wind', 'river', 'shadow', 'sky'];

const ZONES = {
  hollow: { name: 'The Stone Hollow', short: 'Stone Hollow', prey: 0, herbs: 0, desc: 'Your camp: a quarry bowl walled in stone, with the Highledge above and the dens in its shelter. No enemy has taken it in living memory.' },
  oakwood: { name: 'Oakwood Deeps', short: 'Oakwood', prey: 3, herbs: 1, desc: 'Old oaks, deep leaf-litter, and the best squirrel-hunting at the lake. The heart of ThunderClan\'s land.' },
  lakeshore: { name: 'The Lake Shore', short: 'Lake Shore', prey: 2, herbs: 0, desc: 'Pebbles, reeds and the Twoleg half-bridge. Voles in greenleaf, and the path to the Gathering island.' },
  twolegnest: { name: 'The Old Twoleg Nest', short: 'Twoleg Nest', prey: 1, herbs: 3, desc: 'An empty Twoleg den falling into brambles. The elders say a garden once grew there.' },
  skyoak: { name: 'The Sky Oak', short: 'Sky Oak', prey: 2, herbs: 0, desc: 'The tallest tree in the forest. Its roots are scored with claw marks older than any Clan memory.' },
  ravine: { name: 'Echo Ravine', short: 'Ravine', prey: 2, herbs: 1, desc: 'A cleft in the rock where every sound comes back twice. Something large lives there.' },
  greenway: { name: 'The Greenway', short: 'Greenway', prey: 2, herbs: 0, desc: 'An old Twoleg path grown over with grass. Rats nest under it; Twolegs still walk it with their dogs.' },
  thornmarsh: { name: 'Thornmarsh', short: 'Thornmarsh', prey: 2, herbs: 2, contested: 'shadow', desc: 'Wet ground choked with blackthorn. ShadowClan has marked it for three generations. ThunderClan has never agreed.' },
  streammeadow: { name: 'Stream Meadow', short: 'Stream Meadow', prey: 3, herbs: 0, contested: 'wind', desc: 'Long grass along the WindClan stream, thick with mice. Nobody marks it, and everybody hunts it.' },
};

const COUNCIL = {
  oakfang: { name: 'Oakfang', role: 'Senior warrior', pelt: 'brown', pattern: 'tabby', eyes: 'amber', sex: 'tom',
    skills: { claw: 4, hunt: 3, herbs: 1, stars: 1, tongue: 2, lore: 3 },
    bio: 'Broad, scarred, slow to smile. He has served three leaders and buried two, and he believes the Code is the only thing standing between a Clan and a rabble.' },
  hazelstride: { name: 'Hazelstride', role: 'Hunter', pelt: 'golden', pattern: 'dappled', eyes: 'green', sex: 'she',
    skills: { claw: 2, hunt: 5, herbs: 2, stars: 2, tongue: 3, lore: 2 },
    bio: 'The best stalker in the Clan and dry as old bark. She judges every plan by one measure: does it fill the fresh-kill pile?' },
  rookfeather: { name: 'Rookfeather', role: 'Young warrior', pelt: 'black', pattern: 'solid', eyes: 'yellow', sex: 'tom',
    skills: { claw: 4, hunt: 3, herbs: 1, stars: 1, tongue: 1, lore: 1 },
    bio: 'Fast, proud and impatient for a story of his own. Half the apprentices would follow him off a cliff, which is what worries the other half.' },
  willowmoth: { name: 'Willowmoth', role: 'Medicine cat', pelt: 'silver', pattern: 'patched', eyes: 'blue', sex: 'she',
    skills: { claw: 1, hunt: 1, herbs: 5, stars: 5, tongue: 3, lore: 4 },
    bio: 'She walks with one paw among the stars and the other in a pile of crushed tansy. She says little and means all of it.' },
  speckleback: { name: 'Speckleback', role: 'Elder', pelt: 'cream', pattern: 'tortie', eyes: 'copper', sex: 'she',
    skills: { claw: 1, hunt: 1, herbs: 2, stars: 2, tongue: 3, lore: 5 },
    bio: 'Keeper of the old tales. Deaf in one ear, sharp in both eyes, and certain that everything was better before.' },
  rainpetal: { name: 'Rainpetal', role: 'Queen', pelt: 'blue', pattern: 'tabby', eyes: 'amber', sex: 'she',
    skills: { claw: 2, hunt: 2, herbs: 2, stars: 2, tongue: 5, lore: 2 },
    bio: 'The voice of the nursery. She has kin in two other Clans and friends in all four, and she would rather talk than bleed.' },
};
const SKILL_NAMES = { claw: 'Claws', hunt: 'Hunting', herbs: 'Herb-lore', stars: 'Star-sight', tongue: 'Tongue', lore: 'Lore' };

const HEARTS = {
  valiant: { name: 'Valiant', patron: 'Lionheart', sig: 'lionheart', gift: 'courage',
    offer: 'A golden tom with a mane like a summer field steps out of the stars. "I died defending the hollow, and I would do it again. With this life I give you courage: to stand when every hair on your pelt begs you to run."',
    effect: 'War parties fight harder with you at their head, and you can settle quarrels claw to claw. You lead from the front, and the front is where lives are lost.' },
  kindred: { name: 'Kindred', patron: 'Feathertail', sig: 'feathertail', gift: 'a heart without borders',
    offer: 'A silver she-cat walks to you across the water, and where her paws touch it the stars ripple. "I was born of two Clans and I died for a third. With this life I give you a heart that knows no borders. Use it when the others have forgotten how."',
    effect: 'Other Clans warm to you, and strays find a place in your hollow. Rivals may mistake your kindness for softness, and your war parties fight a little less fiercely.' },
  shrewd: { name: 'Shrewd', patron: 'Yellowfang', sig: 'yellowfang', gift: 'clear sight',
    offer: 'A broad, ragged grey she-cat glares at you as if you have trodden on her tail. "Don\'t gawp. With this life I give you sight. You\'ll see the sickness under the fur and the lie under the fine words. Most cats won\'t thank you for saying so. Say it anyway."',
    effect: 'You see the odds before you pounce, and herbs come readily to your paws. Sharp sight makes for a sharp tongue, and you can find the cleverer path where others see only two.' },
  steadfast: { name: 'Steadfast', patron: 'Bluestar', sig: 'bluestar', gift: 'endurance',
    offer: 'A blue-grey she-cat, her eyes old with grief and pride, touches her nose to your head. "I gave up more for my Clan than I can tell you. With this life I give you strength to carry your Clan when it cannot carry itself. Choose what you lay down, and choose well."',
    effect: 'Your Clan\'s spirits never fall far while you stand on the Highledge, and StarClan listens closely at your vigils. You can pay your Clan\'s debts with your own strength, and sometimes with a life.' },
  ambitious: { name: 'Ambitious', patron: 'A voice with no stars', sig: 'dark', gift: 'hunger',
    offer: 'The pool goes still. At its edge, where no star is reflected, something speaks with a voice like wind through a dead tree. "They will give you gentleness. Take power from me instead. Take what your Clan is owed."',
    effect: 'You can demand what others must ask for, and your warriors fight for glory. StarClan watches you coldly. Something else watches you warmly.' },
};

/* Blessings apportioned at the Turning of Silverpelt */
const BLESSINGS = {
  prey: { name: 'Prey-running', desc: 'Every hunt brings back more.' },
  kits: { name: 'Kit-warmth', desc: 'More kits are born, and more survive.' },
  claws: { name: 'Claw-strength', desc: 'Your warriors fight harder.' },
  herbs: { name: 'Herb-sight', desc: 'Sickness takes fewer, herbs are found more easily.' },
  scent: { name: 'Border-scent', desc: 'Markers last longer; trespassers think twice.' },
  dreams: { name: 'Star-dreams', desc: 'Vigils and spirit-walks go better; omens come clearer.' },
};

/* ---------- Legends: the Clan's mythology. Hear them from the elders, then walk them. ---------- */
const LEGENDS = {
  fire: {
    name: 'The Fire in the Woods',
    teller: 'Speckleback settles into her moss and fixes the apprentices with one copper eye.',
    tale: [
      'Long ago, in the old forest, before the Great Journey and long before the lake, there was a kittypet called Rusty. Fat on Twoleg food, collar round his neck, nothing in his head but warm nests. And every night he sat on his fence and looked at the trees.',
      'One night he jumped. Mind that: nobody pushed him. A grey apprentice jumped on him in the bracken, and Rusty did not run home and he did not roll over. He fought back, and he fought well enough that the grey one laughed. That grey one was Graypaw, and he was Firestar\'s friend for all the moons after.',
      'Bluestar was watching from the shadows with Lionheart beside her. She offered the kittypet a place in ThunderClan, and he took off his old life like a collar and walked into the forest. They called him Firepaw.',
      'Now, the medicine cat in those days, Spottedleaf, had read a sign in the stars: that fire alone would save the Clan. Everyone thought fire meant burning. It meant him. The outsider. The one who had chosen the Clan instead of being born to it.',
    ],
    lesson: 'Leap, do not cower. Fight, do not flee. Accept, do not bargain. Fire is the stranger, not the flame.',
    boon: { id: 'fire', name: 'Fire\'s Welcome', desc: 'Envoys and gifts win more trust, and strays who join you settle well.' },
    steps: [
      { art: 'twoleg', text: 'You are not yourself. You are small and soft, and something tight circles your throat. A fence under your paws, a warm Twoleg nest behind you, and in front of you the dark trees breathing. The forest is calling a name that is not yet yours.',
        options: [{ t: 'Leap down into the long grass and go toward the trees.', ok: true }, { t: 'Turn back to the warm nest. The forest will still be there tomorrow.', ok: false }, { t: 'Yowl for the Twolegs to come and see.', ok: false }],
        okText: 'The grass is cold and wet and alive with smells. Behind you the nest-light shrinks. The legend holds.', failText: 'The trees fall silent. Nobody ever told a story about a cat who stayed on the fence.' },
      { art: 'forest', text: 'A grey shape bursts out of the bracken and bowls you over: an apprentice, all claws and laughter, sure you will run squealing home.',
        options: [{ t: 'Twist free and fight back, hard.', ok: true }, { t: 'Flatten yourself and wait for it to be over.', ok: false }, { t: 'Bolt for the fence.', ok: false }],
        okText: 'You roll him into the leaf-litter and he comes up spitting and grinning. "Not bad, for a kittypet!" Somewhere in the shadows, two older cats exchange a look.', failText: 'The grey apprentice loses interest and pads away. The two cats in the shadows turn and go.' },
      { art: 'forest', text: 'A blue-grey she-cat steps into the moonlight, a golden tom at her shoulder. "You fought well. ThunderClan could use a cat like you. But the Clan is not a game. If you come, you come with all of yourself."',
        options: [{ t: 'Accept, and leave the collar and the nest behind.', ok: true }, { t: 'Ask whether you could come and go, and keep your Twoleg home too.', ok: false }, { t: 'Ask what you would be given in return.', ok: false }],
        okText: 'Something tight around your throat loosens and falls away in the dark. "Then you will be Firepaw," says the blue-grey cat.', failText: 'The blue-grey cat\'s eyes cool. "Half a heart is no use to a Clan." She is gone.' },
      { art: 'moonpool', text: 'Stars come down through the trees and gather into a tortoiseshell she-cat with a dappled pelt. Her voice is soft and certain: "Fire alone can save our Clan." She waits. She wants to know whether you understand.',
        options: [{ t: '"Fire is the stranger who chooses the Clan."', ok: true }, { t: '"Fire is a danger. We must guard against burning."', ok: false }, { t: '"Fire is the strongest warrior, the one who wins every battle."', ok: false }],
        okText: 'She purrs, and the stars in her pelt brighten until you cannot look at them. When you wake, the welcome of that first night is in your blood.', failText: 'She dims, sorrowful. "Then you have not heard the story at all." The dream tears like wet paper.' },
    ],
  },
  leap: {
    name: 'The Leader\'s Last Leap',
    teller: 'Speckleback is quiet for a long time before she begins this one, and the kits stop wriggling.',
    tale: [
      'There was a time when Tigerstar, who had been ThunderClan\'s deputy and became its great betrayer, ruled ShadowClan. He wanted ThunderClan dead. He could not beat it with claws, so he used dogs.',
      'A whole pack of them was loose in the forest. Tigerstar laid a trail of dead rabbits from their den to the ThunderClan camp, so the dogs would follow the blood right to the nursery.',
      'Fireheart, the kittypet grown into a deputy, found the trail. He did not fight. You cannot fight a pack. He set warriors along the way in a chain, each one running a stretch with the pack at his heels and then passing it on, and he led them away from the camp toward the gorge, where the river runs fast and deep.',
      'Fireheart ran the last stretch. At the edge of the gorge the lead dog had him by the scruff. And Bluestar, who was old and had lost her faith in StarClan and nearly everything else, hurled herself at the dog and took it over the edge with her.',
      'Two RiverClan warriors pulled her from the water. Mistyfoot and Stonefur, her own kits that she had given away moons before for the sake of her Clan. She lived just long enough to make her peace with them. That was her ninth life. She spent it well.',
    ],
    lesson: 'Do not fight the pack. Run it in a chain. Run for the gorge. Let the leader make her leap. Let her kits come to her.',
    boon: { id: 'leap', name: 'The Leader\'s Leap', desc: 'Once each year, a life you would have lost is spared. Your camp is harder to take.' },
    steps: [
      { art: 'forest', text: 'Rabbit blood, a line of it, dragged through the forest straight toward your camp. And behind it, far off, a sound you have never heard and know at once: many dogs, giving voice.',
        options: [{ t: 'Set warriors along the trail, each to run a stretch and pass the pack on.', ok: true }, { t: 'Gather every warrior in the hollow and hold the walls.', ok: false }, { t: 'Hide the Clan in the dens and stay silent.', ok: false }],
        okText: 'Warriors melt into the undergrowth along the trail, one every few fox-lengths. The pack will have to chase, and chase, and chase.', failText: 'The pack comes into the hollow like a flood. No legend ever ended that way, and this one cannot go on.' },
      { art: 'gorge', text: 'Your stretch. You run with the stink of dog breath at your tail, and the pack\'s leader is gaining. Ahead the trees thin: the gorge, and the roar of the river below.',
        options: [{ t: 'Keep running for the gorge edge.', ok: true }, { t: 'Scramble up the nearest tree.', ok: false }, { t: 'Turn and fight the lead dog.', ok: false }],
        okText: 'You burst out of the trees at the very lip of the gorge, the dog a tail-length behind.', failText: 'The pack circles your tree and settles to wait. They are patient, and the camp is close.' },
      { art: 'gorge', text: 'Teeth close in your scruff. You are lifted, shaken, and the edge is right there. A blue-grey shape streaks past you, old and thin and terribly fast.',
        options: [{ t: 'Let the old leader make her leap.', ok: true }, { t: 'Shout at her to go back: this is your fight.', ok: false }, { t: 'Twist free and leap over the edge yourself.', ok: false }],
        okText: 'She hits the dog full in the chest, and the dog and the leader go over together into the white water.', failText: 'You have changed what happened, and the legend will not bear it. The gorge fills with mist.' },
      { art: 'river', text: 'Downstream, two cats with river-sleek fur drag a limp blue-grey body onto the bank. She is breathing, just. She looks past you to them.',
        options: [{ t: 'Step back, and let her kits come to her side.', ok: true }, { t: 'Carry her home to the ThunderClan camp at once.', ok: false }, { t: 'Send the RiverClan cats away. She is ThunderClan\'s leader.', ok: false }],
        okText: 'They press close, and she tells them she is proud of them, and the three of them are a family for the space of a few breaths. Then she is gone, and the stars take her. You wake with her leap in your heart.', failText: 'Her last breath goes out with nothing said. The legend closes over you like cold water.' },
    ],
  },
  lion: {
    name: 'The Night of LionClan',
    teller: 'Speckleback\'s fur bristles even as she tells it. "This is the big one," she says. "Pay attention."',
    tale: [
      'Tigerstar was not finished. He brought a new Clan into the forest: BloodClan, cats from the Twoleg town who had no Code at all. Their leader was Scourge, a small black tom with a collar studded with dogs\' teeth and claws reinforced the same way.',
      'Tigerstar thought he could use Scourge. At the meeting where he meant to show his power, Scourge struck him once and opened him from throat to tail, and Tigerstar lost all nine of his lives in that one blow. The whole forest saw it.',
      'Firestar, who was leader by then, understood. No one Clan could beat BloodClan. So for one battle there were no borders: ThunderClan, WindClan, RiverClan and ShadowClan fought together as one Clan, and he named it LionClan, for the great Clan of old.',
      'Scourge killed Firestar. Took one of his lives. And Firestar went to StarClan, and came back, and got up off the ground, and killed Scourge. BloodClan broke and ran, and the forest was free.',
    ],
    lesson: 'Stand your ground and bear witness. Name them LionClan. Return from the stars. Strike with all four Clans behind you.',
    boon: { id: 'lion', name: 'One Clan of Lions', desc: 'Other Clans listen when you speak of alliance, and allies fight harder at your side.' },
    steps: [
      { art: 'battle', text: 'A clearing full of cats, and in the middle a huge dark tabby, proud as a mountain. Facing him, a little black tom with a collar of teeth. A single blow, and the great tabby falls, and falls, and falls, and does not get up.',
        options: [{ t: 'Hold your ground, and make sure every cat saw what happened.', ok: true }, { t: 'Run. If he could kill Tigerstar, he can kill anyone.', ok: false }, { t: 'Offer the black tom your Clan\'s friendship.', ok: false }],
        okText: 'You stay. You watch. You carry the news back through the night to every Clan.', failText: 'The clearing goes dark, as if no one stayed to remember.' },
      { art: 'gathering', text: 'Four Clans in one place, bristling at each other even now. They need a single name to fight under, or BloodClan will take them one by one.',
        options: [{ t: '"Tonight we are LionClan."', ok: true }, { t: '"Tonight we are TigerClan."', ok: false }, { t: '"Tonight we are all ThunderClan."', ok: false }],
        okText: 'The name goes through them like wind through grass. LionClan. For one night, there are no borders.', failText: 'Someone spits. The Clans scatter back to their own territories, and the dream scatters with them.' },
      { art: 'battle', text: 'Scourge finds you in the fighting. He is small and fast and his claws are not cat claws. One blow, and the stars rush up around you, and a voice you love says you may stay.',
        options: [{ t: 'Go back. Your Clan is still fighting.', ok: true }, { t: 'Stay among the stars, where it is quiet and nothing hurts.', ok: false }],
        okText: 'You drag yourself up out of the dark and onto your paws. Scourge\'s eyes widen. He did not think anything got back up.', failText: 'It is quiet among the stars. You do not hear how the battle ends.' },
      { art: 'battle', text: 'He springs again. Behind you, you feel it: four Clans, one Clan, pressing forward.',
        options: [{ t: 'Strike with all of LionClan behind you.', ok: true }, { t: 'Call for single combat, leader against leader, alone.', ok: false }, { t: 'Feint, and let the others take him.', ok: false }],
        okText: 'You meet him, and LionClan meets him, and BloodClan breaks like ice on the lake. You wake with the roar of four Clans in your ears.', failText: 'Alone, you are only one cat against those claws. The dream ends in red.' },
    ],
  },
};
const LEGEND_ORDER = ['fire', 'leap', 'lion'];

/* ---------- Ways of the Clans (always readable in the Elders' den) ---------- */
const LORE = [
  { h: 'The Warrior Code', p: 'Not a law handed down but a set of promises every Clan keeps: defend your Clan, even with your life. Do not hunt on another Clan\'s land. Feed elders and queens and kits before yourself. Respect the truce of the full moon. Obey your leader, and remember that a leader\'s word is only Code while it keeps faith with StarClan.' },
  { h: 'Silverpelt', p: 'The bright band of stars across the night sky. Every warrior who dies well becomes one of its stars and hunts there for ever. When a Clan looks up, it is looking at its dead, and its dead are looking back.' },
  { h: 'Names', p: 'A kit is named for something seen at its birth. At six moons it becomes an apprentice and takes "-paw". When its mentor judges it ready, the leader gives it a warrior name before the whole Clan: a second birth. Leaders take "-star" from StarClan itself. To lose your warrior name is to lose your place in the world.' },
  { h: 'The Moonpool', p: 'A pool in the hills above the lake, reached along a path worn into dimples by the paws of cats who walked it before any Clan existed. Medicine cats share tongues with StarClan there each half-moon. Leaders go once, to receive their nine lives.' },
  { h: 'The Gathering', p: 'At each full moon the five Clans meet on the island beneath the Great Oak, and no claw may be unsheathed until dawn. If clouds cover the moon, StarClan is angry, and the Gathering ends at once.' },
  { h: 'The Vigil', p: 'When a warrior dies, the Clan sits with the body through the night, sharing tongues with them one last time. At dawn the elders carry them out to be buried. New warriors keep a silent vigil too, the night after their naming: one death, one birth, both watched over.' },
  { h: 'Medicine cats', p: 'They take no mate and lead no patrols, and they belong a little to every Clan: at the Moonpool there are no borders. They know herbs, and they read the signs StarClan sends, and they are the only cats who may tell a leader to their face that they are wrong.' },
  { h: 'The Place of No Stars', p: 'Not every warrior goes to Silverpelt. Those who betrayed the Code walk a dark forest where nothing shines and nothing grows. Some say they whisper to the living. Some say they are lonely, and some say they are hungry.' },
];

/* ---------- Names for the living Clan ---------- */
const NAME_PRE = ['Ash', 'Birch', 'Bracken', 'Briar', 'Cedar', 'Cloud', 'Dapple', 'Dawn', 'Dusk', 'Ember', 'Fern', 'Finch', 'Flint', 'Frost', 'Gorse', 'Hawk', 'Heather', 'Holly', 'Ivy', 'Juniper', 'Lark', 'Larch', 'Lichen', 'Mallow', 'Moss', 'Mouse', 'Nettle', 'Owl', 'Pebble', 'Pine', 'Poppy', 'Quail', 'Rain', 'Robin', 'Rowan', 'Rush', 'Sedge', 'Sloe', 'Snow', 'Sorrel', 'Sparrow', 'Spruce', 'Storm', 'Swift', 'Tansy', 'Thistle', 'Thrush', 'Vole', 'Wren', 'Yarrow'];
const NAME_SUF = ['fur', 'pelt', 'tail', 'claw', 'heart', 'leap', 'whisker', 'song', 'stripe', 'fang', 'frost', 'fall', 'step', 'wing', 'shade', 'nose', 'ear', 'flight', 'storm', 'cloud', 'foot', 'tuft', 'blaze', 'mist'];
const PLAYER_PRE = ['Ash', 'Birch', 'Bracken', 'Briar', 'Cedar', 'Dusk', 'Ember', 'Fern', 'Flint', 'Frost', 'Gorse', 'Hawk', 'Holly', 'Juniper', 'Lark', 'Lichen', 'Moss', 'Nettle', 'Pine', 'Rain', 'Rowan', 'Sedge', 'Sloe', 'Sorrel', 'Spruce', 'Storm', 'Thistle', 'Thrush', 'Wren', 'Yarrow'];
