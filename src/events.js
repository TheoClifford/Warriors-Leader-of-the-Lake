/* =========================================================================
   EVENTS — what the seasons bring. Each scene: text, the council's advice,
   and choices. Choices marked with a heart appear only to leaders of that heart.
   ========================================================================= */
const P = (...a) => a.filter(Boolean).map(x => `<p>${x}</p>`).join('');
const Q = s => `<span class="speech">“${s}”</span>`;

/* ---------------- Random events ---------------- */
const EV = {
  kittypet: {
    title: 'A collar at the border', art: 'twoleg', artOpts: { other: 'ginger' }, seasons: [0, 1, 2],
    vars: () => ({ n: pick(['Clover', 'Marigold', 'Sun', 'Pebble', 'Bramble']) }),
    text: v => P(`Hazelstride's dawn patrol comes back with a stranger walking stiff-legged between them: a young ginger-and-white tom, sleek as a well-fed vole, a band of blue Twoleg-stuff around his neck and the stink of a Twoleg nest in his fur.`,
      `He says he has watched the woods from his fence for many moons. He says he dreams about them. He wants to stay. The whole hollow has gone quiet to hear what you will say.`),
    advice: () => ({ rookfeather: 'Kittypets are soft. Send him back to his Twolegs before he eats our prey and gets an apprentice killed.', speckleback: 'The last time a kittypet walked into these woods with fire in his fur, he ended up leading us all. Mind you, I\'ve known others who ended up as fox-dung.', hazelstride: 'He stalked a sparrow on the way here. Missed it by a whisker, but his crouch wasn\'t bad.' }),
    options: v => [
      { t: 'Welcome him. Give him an apprentice name and a mentor.', go: () => { addCats('apprentices', 1); if (!isHeart('kindred') && !hasBoon('fire')) add('mood', -1); logSaga(`A kittypet joined the Clan as ${v.n}paw.`); return P(`He takes the name ${v.n}paw and loses the collar the same night, caught on a bramble. Rookfeather mutters about kittypet stink for a quarter-moon.`, hasBoon('fire') ? 'But the Clan remembers the fire in the woods, and the muttering stops sooner than it might.' : ''); } },
      { t: 'Set him a trial: bring back prey before sundown, or go home.', odds: () => .45 + skill('hunt') * .05, go: () => { if (chance(.45 + skill('hunt') * .05)) { addCats('apprentices', 1); add('mood', 1); logSaga(`A kittypet won a place in the Clan by trial.`); return P(`At sundown he drops a mouse at your paws: small, mangled and entirely his own. The Clan yowls its approval. He becomes ${v.n}paw.`); } return P('He comes back at dusk with nothing but burrs. He does not argue. He just walks back toward his fence, and you see him sitting on it, many nights after, looking at the trees.'); } },
      { t: 'Send him home. The forest is not a game for fence-sitters.', go: () => { add('mood', isHeart('ambitious') ? 1 : 0); return P('He goes without a word. Rookfeather looks pleased. Rainpetal does not.'); } },
      { t: 'Take him to the elders\' den and let Speckleback tell him about the fire in the woods.', h: 'kindred', go: () => { addCats('apprentices', 1); add('mood', 1); const learnt = !S.legends.includes('fire'); if (learnt) S.legends.push('fire'); logSaga(`A kittypet joined the Clan as ${v.n}paw, welcomed with an old story.`); return P(`Speckleback tells it with relish, and the whole Clan drifts over to listen. By the end the young tom's eyes are shining, and even Rookfeather is quiet. ${v.n}paw sleeps in the apprentices' den that night.`, learnt ? 'You have heard the legend of <em>The Fire in the Woods</em>.' : ''); } },
      { t: 'Strip his collar and send him home bleeding, so the Twolegs\' pets learn whose woods these are.', h: 'ambitious', go: () => { add('dark', 1); add('honour', -1); add('mood', 1); return P('The young warriors cheer. The blue collar hangs from a thorn by the border for a moon, until rain rots it. Willowmoth does not speak to you for three days.'); } },
    ],
  },

  greencough: {
    title: 'The white cough', art: 'den', artOpts: { elder: 'grey' }, seasons: [3], w: 3,
    text: () => P(`It begins in the elders' den, as it always does: a dry rattle in the night, then a wet one. By the third dawn two elders and a kit are burning with fever, and Willowmoth's den reeks of crushed leaves.`,
      `${Q('Greencough')}, she says, flat as ice. ${Q(`Catmint will turn it. I have ${S.herbs} bundles of herbs in my store. That will not be enough for everyone.`)}`),
    advice: () => ({ willowmoth: 'If I use everything now, I have nothing left for wounds. But a wound can wait. A cough cannot.', rainpetal: 'Keep it out of the nursery. Whatever it costs. If the kits sicken we lose the next ten seasons.', oakfang: 'Move the sick to the old den at the edge of the hollow. Hard, I know. The healthy must stay healthy.' }),
    options: () => [
      { t: 'Use every herb in the store.', req: () => S.herbs >= 3, why: 'Willowmoth has fewer than three bundles.', go: () => { flag('coughHandled'); const used = Math.min(S.herbs, 7); S.herbs -= used; const d = used >= 6 ? 0 : killCats(1, ['elders', 'kits']); return P(`Willowmoth works without sleeping, and the store empties bundle by bundle.`, d ? 'One elder, already frail, does not wake on the fourth morning. The rest live.' : 'On the fifth morning the coughing stops. Everyone lives.'); } },
      { t: 'Send Willowmoth to the old Twoleg nest for fresh catmint.', req: () => F('catmint'), why: 'Nobody has explored the old Twoleg nest yet.', go: () => { flag('coughHandled'); add('herbs', 3); if (chance(.2)) return P('She comes back with her jaws full of catmint and a dog-bite on her flank. She treats the sick before she lets anyone treat her. Nobody dies.'); return P('The catmint is frost-bitten but alive. Willowmoth digs it out with her claws and the cough breaks within a quarter-moon. Nobody dies.'); } },
      { t: 'Move the sick to the far den, away from the nursery.', go: () => { flag('coughHandled'); const d = killCats(rnd(1, 2), ['elders']); add('mood', -1); return P(`It is the right thing and it feels like the wrong one. The nursery stays clean. ${d === 1 ? 'One elder' : 'Two elders'}, alone in the far den with only Willowmoth beside them, go to StarClan before the moon turns.`); } },
      { t: 'Keep vigil at the Moonpool and ask StarClan to lift it.', go: () => { flag('coughHandled'); add('favour', 1); if (chance(.35 + .1 * S.bless.dreams)) return P('You sleep with your nose to the water and dream of a meadow full of catmint, bending in a warm wind. When you come home, the fever has broken.'); const d = killCats(2, ['elders', 'kits']); return P(`The stars are silent. When you come home, ${d === 1 ? 'one cat has' : d + ' cats have'} died. The Clan does not say anything, which is worse.`); } },
      { t: 'You\'ve smelled this kind before. Tansy and coltsfoot, and make them eat even if they spit.', h: 'shrewd', go: () => { flag('coughHandled'); S.herbs = Math.max(0, S.herbs - 2); add('mood', 1); return P('You sit on the elders until they swallow, and they curse you for it with what voices they have left. In a quarter-moon they are well enough to curse you properly.'); } },
      { t: 'Sit with the sick yourself, night after night, so no cat dies alone.', h: 'steadfast', go: () => { flag('coughHandled'); killCats(1, ['elders']); add('mood', 2); add('favour', 1); let t = 'One old warrior dies anyway, with your tail wrapped around him. The rest live. The Clan watches you come out of that den, thin and hollow-eyed, and something in it settles.'; if (chance(.4)) { const l = loseLife('greencough, caught from the sick'); t += l === 'lost' ? ` Then the fever takes you too. You wake on the far side of it, in StarClan's hunting grounds, and come back. One life spent. ${S.lives} remain.` : ' The fever takes you too, and lets you go.'; } return P(t); } },
    ],
  },

  fox: {
    title: 'Red shape in the bracken', art: 'fox', seasons: [0, 1, 2],
    text: () => P(`A vixen has dug an earth below the ridge, close enough to the hollow that the nursery can smell her on the wind. She has cubs. Yesterday she took a squirrel from under an apprentice's nose and looked at him as if he would be next.`),
    advice: () => ({ oakfang: 'A war-patrol. Five warriors, at dawn, before she knows we\'re coming.', speckleback: 'There\'s an old trick: lead it into someone else\'s land with a trail of fresh-kill. That\'s how the dog story starts, mind, and you know how that ended.', rainpetal: 'I want her gone before the kits are big enough to wander. I don\'t much care how.' }),
    options: () => [
      { t: 'Send a war-patrol to drive her out.', odds: () => .55 + .05 * skill('claw') + .05 * S.bless.claws, go: () => { if (chance(.55 + .05 * skill('claw') + .05 * S.bless.claws)) { add('mood', 1); S.herbs = Math.max(0, S.herbs - 2); return P('They come back scratched and stinking of fox, and the earth is empty by sun-high. The vixen will den somewhere else, far from here.'); } const d = killCats(1, ['apprentices', 'warriors']); return P(`The vixen fights for her cubs like a cat would. ${d ? 'An apprentice who went in too fast does not come out.' : ''} She moves her cubs at last, but the Clan has paid for it.`); } },
      { t: 'Lead her into ShadowClan\'s pines with a trail of fresh-kill.', req: () => S.prey >= 4, why: 'Needs 4 fresh-kill.', go: () => { S.prey -= 4; add('honour', -1); if (chance(.4)) { rel('shadow', -2); flag('offence_shadow_us'); return P('The fox follows the trail into the pines, and ShadowClan finds out exactly whose trail it was. Adderstar will remember.'); } return P('The trail works. The vixen follows it into the pines and does not come back. Nobody in ShadowClan knows. You do.'); } },
      { t: 'Leave her. Foxes move on when the cubs are grown. Keep the kits inside the hollow.', go: () => { add('mood', -1); S.prey = Math.max(0, S.prey - 5); let t = 'The Clan hunts around the ridge for a season and goes hungry for it.'; if (chance(.25)) { killCats(1, ['kits']); t += ' And one evening a kit slips out to see the fox. Rainpetal finds only tufts of fur.'; } return P(t); } },
      { t: 'Face the vixen yourself, at the mouth of her earth.', h: 'valiant', odds: () => .75, go: () => { add('mood', 2); add('honour', 1); if (chance(.75)) { logSaga(`${leaderName()} drove a fox from the territory alone.`); return P('You walk up to the earth in plain sight and scream at her until she comes out. Then you fight her. When it is over she is running, and you are standing in her doorway bleeding and laughing. The Clan will tell this one for seasons.'); } const l = loseLife('killed by a fox'); return P(l === 'lost' ? `She is faster than you thought. You drive her off, but her teeth find your throat first, and the stars come down to take you. You wake again, cold. ${S.lives} lives remain.` : 'She gets her teeth into your throat, and lets go, as if something had startled her. She runs. You live.'); } },
    ],
  },

  love: {
    title: 'The scent of fish', art: 'river', seasons: [0, 1, 2],
    vars: () => ({ n: warName(), sex: pick(['she', 'he']) }),
    text: v => P(`Rainpetal comes to your den at moonhigh, tail low. ${Q(`It's ${v.n}.`)} A young warrior has been slipping out at dusk; Hazelstride followed the trail to the stepping-stones and found ${v.sex === 'she' ? 'her' : 'him'} sharing tongues with a RiverClan cat on the far bank.`,
      Q('Not the first to fall for someone across a border. Not the last. But the Code...')),
    advice: v => ({ oakfang: 'The Code is the Code. Loyalty to your Clan, above everything. End it now.', speckleback: 'Graystripe and Silverstream. Everyone knows how that one goes. Kits, and grief, and a great deal of shouting.', rainpetal: 'If you part them, do it gently. Hearts don\'t heal like torn ears.' }),
    options: v => [
      { t: `Forbid it. Put ${v.n} on dawn patrols where you can watch.`, go: () => { add('honour', 1); add('mood', -1); return P(`${v.n} obeys. For a moon ${v.sex === 'she' ? 'she' : 'he'} hardly eats. Then, slowly, the light comes back.`); } },
      { t: 'Look away. What you have not seen, you need not judge.', go: () => { flag('loveHidden', v.n); return P('You say nothing. Neither does Rainpetal. Neither, for now, does anyone else.'); } },
      { t: `Raise it honestly with Minnowstar at the next Gathering.`, go: () => { add('honour', 1); if (chance(.55)) { rel('river', 1); return P('Minnowstar hears you out with that bargainer\'s smile and then, surprisingly, thanks you. "Better told than found," she says. They part, sadly and without shame.'); } rel('river', -1); return P('Minnowstar bristles at being told her business before the Clans. The lovers are parted, and RiverClan is cooler toward you.'); } },
      { t: `Tell ${v.n} the story of Feathertail, born of two Clans, and let ${v.sex === 'she' ? 'her' : 'him'} choose.`, h: 'kindred', go: () => { if (chance(.6)) { add('mood', 1); return P(`${v.n} listens to the end, and is quiet a long time. ${Q('I\'m ThunderClan')}, ${v.sex === 'she' ? 'she' : 'he'} says at last. The parting is hard, and clean, and nobody is shamed.`); } addCats('warriors', -1); rel('river', 2); logSaga(`${v.n} left ThunderClan for love, and RiverClan.`); return P(`${v.n} chooses the river. You let ${v.sex === 'she' ? 'her' : 'him'} go with your blessing, and RiverClan notes it. There is a ThunderClan-born warrior on the far bank now who will never hate you.`); } },
      { t: `Use it. Tell ${v.n} to keep meeting the RiverClan cat, and to listen.`, h: 'ambitious', go: () => { add('dark', 1); add('honour', -1); flag('spyRiver'); return P(`${v.n} looks at you as if you have struck ${v.sex === 'she' ? 'her' : 'him'}. Then nods. From now on you will know what RiverClan is planning before Minnowstar's own warriors do.`); } },
    ],
  },

  windpoach: {
    title: 'Rabbit blood on our side', art: 'border', artOpts: { clan: 'wind' }, seasons: [1, 2, 3],
    text: () => P(`At Stream Meadow the dawn patrol finds a rabbit kill, half-eaten, a full tail-length on ThunderClan's side of the stream. The scent on it is WindClan's: heather and wind and that thin, hungry smell of cats who run their prey down in the open.`),
    advice: () => ({ rookfeather: 'Ambush their next patrol. Make them bleed for every rabbit.', oakfang: 'Shame them at the Gathering. Let every Clan hear it.', hazelstride: 'It\'s one rabbit. I\'d rather spend the day catching three of our own.' }),
    options: () => [
      { t: 'Wait for the Gathering, and shame them before every Clan.', go: () => { flag('offence_wind', 'stealing rabbits at Stream Meadow'); return P('You say nothing yet. You will say it under the full moon, in front of everyone.'); } },
      { t: 'Ambush their next hunting patrol at the stream.', go: () => { const f = fight({ clan: 'wind', sent: 5, aim: 'prey' }); rel('wind', -2); if (f.won) { add('mood', 1); return P('Your warriors wait in the long grass until the WindClan patrol crosses, and then the grass explodes. The moor-cats run for home with their ears torn.' + fightLine(f)); } add('mood', -1); return P('WindClan is faster in the open than you guessed. Your ambush becomes a brawl, and the brawl goes badly.' + fightLine(f)); } },
      { t: 'Renew the scent markers twice a day. Make the line impossible to miss.', go: () => { S.scent = 3; S.prey = Math.max(0, S.prey - 2); return P('Every tree along the stream reeks of ThunderClan. The patrols are tired. Nobody can say now that they did not know.'); } },
      { t: 'Look again. Those bite marks are too wide for a cat.', h: 'shrewd', go: () => { rel('wind', 1); return P('You crouch over the carcass and sniff until your eyes water. A fox killed this. WindClan only scavenged it, and stopped when they smelled your border. When Kestrelstar hears that you defended his Clan\'s honour, he sends a thank-you that costs him visibly.'); } },
      { t: 'Send word to Kestrelstar: if WindClan is starving, it can ask.', h: 'kindred', go: () => { rel('wind', 2); S.prey = Math.max(0, S.prey - 4); return P('Kestrelstar\'s pride does not let him ask. But a quarter-moon later, when your patrol leaves four mice at the border stone, they are gone by morning, and WindClan stops crossing.'); } },
    ],
  },

  assessment: {
    title: 'The failed assessment', art: 'forest', seasons: [0, 1, 2],
    cond: () => S.cats.apprentices > 0,
    vars: () => ({ n: kitPre() }),
    text: v => P(`Rookfeather's apprentice, ${v.n}paw, has failed her assessment for the second time. She froze when a squirrel bolted, then crashed after it through the bracken like a badger. Rookfeather wants her held back three more moons.`,
      `${v.n}paw has stopped eating. You saw her this morning, sitting alone at the edge of the training hollow.`),
    advice: v => ({ rookfeather: 'She\'s not ready. If I say she\'s a warrior and she freezes in a battle, someone dies. Maybe her.', hazelstride: 'Give her to me. Half of hunting is being told you\'re good at it.', speckleback: 'Bluestar herself mentored a kittypet who couldn\'t stalk a beetle at first. Mentors matter.' }),
    options: v => [
      { t: 'Make her a warrior anyway. Confidence will come.', go: () => { addCats('apprentices', -1); addCats('warriors', 1); add('mood', 1); if (chance(.3)) { flag('weakWarrior', v.n); } return P(`You name her ${v.n}heart under the Highledge, and her face when she hears it is worth a season of doubts. Rookfeather says nothing at all.`); } },
      { t: 'Hold her back. The mentor knows the apprentice.', go: () => { add('mood', -1); add('honour', 1); return P(`Rookfeather is right, and that is no comfort to ${v.n}paw. She trains harder. She is quieter.`); } },
      { t: 'Give her a new mentor: Hazelstride.', go: () => { S.trainBonus += 1; add('mood', 1); return P(`Within a quarter-moon ${v.n}paw is bringing back more prey than the other apprentices. Hazelstride is insufferable about it.`); } },
      { t: 'Take her as your own apprentice.', h: 'steadfast', go: () => { flag('mentoring'); S.trainBonus += 1; add('mood', 2); logSaga(`${leaderName()} took ${v.n}paw as apprentice.`); return P(`Leaders seldom mentor, but it has been done, and the legends remember who. ${v.n}paw follows you everywhere. It will cost you time next season, and you do not regret it.`); } },
      { t: 'Take her to the ShadowClan border and let her find her nerve.', h: 'valiant', odds: () => .65, go: () => { if (chance(.65)) { addCats('apprentices', -1); addCats('warriors', 1); add('mood', 1); return P(`A ShadowClan patrol finds you, and ${v.n}paw does not freeze. She stands at your shoulder, fur on end, and stares them down. You name her ${v.n}heart that evening.`); } killCats(1, ['apprentices']); add('mood', -2); return P(`A ShadowClan patrol finds you, and ${v.n}paw freezes, and then she runs, straight across the Thunderpath. You carry her home. She does not wake.`); } },
    ],
  },

  greenway: {
    title: 'Monsters on the Greenway', art: 'twoleg', seasons: [1, 2],
    cond: () => S.zones.greenway.explored,
    text: () => P(`Twolegs have come back to the old path beyond the Sky Oak, with their bright pelts and their loud voices and their dogs. Yesterday a dog chased an apprentice up a tree and barked under it until dusk. A monster growled along the path at sun-high, flattening the grass.`),
    advice: () => ({ hazelstride: 'Twolegs keep their own hours. Dawn is ours if we want it.', oakfang: 'Stay off it. No mouse is worth a dog.', willowmoth: 'The rats there carry sickness. Whatever you decide, nobody eats a Greenway rat without bringing it to me first.' }),
    options: () => [
      { t: 'Forbid the Greenway until the Twolegs leave.', go: () => { flag('greenwayShut', true); add('mood', 0); return P('The patrols go around. The hunting is thinner for it, and the Clan is safe for it.'); } },
      { t: 'Hunt it at dawn and dusk, when the Twolegs are in their nests.', go: () => { flag('greenwayShut', false); if (chance(.2)) { killCats(1, ['apprentices', 'warriors']); return P('It works for half a moon. Then a dog comes early.'); } add('prey', 4); return P('The rats are bold and slow at first light. The patrols come home fat-jawed.'); } },
      { t: 'Twolegs come at sun-high and leave before dark. Watch them, and use them.', h: 'shrewd', go: () => { flag('greenwayShut', false); add('prey', 8); return P('You sit in a hawthorn for a full day and learn their habits: where they walk, where the dogs are let loose, where they drop food that draws rats. By the end of the moon, ThunderClan is hunting the Greenway like its own pantry.'); } },
      { t: 'Lure the dogs toward ShadowClan\'s border.', h: 'ambitious', go: () => { add('dark', 2); add('honour', -1); rel('shadow', -1); return P('It takes three tries. On the fourth, the dogs follow the scent into the pines, and you hear yowling there for half a night. Speckleback will not look at you. She knows which story this is.'); } },
    ],
  },

  loner: {
    title: 'The old loner', art: 'snow', seasons: [2, 3],
    text: () => P(`A thin, grizzled she-cat sits at the edge of the Oakwood as if she has been waiting there a long time. She gives her name as Nettle. She has lived in the Twoleg barns beyond the hills for more seasons than she can count, and she says this winter will be the worst of them.`,
      `${Q('I know herbs. I know what grows under snow. Let me winter in your hollow, and I\'ll earn my keep.')}`),
    advice: () => ({ willowmoth: 'She knows more than she\'s telling. I could learn from her.', oakfang: 'One more mouth in leaf-bare. Another loner who\'ll be gone at newleaf.', rainpetal: 'She\'s old and she\'s cold and she\'s asking. What would the Code have us do?' }),
    options: () => [
      { t: 'Take her in, as an elder.', go: () => { addCats('elders', 1); add('herbs', 3); add('honour', 1); return P('Nettle settles in the elders\' den and argues with Speckleback about everything. On the second night she shows Willowmoth a root that grows under snow and eases coughing.'); } },
      { t: 'Take her in, if she will take a warrior name and swear to the Code.', go: () => { if (chance(.5)) { addCats('warriors', 1); add('herbs', 2); return P('She snorts, and thinks about it, and then she kneels under the Highledge with stiff old knees. Nettlefrost: she chose it herself.'); } return P('She laughs at you. "I\'m too old to be anybody\'s warrior." She goes back into the snow. Willowmoth watches her leave.'); } },
      { t: 'Send her on. ThunderClan feeds its own first.', go: () => { add('honour', -1); return P('She nods as if she expected nothing else, and goes.'); } },
      { t: 'Make her Willowmoth\'s teacher. Every herb she knows, the Clan will know.', h: 'kindred', go: () => { addCats('elders', 1); add('herbs', 4); flag('nettleStays'); add('mood', 1); return P('Nettle and Willowmoth spend the winter bent over leaves in the medicine den, muttering. From now on, ThunderClan\'s herb patrols always come back heavier.'); } },
      { t: 'Take her herbs and send her on her way.', h: 'ambitious', go: () => { add('herbs', 5); add('dark', 1); add('honour', -2); return P('She does not fight. She just looks at you while your warriors take the bundles from her nest-bag of leaves. Later, the elders say a loner died in the snow beyond the Sky Oak. Nobody says her name.'); } },
    ],
  },

  elders: {
    title: 'The fresh-kill pile', art: 'hollow', seasons: [0, 1, 2, 3],
    text: () => P(`Speckleback has a complaint, and like every complaint she has made in forty moons, she makes it loudly, from the middle of the clearing.`,
      `${Q('In my day, apprentices fed the elders before they so much as sniffed a mouse. Now I get the scraps of the scraps. I have eaten more beetles this moon than a hedgehog.')}`, `The apprentices look at their paws. Several warriors look at you.`),
    advice: () => ({ oakfang: 'She\'s right. Elders and queens eat first. It\'s the Code, and it\'s older than the Code.', rookfeather: 'If elders want better prey they can come and help catch it.', speckleback: 'I am RIGHT HERE.' }),
    options: () => [
      { t: 'Remind the apprentices of the Code: elders and queens eat first.', go: () => { add('honour', 1); add('mood', 1); return P('From then on Speckleback gets the first vole off every patrol, and lets everyone know it. The apprentices grumble. The Clan, somehow, feels more like a Clan.'); } },
      { t: 'Make it a rite: each apprentice\'s first catch goes to the elders.', go: () => { add('honour', 1); add('favour', 1); logSaga('A new custom: an apprentice\'s first catch is given to the elders.'); return P('It catches on at once, the way good customs do. Within a season the apprentices are competing to bring the elders the best first catch, and the elders are judging them without mercy. You suspect it will outlive you.'); } },
      { t: 'Tell her that elders who want better prey can hunt it.', go: () => { add('mood', -2); add('honour', -1); return P('The clearing goes very quiet. Speckleback stares at you for a long moment and then walks, slowly and with great dignity, back to her den. Rookfeather is the only cat who laughs.'); } },
      { t: 'Offer her first pick, if she tells the apprentices a legend every quarter-moon.', h: 'shrewd', go: () => { add('mood', 1); const next = LEGEND_ORDER.find(l => !S.legends.includes(l)); if (next) S.legends.push(next); return P('Speckleback narrows her eyes, recognises a bargain in her favour, and accepts before you can change your mind.', next ? `That very evening she tells <em>${LEGENDS[next].name}</em>, and you sit at the back and listen.` : ''); } },
    ],
  },

  shadowmarkers: {
    title: 'The markers have moved', art: 'pines', seasons: [0, 1, 2, 3], w: 1.4,
    cond: () => S.clans.shadow.att <= 1,
    text: () => P(`Overnight, the ShadowClan border has walked. The scent line, pine-sap and marsh-rot, now runs a fox-length inside ThunderClan's side of the old dead alder, and it has been laid thick, on purpose, by several cats.`,
      S.zones.thornmarsh.owner === 'thunder' ? 'Thornmarsh is ThunderClan land now, and ShadowClan wants it back.' : 'Thornmarsh was never enough for Adderstar.'),
    advice: () => ({ rookfeather: 'Dawn. Every warrior. We take it back and we take Thornmarsh with it.', oakfang: 'Re-mark it and post a guard. Let them decide whether they want a war.', rainpetal: 'Raise it at the Gathering. Adderstar hates being seen to be a thief.' }),
    options: () => [
      { t: 'Attack at dawn with a full war party.', go: () => { const f = fight({ clan: 'shadow', sent: Math.min(9, S.cats.warriors), aim: 'land' }); rel('shadow', -2); if (f.won) { S.zones.thornmarsh.owner = 'thunder'; add('mood', 2); logSaga('ThunderClan took Thornmarsh from ShadowClan.'); return P('You hit them at first light, as the mist lifts off the marsh. ShadowClan was not expecting a war over one fox-length of ground. They are expecting it now. By sun-high your markers stand on the far side of Thornmarsh.' + fightLine(f)); } add('mood', -1); if (S.zones.thornmarsh.owner === 'thunder') S.zones.thornmarsh.owner = 'shadow'; return P('ShadowClan was waiting in the pines. It is a long, bitter morning, and at the end of it their markers still stand.' + fightLine(f)); } },
      { t: 'Re-mark the line and post a guard.', go: () => { S.scent = 3; rel('shadow', -1); return P('Your warriors scrub the ShadowClan scent off with their own. For a quarter-moon two cats sit at the alder day and night. The markers do not move again.'); } },
      { t: 'Raise it at the Gathering.', go: () => { flag('offence_shadow', 'moving the border markers by night'); return P('You will make Adderstar explain himself under the full moon.'); } },
      { t: 'Let them have the strip. It\'s sour ground.', go: () => { rel('shadow', 1); add('mood', -2); if (S.zones.thornmarsh.owner === 'thunder') S.zones.thornmarsh.owner = 'shadow'; return P('Adderstar takes your silence as weakness, as you knew he would. Your warriors take it as worse.'); } },
      { t: 'Walk the line alone at sun-high, marking every tree, and dare them to stop you.', h: 'valiant', go: () => { add('honour', 1); rel('shadow', -1); if (chance(.7)) { S.zones.thornmarsh.owner = 'thunder'; add('mood', 2); logSaga(`${leaderName()} took Thornmarsh alone, by scent and stare.`); return P('ShadowClan cats watch you from the pines the whole way. Nobody comes out. By evening your scent runs the far edge of Thornmarsh, and it is yours.'); } const l = loseLife('ambushed by ShadowClan in Thornmarsh'); return P(l === 'lost' ? `Four of them come out at once. You kill none of them, and one of them kills you, once. ${S.lives} lives remain.` : 'Four of them come out at once, and you fight your way home, somehow alive.'); } },
      { t: 'Move their markers back, and two fox-lengths further.', h: 'ambitious', go: () => { S.zones.thornmarsh.owner = 'thunder'; rel('shadow', -3); add('dark', 1); add('mood', 1); return P('By morning ThunderClan holds all of Thornmarsh and a strip of pine-litter besides. Adderstar will come for it. Let him.'); } },
    ],
  },

  riverplea: {
    title: 'A plea across the water', art: 'river', seasons: [0, 2, 3],
    text: () => P(`Willowmoth comes back from the half-moon meeting at the Moonpool with her fur flat and her eyes troubled. RiverClan's medicine cat, Sedgeripple, begged her for help: whitecough in the RiverClan nursery, and their herb beds washed out by the floods.`,
      `${Q('Four bundles would save the kits. Maybe. I said I would ask you. I should have just given them.')}`),
    advice: () => ({ willowmoth: 'At the Moonpool there are no borders. I would rather we lived by that.', oakfang: 'RiverClan has stolen from us before and will again. Let Minnowstar beg herself.', hazelstride: 'RiverClan has fish. We could do with fish.' }),
    options: () => [
      { t: 'Give them the herbs.', req: () => S.herbs >= 4, why: 'Willowmoth has fewer than four bundles.', go: () => { S.herbs -= 4; rel('river', 2); add('favour', 1); add('honour', 1); return P('Willowmoth carries the bundles to the stepping-stones herself. The RiverClan kits live. Minnowstar does not say thank you, but at the next Gathering she nods to you first.'); } },
      { t: 'Give them the herbs, in exchange for fish.', req: () => S.herbs >= 4, why: 'Willowmoth has fewer than four bundles.', go: () => { S.herbs -= 4; add('prey', 9); rel('river', 1); return P('Minnowstar agrees before Willowmoth has finished asking. Fish turns out to be slippery and smelly and surprisingly filling.'); } },
      { t: 'Refuse. ThunderClan\'s herbs are for ThunderClan.', go: () => { rel('river', -1); add('favour', -1); return P('Willowmoth goes very still. Then she nods, and goes back to her den, and you hear her sorting leaves late into the night.'); } },
      { t: 'Send Willowmoth across the river to tend them herself.', h: 'kindred', go: () => { S.herbs = Math.max(0, S.herbs - 2); rel('river', 3); add('favour', 1); flag('wmAway'); logSaga('Willowmoth tended RiverClan\'s sick kits in their own camp.'); return P('She is gone for half a moon, and ThunderClan feels her absence. When she comes back she brings the smell of fish and the gratitude of every queen in RiverClan.'); } },
      { t: 'Give half, and ask Sedgeripple which Clan dammed the stream that flooded their beds.', h: 'shrewd', req: () => S.herbs >= 2, why: 'Willowmoth has fewer than two bundles.', go: () => { S.herbs -= 2; rel('river', 1); rel('shadow', -1); flag('offence_shadow', 'damming the stream and flooding RiverClan'); return P('Sedgeripple goes very quiet, then very angry. ShadowClan, it turns out, has been moving stones in the stream to make a fishing pool. Now RiverClan knows, and so do you.'); } },
    ],
  },

  skyquestion: {
    title: 'A young leader\'s question', art: 'lake', seasons: [0, 1, 2],
    text: () => P(`On your way back from the lake shore, Wrenstar of SkyClan falls into step beside you. She is very small, and very new, and she does not seem to know what to do with her tail.`,
      `${Q('StarClan gave me nine lives and no idea what to do with any of them. How do you know when to fight?')}`),
    advice: () => ({ rainpetal: 'A friend in SkyClan is worth having. They remember kindness. They remember the opposite too.', rookfeather: 'A weak neighbour is a gift. Don\'t waste it.', speckleback: 'SkyClan was lost once, you know. Driven out of the old forest, and nobody stood up for them. They have long memories.' }),
    options: () => [
      { t: 'Tell her the truth: you don\'t always know either.', go: () => { rel('sky', 2); add('honour', 1); return P('She looks at you with something like relief. "Nobody else would say that." From then on, when SkyClan is uncertain, SkyClan comes to you.'); } },
      { t: '"Fight early and hard, and you will not have to fight often."', go: () => { rel('sky', 1); flag('skyBold'); return P('She takes it to heart. Within a season SkyClan is skirmishing with ShadowClan, and doing well, and other Clans are watching them with new eyes.'); } },
      { t: 'Tell her what Bluestar learned too late: a leader carries everything, but not alone.', h: 'steadfast', go: () => { rel('sky', 2); add('favour', 1); return P('Wrenstar is quiet the rest of the walk. At the border she touches her nose to your shoulder, the way an apprentice does to a mentor.'); } },
      { t: 'Let SkyClan lean on ThunderClan, for a price: their share of the lake shore.', h: 'ambitious', go: () => { add('dark', 1); add('prey', 6); rel('sky', -1); flag('skyDebt'); return P('She agrees, because she does not know any better yet. One day she will, and she will remember who taught her.'); } },
    ],
  },

  rogues: {
    title: 'Collars with teeth', art: 'twoleg', artOpts: { other: 'black' }, seasons: [1, 2, 3],
    text: () => P(`A band of rogues has come out of the Twoleg places beyond the Greenway: six or seven of them, lean and confident, led by a tabby called Scrape who wears a collar studded with something that clicks when he walks.`,
      `They are taking prey from your territory in daylight. Scrape tells your patrol, grinning, that his mother's mother's mother followed a little black cat called Scourge, and that the forest Clans owe his kin a debt.`),
    advice: () => ({ speckleback: 'Scourge. That collar. StarClan help us.', oakfang: 'Drive them out now, before they learn our patrols.', rainpetal: 'Warn the other Clans. If they\'re here, they\'ll be everywhere soon.' }),
    options: () => [
      { t: 'Drive them out with every warrior you have.', go: () => { const f = fight({ sent: Math.min(10, S.cats.warriors), foe: 7 }); if (f.won) { add('mood', 2); add('honour', 1); logSaga('ThunderClan drove a rogue band out of the forest.'); return P('Rogues fight dirty and they fight for themselves, and that is why they lose. Scrape is the last to run, and he goes with his collar torn half off.' + fightLine(f)); } S.prey = Math.max(0, S.prey - 8); return P('They fight like nothing you have seen: no Code, no mercy, every claw for itself. You drive them back to the Greenway, but they will return.' + fightLine(f)); } },
      { t: 'Pay them in fresh-kill to stay beyond the Greenway.', req: () => S.prey >= 8, why: 'Needs 8 fresh-kill.', go: () => { S.prey -= 8; add('mood', -1); add('honour', -1); return P('Scrape takes the prey and laughs. He stays beyond the Greenway, for now.'); } },
      { t: 'Warn every Clan at the Gathering and propose they be driven out together.', go: () => { OTHER_CLANS.forEach(id => rel(id, 1)); add('honour', 1); return P('Every leader goes quiet at the name Scourge. For a while, at least, the Clans are thinking about the same enemy.'); } },
      { t: 'Offer them a place, if they will learn the Code.', h: 'kindred', go: () => { if (chance(.55)) { addCats('warriors', 2); add('mood', -1); logSaga('Two rogues joined ThunderClan and swore to the Code.'); return P('Scrape spits and leaves. But two of the younger ones stay behind, thin and wary, and ask what the Code is. You tell them. They take warrior names by leaf-fall.'); } return P('Scrape laughs in your face. "The Code is how you lot keep each other on a leash." They leave, and they keep stealing.'); } },
      { t: 'Offer them a place as your claws, Code or no Code.', h: 'ambitious', go: () => { addCats('warriors', 3); add('dark', 2); add('mood', -2); add('honour', -2); flag('rogueClaws'); logSaga(`Rogues joined ThunderClan at ${leaderName()}'s invitation, sworn to the leader and not to the Code.`); return P('Scrape likes the offer. His band moves into the hollow and the Clan moves away from them. They are good fighters. They are yours, not ThunderClan\'s.'); } },
    ],
  },

  lostkit: {
    title: 'Found on the moor', art: 'moor', seasons: [0, 1, 2],
    cond: () => S.cats.kits > 0,
    vars: () => ({ n: kitPre() }),
    text: v => P(`A WindClan patrol is waiting at the stream with a bedraggled bundle of fur held by its scruff: ${v.n}kit, missing since dusk, found shivering in a rabbit hole two tail-lengths past the border.`,
      `Kestrelstar's deputy sets the kit down on your side of the water. The whole patrol is watching to see what you will say.`),
    advice: () => ({ rainpetal: 'Thank them. Properly. They could have kept the kit, or left it.', rookfeather: 'Funny how a kit gets that far onto the moor on its own.', oakfang: 'Whatever you say, they\'ll carry it to Kestrelstar word for word.' }),
    options: v => [
      { t: 'Thank them warmly, before your own warriors.', go: () => { rel('wind', 2); return P(`${v.n}kit is passed from cat to cat until Rainpetal has her. The WindClan patrol goes home with their tails high.`); } },
      { t: 'Thank them, briefly. A kit returned is only what the Code demands.', go: () => { rel('wind', 0); add('honour', 1); return P('Correct, and cool. The WindClan cats nod and go.'); } },
      { t: 'Ask them, loudly, how a kit came to be so far onto their moor.', go: () => { rel('wind', -2); add('mood', 1); add('dark', isHeart('ambitious') ? 0 : 1); return P('The WindClan deputy\'s fur rises. "We bring your kit home, and you call us thieves?" They leave without another word, and Kestrelstar will hear every one of yours.'); } },
      { t: 'Give them a rabbit from ThunderClan\'s pile, by the old custom.', h: 'kindred', req: () => S.prey >= 3, why: 'Needs 3 fresh-kill.', go: () => { S.prey -= 3; rel('wind', 3); return P('Nobody remembers when the custom started: a kit returned, a meal given. The WindClan cats are startled, then moved. Kestrelstar speaks well of you for seasons.'); } },
    ],
  },

  flood: {
    title: 'Water in the hollow', art: 'flood', seasons: [0],
    text: () => P(`Rain for six days. On the seventh, the stream above the hollow breaks its banks and pours down the rock face into the camp. By dusk the clearing is a pond, the nursery is up to the queens' bellies, and the fresh-kill pile is floating.`),
    advice: () => ({ oakfang: 'Get everyone onto the high rocks. The rest can be rebuilt.', hazelstride: 'We can still save the pile if we\'re quick.', rainpetal: 'The kits first. Then the elders. Then whatever you like.' }),
    options: () => [
      { t: 'Everyone to the high rocks. Let the water have the rest.', go: () => { S.prey = Math.floor(S.prey * .5); S.herbs = Math.floor(S.herbs * .6); add('camp', -1); return P('The Clan spends two nights huddled on the rocks under the Highledge, soaked and silent. Nobody drowns. When the water drains, half the fresh-kill and most of the dens are gone.'); } },
      { t: 'Save the kits, then the herbs, then the fresh-kill.', odds: () => .6, go: () => { S.prey = Math.floor(S.prey * .7); if (chance(.6)) return P('It is a long, frantic, freezing night. The kits are safe first, then Willowmoth\'s store, then most of the pile.'); killCats(1, ['warriors']); return P('The water rises faster than anyone guessed. A warrior goes back for one more piece of fresh-kill and the current takes him.'); } },
      { t: 'Ask RiverClan how they live with water.', req: () => S.clans.river.att >= 0, why: 'RiverClan would not help you now.', go: () => { rel('river', 1); add('camp', 1); return P('Minnowstar sends two warriors, amused and genuinely helpful. They show your Clan how to dig channels and raise the dens on stones. The hollow will never flood this badly again.'); } },
      { t: 'Carry every kit up to the Highledge yourself, through the current.', h: 'steadfast', go: () => { add('mood', 3); S.prey = Math.floor(S.prey * .6); let t = 'Back and forth, with a kit in your jaws and the water at your chest. The Clan watches you do it, and joins you.'; if (chance(.25)) { const l = loseLife('drowned saving kits from the flood'); if (l === 'lost') t += ` On the last trip the current takes you. You wake on the rocks with water in your lungs, one life fewer. ${S.lives} remain.`; } return P(t); } },
    ],
  },

  fire: {
    title: 'Smoke over the Sky Oak', art: 'fire', seasons: [1],
    text: () => P(`A dry greenleaf, and then a Twoleg leaves fire burning beyond the Greenway. By evening the wind has turned it toward the forest. Smoke rolls over the hollow, and the birds are flying the wrong way.`,
      `Every elder in the Clan remembers the same story: the fire in the old forest that killed Yellowfang, who went back for the ones who could not run.`),
    advice: () => ({ oakfang: 'To the lake. Fire can\'t follow us into water.', willowmoth: 'I am not leaving without my herbs.', speckleback: 'The old ones go last and slowest. Carry us or leave us; just decide quickly.' }),
    options: () => [
      { t: 'Everyone to the lake shore, now. Carry the elders.', go: () => { S.prey = Math.floor(S.prey * .5); add('mood', -1); return P('The Clan runs through smoke with the kits in their jaws and the elders leaning on warriors\' shoulders. You stand in the shallows all night, watching the glow. At dawn the wind turns. The fire stops at the Sky Oak. The hollow stands.'); } },
      { t: 'Send the Clan to the lake; keep a patrol back to save the herb store.', go: () => { S.prey = Math.floor(S.prey * .5); if (chance(.7)) return P('Willowmoth and two warriors come out of the smoke with jaws full of leaves. Most of the store is saved.'); killCats(1, ['warriors']); S.herbs = Math.floor(S.herbs * .5); return P('Only Willowmoth comes out of the smoke. She does not speak for a long time.'); } },
      { t: 'Stay last in the hollow and make sure no cat is left behind.', h: 'steadfast', go: () => { add('mood', 2); add('favour', 2); let t = 'You check every den yourself. In the elders\' den you find old Speckleback refusing to move, and you carry her out in your jaws while she complains.'; if (chance(.35)) { const l = loseLife('burned in the fire'); if (l === 'lost') t += ` The smoke closes over you at the hollow's mouth. You walk out of the stars a moment later, coughing, one life fewer. ${S.lives} remain.`; } return P(t); } },
    ],
  },

  kitsgame: {
    title: 'The kits\' game', art: 'hollow', seasons: [0, 1, 2],
    cond: () => S.cats.kits >= 2,
    text: () => P(`In the clearing the kits are playing at legends. Two of them are arguing about who has to be Tigerstar. Nobody ever wants to be Tigerstar. The smallest one has a dog-tooth from somewhere and is being Scourge with great enthusiasm.`),
    advice: () => ({ speckleback: 'They have it all wrong, of course. Nobody\'s told them properly.', rainpetal: 'Let them play. They\'ll be warriors soon enough.' }),
    options: () => [
      { t: 'Sit down and tell them how it really happened.', go: () => { add('mood', 1); const next = LEGEND_ORDER.find(l => !S.legends.includes(l)); if (next) { S.legends.push(next); return P(`You tell them <em>${LEGENDS[next].name}</em>, as Speckleback once told it to you. By the end even the warriors have drifted over to listen.`); } return P('You tell it to them properly. The kit playing Scourge is very disappointed by the ending.'); } },
      { t: 'Join in. Somebody has to be Tigerstar.', go: () => { add('mood', 2); return P('You are, the kits agree, the best Tigerstar there has ever been, mostly because you fall over when Scourge hits you. The whole Clan watches. Somebody laughs so hard they choke on a vole.'); } },
      { t: 'Take the dog-tooth away. Some things aren\'t for playing.', go: () => { add('honour', 1); return P('The kits are crestfallen. Speckleback nods at you, slowly.'); } },
    ],
  },

  mourning: {
    title: 'A warrior\'s vigil', art: 'vigil', seasons: [0, 1, 2, 3],
    vars: () => ({ n: warName() }),
    text: v => P(`${v.n} died at dusk: an old wound gone bad, nothing anyone could have stopped. Now the body lies in the clearing with the fur smoothed and rosemary pressed into it, and the Clan is gathering in the dark to sit vigil.`,
      `It is your task to speak first.`),
    advice: () => ({ willowmoth: 'Speak to StarClan, not to us. They are listening tonight.', oakfang: 'Say what was true about them. That\'s all any of us want.', rainpetal: 'The young ones have never seen a vigil. They\'re frightened.' }),
    options: v => [
      { t: `Speak of ${v.n}'s life, and ask StarClan to welcome a warrior home.`, go: () => { killCats(1); add('favour', 2); add('mood', 1); return P(`You speak, and then you are silent, and then the Clan shares tongues with ${v.n} one last time, all through the cold night. At dawn the elders carry the body out. Above the hollow, a star you have not noticed before is burning in Silverpelt.`); } },
      { t: 'Keep it short. The Clan needs its sleep.', go: () => { killCats(1); add('mood', -1); return P('The vigil is short and the Clan is quiet about it the next morning. The young ones look at you sideways.'); } },
      { t: 'Let the apprentices sit vigil too, and teach them what it means.', go: () => { killCats(1); add('honour', 1); add('mood', 1); return P('They are frightened at first, and then they are not. By dawn they understand something about the Clan they did not know at dusk.'); } },
    ],
  },

  halfmoon: {
    title: 'What the medicine cats said', art: 'moonpool', artOpts: { spirits: 1 }, seasons: [0, 1, 2, 3],
    vars: () => ({ c: pick(OTHER_CLANS) }),
    text: v => P(`Willowmoth returns from the half-moon meeting at the Moonpool and comes straight to your den. Medicine cats have no borders; that is the point of them. Even so, she lowers her voice.`,
      `${Q(`${cn(v.c)}'s medicine cat had a dream she did not want to share. ${ldr(v.c)} is ${S.clans[v.c].att <= -1 ? 'talking about ThunderClan in his den at night' : 'worried about the coming leaf-bare'}. That is all I can say without betraying her.`)}`),
    advice: () => ({ willowmoth: 'I have told you more than I should. Do not make me regret it.', rookfeather: 'So ask her for the rest.' }),
    options: v => [
      { t: 'Thank her, and ask nothing more.', go: () => { add('favour', 1); flag('warned_' + v.c); return P('Willowmoth relaxes. You have your warning; she has her honour.'); } },
      { t: 'Press her for everything.', go: () => { add('favour', -1); add('dark', 1); flag('intel_' + v.c); return P(`She tells you. ${cn(v.c)} has ${S.clans[v.c].str} warriors and ${S.clans[v.c].sick ? 'sickness in its nursery' : 'a healthy nursery'}. Then she leaves your den without being dismissed, and does not come back that night.`); } },
      { t: 'Send a gift to their medicine cat: herbs, from one healer to another.', h: 'kindred', req: () => S.herbs >= 2, why: 'Willowmoth has fewer than two bundles.', go: () => { S.herbs -= 2; rel(v.c, 2); return P(`Willowmoth carries it herself. ${cn(v.c)}'s medicine cat will tell her leader where it came from.`); } },
    ],
  },

  rival: {
    title: 'A challenge in the clearing', art: 'hollow', seasons: [0, 1, 2, 3],
    cond: () => (S.year >= 2 || S.season >= 2) && S.deputy !== 'rookfeather',
    text: () => P(`Rookfeather has been talking. Not to you: around you, to the young warriors, at the fresh-kill pile and on patrol. Today he says it out loud in the middle of the clearing: that ThunderClan has grown soft, that the borders shrink every season, that ${leaderName()} is not the leader StarClan meant.`,
      `Half the young warriors are watching you. So is ${deputyName()}.`),
    advice: () => ({ oakfang: 'He\'s a good warrior with a bad mouth. Give him something to do with it.', rainpetal: 'Don\'t shame him. Shame makes cats dangerous.', speckleback: 'Every leader has a Rookfeather. Tigerstar was somebody\'s Rookfeather once.' }),
    options: () => [
      { t: 'Rebuke him, before the whole Clan.', go: () => { add('honour', 1); if (chance(.5)) { add('mood', 1); return P('He takes it with his ears flat and his tail lashing. But he takes it.'); } add('mood', -2); return P('He takes it. The young warriors take it worse. For a moon the warriors\' den is divided.'); } },
      { t: 'Give him a task worthy of his pride: lead the next border war party.', go: () => { add('mood', 1); flag('rookLeads'); return P('Rookfeather is startled into silence, then into fierce gratitude. He will lead the next war party, and he means to make it legendary.'); } },
      { t: 'Exile him.', go: () => { killCats(1); S.stats.died--; add('mood', -2); add('honour', -1); logSaga('Rookfeather was driven from the Clan.'); return P('He goes without fighting, which is somehow worse. Some of the young warriors watch the path he took for a long time.'); } },
      { t: 'Spar with him in the training hollow, in front of everyone.', h: 'valiant', odds: () => .7, go: () => { if (chance(.7)) { add('mood', 2); add('honour', 1); return P('You put him on his back three times, claws sheathed, and on the third time you offer him your paw to get up. He takes it. He has followed you without a word since.'); } add('mood', -2); return P('He is younger and faster. You lose. You do not lose your temper, which is all that saves the moment, and only just.'); } },
      { t: 'Ask him, quietly and alone, what he would do in your place.', h: 'shrewd', go: () => { add('mood', 1); return P('He has thought about it. Some of it is foolish. Some of it is not. You use the parts that are not, and you tell the Clan whose ideas they were. Rookfeather has nothing left to complain about, and knows it.'); } },
      { t: 'Tell him he is right, and that you will need warriors like him for what comes next.', h: 'ambitious', go: () => { add('mood', 1); add('dark', 1); flag('rookSworn'); return P('His eyes light up. He was never against you; he was waiting for you. The young warriors follow him, and he follows you.'); } },
    ],
  },

  twolegfood: {
    title: 'Food from Twoleg hands', art: 'twoleg', seasons: [2, 3],
    text: () => P(`At the edge of the Greenway an old Twoleg has started leaving food out: hard brown pellets in a bowl, and sometimes scraps of something that smells like meat. An apprentice ate some yesterday. Now the others want to know whether they can.`,
      `It is leaf-bare, or near enough. The fresh-kill pile is ${S.prey < 15 ? 'thin' : 'holding'}.`),
    advice: () => ({ oakfang: 'Warriors hunt their own food. That food comes with a collar.', hazelstride: 'I\'ve never caught anything that easy.', willowmoth: 'It won\'t kill them. Whether it makes them less ThunderClan is not a question for herbs.' }),
    options: () => [
      { t: 'Forbid it. Warriors hunt their own prey.', go: () => { add('honour', 1); add('mood', -1); return P('The apprentices sulk. The warriors approve. Speckleback tells a long story about a kittypet who got fat and stupid, which is only partly about Firestar and mostly made up.'); } },
      { t: 'Allow it for the elders and kits, only until newleaf.', go: () => { add('prey', 6); add('honour', -1); return P('Nobody talks about it. The elders eat well for the first leaf-bare in moons.'); } },
      { t: 'Leave the bowl alone, and hunt the rats that come to it.', h: 'shrewd', go: () => { add('prey', 7); return P('Rats come for the Twoleg food at dusk, slow and fat. ThunderClan does not touch the bowl, and dines on what does.'); } },
    ],
  },

  hawk: {
    title: 'Shadow on the clearing', art: 'hollow', seasons: [0, 1],
    cond: () => S.cats.kits > 0,
    text: () => P(`A hawk has been circling the hollow for three days. Today it dropped. Rainpetal got there first, and there was a moment of shrieking and feathers, and the hawk went up empty. But it is still circling.`),
    advice: () => ({ rainpetal: 'Keep the kits in the nursery until it\'s gone. All of them.', hazelstride: 'Hawks nest. Find the nest and it\'ll go elsewhere.' }),
    options: () => [
      { t: 'Keep the kits in the nursery until it gives up.', go: () => { add('mood', -1); return P('A quarter-moon of bored, furious kits. The hawk leaves. Nobody is taken.'); } },
      { t: 'Send Hazelstride to find its nest.', odds: () => .6, go: () => { if (chance(.6)) { add('mood', 1); return P('She finds it high in a beech at the far edge of the Oakwood, and the patrol makes such a racket under it that the hawks move to the hills.'); } killCats(1, ['kits']); add('mood', -2); return P('They search for two days. On the third, the hawk drops again, and this time nobody gets there first.'); } },
    ],
  },

  badgerseer: {
    title: 'The badger who remembers', art: 'badger', seasons: [0, 1, 2],
    cond: () => S.zones.ravine.explored,
    text: () => P(`The old badger of the ravine has come out at dusk and is sitting on her haunches at the bottom of the rock, looking straight up at you. She does not snarl. She speaks, slowly, in a voice like stones grinding: cat-words, badly shaped, but words.`,
      `${Q('My mother\'s mother\'s mother knew cats. She saw far. I see a little. You will want to hear what I see.')}`),
    advice: () => ({ speckleback: 'Midnight. That\'s what they called the badger of the old stories, the one who spoke with cats and sent them to the sun-drown place. I never thought...', oakfang: 'A badger is a badger. Don\'t go down there.' }),
    options: () => [
      { t: 'Climb down and listen.', go: () => { add('favour', 2); flag('badgerWords'); return P(`She looks at you a long time. ${Q('Water stops. Cold comes. A cat alone dies alone. A Clan alone dies alone. Five together, maybe not.')} She goes back into her sett. You are shaking, and not from cold.`); } },
      { t: 'Listen from the rocks, safely out of reach.', go: () => { add('favour', 1); return P(`She snorts at your caution. ${Q('Cold is coming. Make friends before it.')} Then she is gone.`); } },
      { t: 'Drive her away. Badgers don\'t prophesy.', go: () => { add('favour', -1); return P('She goes. You will never know what she meant to say.'); } },
    ],
  },

  storm: {
    title: 'The night the Sky Oak was struck', art: 'forest', artOpts: { time: 'night' }, seasons: [1, 2],
    text: () => P(`A greenleaf storm, the kind that comes over the hills like a war party. Lightning strikes the forest so close that the hollow walls ring. In the morning a patrol finds a great limb torn from an oak, and on the scorched wood beneath it, a pattern that looks very much like a cat's paw-print.`),
    advice: () => ({ willowmoth: 'StarClan has sent us a sign. I need time to read it.', rookfeather: 'It\'s a burnt tree.', speckleback: 'ThunderClan. Thunder. Lightning. I\'m only saying.' }),
    options: () => [
      { t: 'Ask Willowmoth to read the sign.', go: () => { if (chance(.5)) { add('favour', 2); add('mood', 1); return P('She sits with it a full day. "StarClan is with us," she announces at last, and the whole Clan breathes out.'); } add('mood', -1); return P('She sits with it a full day. "It means danger from above," she says. The Clan spends a nervous moon looking up.'); } },
      { t: 'Declare it a blessing on ThunderClan before the whole Clan.', go: () => { add('mood', 2); add('favour', -1); return P('The Clan yowls itself hoarse. Willowmoth gives you a long look: a sign is StarClan\'s to explain, not yours.'); } },
      { t: 'Have the paw-mark carried back to the hollow and kept.', go: () => { add('honour', 1); add('favour', 1); flag('stormMark'); return P('The charred wood sits by the Highledge now. New apprentices touch it with their noses before their first patrol. Nobody decided that; it simply began.'); } },
    ],
  },
};

/* Fallback: a season with no great trouble */
EV.quiet = {
  title: 'A quiet moon', art: 'hollow', once: false, w: .01,
  text: () => P(`For once, nothing goes wrong. The patrols come home with prey and without wounds. The kits wrestle, the elders complain, and the moon rises over a hollow that is, for the moment, at peace.`),
  advice: () => ({ speckleback: 'Enjoy it. It never lasts.' }),
  options: () => [
    { t: 'Walk the territory alone at moonrise.', go: () => { add('favour', 1); return P('You walk every border by yourself, the way leaders used to, and come home at dawn with leaf-mould on your paws and a clearer head.'); } },
    { t: 'Spend the evening sharing tongues with the Clan.', go: () => { add('mood', 1); return P('You eat with the warriors and listen to the apprentices boast. It is the kind of evening nobody remembers, which is the best kind.'); } },
  ],
};

/* ---------------- Exploration ---------------- */
const EXPLORE = {
  twolegnest: {
    title: 'The old Twoleg nest', art: 'twoleg', artOpts: { other: 'grey' },
    text: () => P(`The Twoleg nest at the edge of the territory has been empty so long that brambles grow through its windows. Behind it, inside a tumbledown fence, something smells sharp and sweet and green: a whole bed of catmint, run wild, enough to treat a Clan through ten leaf-bares.`),
    advice: () => ({ willowmoth: 'Catmint. Do you understand what this means? This is greencough, beaten.' }),
    options: () => [
      { t: 'Mark it as ThunderClan land.', go: () => { claimZone('twolegnest'); flag('catmint'); add('herbs', 4); return P('By sundown ThunderClan scent is on every post of that fence. Willowmoth comes home with her jaws full and her eyes bright.'); } },
      { t: 'Mark it, and dig some roots to plant in the hollow.', h: 'shrewd', go: () => { claimZone('twolegnest'); flag('catmint'); add('herbs', 7); return P('A patch by the medicine den, and the catmint takes. Close to home is always better.'); } },
    ],
  },
  skyoak: {
    title: 'Beneath the Sky Oak', art: 'forest', artOpts: { time: 'dawn' },
    text: () => P(`The Sky Oak is the tallest tree in the forest, and at its roots, under centuries of moss, your patrol finds marks: claw-scores, deep and old, arranged in rows. Some are the marks of cats. One set is far too large for any cat that ever lived at the lake.`,
      `Willowmoth runs her paw along them for a long time. ${Q('These were made before the Clans came here. Before the Clans had names, maybe.')}`),
    advice: () => ({ willowmoth: 'Lay your claws in them. Let whoever made them know you.', oakfang: 'Add ours. Let whoever comes next know who held this ground.' }),
    options: () => [
      { t: 'Lay your claws in the oldest marks.', go: () => { claimZone('skyoak'); add('favour', 3); return P('Your claws fit the marks as if they were cut for you. The wind stops. Somewhere very high above, the oak creaks like something waking.'); } },
      { t: 'Add ThunderClan\'s mark beneath them.', go: () => { claimZone('skyoak'); add('honour', 1); add('mood', 1); return P('Every warrior on the patrol adds a score. The Sky Oak is ThunderClan\'s, and now it says so.'); } },
    ],
  },
  ravine: {
    title: 'What lives in the ravine', art: 'badger',
    text: () => P(`Echo Ravine is everything the elders said: sheer rock, rich prey, and every footstep coming back twice. At the bottom, in a sett dug under a fallen slab, lives a badger. An old she-badger, grey-muzzled, who looks up at your patrol without any fear at all.`),
    advice: () => ({ oakfang: 'A badger that close to the hollow? Drive it out or we\'ll lose kits.', speckleback: 'An old badger. Hm. There are stories about old badgers.' }),
    options: () => [
      { t: 'Drive the badger out.', go: () => { const f = fight({ sent: 6, foe: 8.5 }); if (f.won) { claimZone('ravine'); return P('It takes a whole patrol and a whole morning, and she goes at last, grumbling, over the ridge and away.' + fightLine(f)); } return P('She is enormous and unafraid, and your patrol retreats bloodied. The ravine stays hers.' + fightLine(f)); } },
      { t: 'Leave her the bottom of the ravine. Claim the rest.', go: () => { claimZone('ravine'); return P('Your markers run along the rim. The badger watches you lay them and goes back into her sett as if this were a sensible arrangement. Perhaps it is.'); } },
      { t: 'Sit at the rim and watch her, a long while.', go: () => { claimZone('ravine'); add('favour', 1); flag('badgerKnown'); return P('She watches you back. At last she makes a sound that is almost a word, and disappears. You have the strangest feeling you will meet her again.'); } },
    ],
  },
  greenway: {
    title: 'Along the Greenway', art: 'twoleg', artOpts: { other: 'black' },
    text: () => P(`The Greenway is an old Twoleg path gone to grass, straight as a stream, running past the Sky Oak toward the hills. Under it, in the stonework, rats have built a city. And along it, every few days, Twolegs walk with dogs.`),
    advice: () => ({ hazelstride: 'All those rats. All of them.', oakfang: 'All those dogs.' }),
    options: () => [
      { t: 'Claim it, and hunt the rats.', go: () => { claimZone('greenway'); add('prey', 6); return P('The first patrol comes home staggering under rats. The second meets a dog, and runs. The Greenway is yours, mostly.'); } },
      { t: 'Explore it, but leave it unclaimed. Dogs are not worth it.', go: () => { S.zones.greenway.explored = true; return P('You mark where the danger is and turn back. Maybe later.'); } },
    ],
  },
};
function claimZone(z) { S.zones[z].explored = true; S.zones[z].owner = 'thunder'; logSaga(`ThunderClan claimed ${ZONES[z].name}.`); }

/* ---------------- Scripted beats ---------------- */
const SCRIPT_AT = { '1-1': 'prophecy', '2-2': 'omen', '3-2': 'firstice' };
const SCRIPT = {
  c1: {
    title: 'The path to the Moonpool', art: 'moonpool', artOpts: { spirits: 0 }, kicker: 'The night before newleaf',
    text: () => P(`Beechstar is dead. The old leader lost the last of her lives to the cough that came with the snow, and the Clan buried her at dawn beneath the Sky Oak. You were her deputy. ThunderClan is yours now, if StarClan will give it to you.`,
      `Willowmoth leads you up out of the forest, along the stream that marks the WindClan border, into the hills where the stars feel close enough to touch. The last of the path is worn into the stone in little hollows, paw-print by paw-print, by cats who walked it before there were Clans at all. You set your paws in theirs.`,
      `At the top, water spills over a lip of rock into a pool so still that Silverpelt lies in it whole.`),
    advice: () => ({ willowmoth: 'Lie down. Touch your nose to the water. Whatever comes, do not be afraid. They have been waiting for you.' }),
    options: () => [{ t: 'Lie down by the water, touch your nose to the stars, and sleep.', go: () => ({ text: P('Cold, sharp as a thorn, and then nothing. Then light.'), queue: [{ k: 'script', id: 'c2' }] }) }],
  },
  c2: {
    title: 'Nine cats out of the stars', art: 'moonpool', artOpts: { spirits: 5 }, kicker: 'The leader\'s ceremony',
    text: () => P(`You are standing on the water, and it holds you. All around the pool, cats are coming down out of Silverpelt, starlight caught in their fur, their eyes like frost.`,
      `The first is Beechstar, young again. She touches her nose to your head and the life goes into you like a blow. ${Q('With this life I give you endurance. You will need it.')}`,
      `Then four more step forward together, cats from the legends, cats the elders sing about. Each offers you a gift with a life, and you will take all of them. But one will burn brighter than the rest; one will become the heart you lead with. And at the very edge of the pool, where no star is reflected, something else is waiting to be chosen.`,
      `<span class="quiet">This choice shapes your leader for the whole saga: the choices you are offered, how your Clan and its neighbours see you, and how you will be remembered.</span>`),
    options: () => Object.keys(HEARTS).map(h => ({ t: `${HEARTS[h].patron}: ${HEARTS[h].gift}`, heartCard: h, why2: HEARTS[h].effect, go: () => chooseHeart(h) })),
  },
  c3: {
    title: 'The ninth life', art: 'moonpool', artOpts: { spirits: 7 }, kicker: 'The leader\'s ceremony',
    text: () => {
      const others = Object.keys(HEARTS).filter(h => h !== S.player.heart && h !== 'ambitious').map(h => HEARTS[h].patron);
      return P(`The others come in turn: ${others.join(', ')}, each with a life that burns going in. Silverstream of RiverClan, with a life for the love of kits. Old warriors you knew as a kit yourself, with lives for patience and for loyalty. Eight lives, and you can hardly stand.`,
        `The ninth cat is a flame-coloured tom with green eyes, and the others make way for him. Firestar. ${Q(`With this life I give you hope, because a Clan can bear anything except the loss of it. Your old name is finished. StarClan names you ${leaderName()}. Lead your Clan with all nine.`)}`,
        `The stars take up your name, over and over, until the whole of Silverpelt is chanting it. And then, under the chanting, Firestar leans close, and his voice changes.`,
        `${Q('Listen. When the lake forgets to move, five must share one heart, or the stars will forget your names.')}`);
    },
    options: () => [{ t: `Rise as ${leaderName()}.`, go: () => { logSaga(`${warriorName()} received nine lives at the Moonpool and became ${leaderName()}.`); return { text: P('The stars fade. The cold comes back. You are lying on stone, wet-nosed, and Willowmoth is leaning over you.'), queue: [{ k: 'script', id: 'c4' }] }; } }],
  },
  c4: {
    title: 'Waking', art: 'moonpool', artOpts: { spirits: 0, time: 'dawn' }, kicker: 'Dawn at the Moonpool',
    text: () => P(`${Q(`${leaderName()},`)} Willowmoth says, trying out the name. ${Q('They gave you something more than lives. I can see it in your face. What did they tell you?')}`),
    advice: () => ({ willowmoth: 'A prophecy shared is a prophecy halved. Or doubled. I have never been sure which.' }),
    options: () => [
      { t: 'Tell her every word.', go: () => { flag('toldWM'); add('favour', 1); return { text: P(`She listens, and repeats it under her breath until she has it. ${Q('The lake. Five. One heart.')} She looks down at the water a long time. ${Q('I will think on it. Let us go home. They are waiting.')}`), queue: [{ k: 'script', id: 'deputy' }] }; } },
      { t: 'Keep it to yourself, for now.', go: () => { flag('secretProphecy'); return { text: P('She does not press you. Medicine cats know about secrets. You walk home in silence, and the words go round and round in your head.'), queue: [{ k: 'script', id: 'deputy' }] }; } },
    ],
  },
  deputy: {
    title: 'Before moonhigh', art: 'hollow', artOpts: { time: 'night' }, kicker: 'The Stone Hollow',
    text: () => P(`The whole Clan is waiting in the clearing when you come down into the hollow. They yowl your new name until the rock walls ring with it.`,
      `Then they wait. A new leader names a new deputy before moonhigh, under the eyes of StarClan. It is the first thing you will do as ${leaderName()}, and every cat in ThunderClan will read something into it.`),
    advice: () => ({ oakfang: 'I\'ve served three leaders. I\'ll serve you whether you name me or not. Just name someone who will hold the line.', hazelstride: 'Name whoever you like, as long as the fresh-kill pile doesn\'t suffer for it.', rookfeather: 'I\'m young. Tigerstar was young. Firestar was young. Young is what leaders are made of.', rainpetal: 'Whoever you choose, choose someone the young ones will follow.' }),
    options: () => ['oakfang', 'hazelstride', 'rookfeather'].map(id => ({
      t: `Name ${COUNCIL[id].name}. ${{ oakfang: 'Steady, loyal, old in the Code. War parties fight harder under him.', hazelstride: 'The best hunter in the Clan. The fresh-kill pile will never be emptier for it.', rookfeather: 'Proud and quick. The young warriors would follow him anywhere.' }[id]}`,
      go: () => { S.deputy = id; flag('started'); if (id === 'rookfeather') add('mood', 1); if (id === 'oakfang') add('honour', 1); logSaga(`${COUNCIL[id].name} was named deputy of ThunderClan.`);
        const t = { oakfang: 'Oakfang dips his head, and the older warriors nod as if a stone had been set in its proper place.', hazelstride: 'Hazelstride\'s whiskers twitch. "Well. I suppose I\'ll have to organise the dawn patrols as well as catch them."', rookfeather: 'Rookfeather\'s eyes blaze. The young warriors yowl. Oakfang says nothing, which says a great deal.' }[id];
        startSeason(); return P(`${Q(`I say these words before StarClan, that the spirits of our ancestors may hear and approve my choice. ${COUNCIL[id].name} will be the new deputy of ThunderClan.`)}`, t); },
    })),
  },

  prophecy: {
    title: 'Willowmoth\'s reading', art: 'lake', artOpts: { time: 'dusk' },
    text: () => P(F('secretProphecy') ? `Willowmoth finds you at the lake shore at dusk. ${Q('You never told me what they said at the Moonpool. I have been dreaming of this lake every night for a moon, and in every dream it is white and silent. I think it is time you told me.')} You tell her.` : `Willowmoth finds you at the lake shore at dusk. ${Q('I have been dreaming of this lake every night for a moon. In every dream it is white and silent. I think it is the first part of Firestar\'s words, and I think we must decide what the rest means.')}`,
      `${Q('When the lake forgets to move. Five must share one heart. Or the stars will forget your names.')} She says it slowly. ${Q('Tell me how you read it, and I will tell you if I think you are wrong.')}`),
    advice: () => ({ willowmoth: 'Prophecies are never about what they seem to be about. But they are never about nothing, either.', speckleback: 'In the old days it was always somebody\'s name. Fire. Lion. Tiger. Look for a name.' }),
    options: () => [
      { t: '"Five means the five Clans. We must make friends of all of them."', go: () => { flag('reading', 'unity'); add('favour', 1); return P(`Willowmoth is silent so long you think she disagrees. ${Q('That is the hardest reading. I think it is the true one.')}`); } },
      { t: '"Five means five warriors. A chosen patrol, sent somewhere."', go: () => { flag('reading', 'patrol'); return P(`${Q('Perhaps. StarClan has sent patrols before.')} She does not sound convinced.`); } },
      { t: '"It means a hard winter. We store prey, and hold the hollow."', go: () => { flag('reading', 'store'); add('prey', 4); return P(`${Q('That is the safe reading,')} she says. ${Q('Prophecies are seldom safe.')} But she helps you start a deeper store, in the cool cave behind the medicine den.`); } },
      { t: '"The lake forgets to move: ice. StarClan is warning us, and the warning is about all of us, not only ThunderClan."', h: 'shrewd', go: () => { flag('reading', 'unity'); add('favour', 2); return P(`Willowmoth stares at you. ${Q('Yellowfang chose well.')}`); } },
    ],
  },

  omen: {
    title: 'The star that did not go out', art: 'lake', artOpts: { time: 'night' },
    text: () => P(`Every cat at the lake sees it. A star falls out of Silverpelt, slowly, like a leaf, and drops into the middle of the lake by the Gathering island. And it does not go out. For three nights it glows under the water, white and cold, and then the first frost of leaf-fall comes, early and hard.`,
      `Willowmoth comes back from the Moonpool and says every medicine cat at the lake has dreamed the same dream: ice spreading outward from that star.`),
    advice: () => ({ willowmoth: 'The others will tell their leaders. Whatever we do, we will not be the only ones who know.', rookfeather: 'If everyone\'s afraid, the strong eat first.', rainpetal: 'Talk to the others. Please. Before fear does the talking.' }),
    options: () => [
      { t: 'Speak of it at the Gathering, and ask the other leaders what their medicine cats saw.', go: () => { OTHER_CLANS.forEach(id => rel(id, 1)); add('honour', 1); flag('omenShared'); return P('For once the five leaders talk about the same thing. Nobody agrees what it means. But they talk, and they remember who began it.'); } },
      { t: 'Keep your own counsel, and begin storing prey now.', go: () => { add('prey', 6); flag('reading', F('reading') || 'store'); return P('ThunderClan hunts hard through leaf-fall and asks nobody anything.'); } },
      { t: 'Keep vigil at the Moonpool and ask StarClan directly.', go: () => { add('favour', 2); return P(`StarClan does not explain. But you dream of five cats sitting close around a dying fire-coloured light, and of their breath mingling, and of all of them alive.`); } },
      { t: 'Tell the others ThunderClan has read the omen, and that it means ThunderClan should lead.', h: 'ambitious', go: () => { add('dark', 1); OTHER_CLANS.forEach(id => rel(id, -1)); flag('claimedOmen'); return P('Some of them believe you. All of them resent it.'); } },
    ],
  },

  firstice: {
    title: 'Ice at the lake\'s edge', art: 'lake', artOpts: { time: 'dawn' },
    text: () => P(`Leaf-fall, and already the lake has a skin of ice from shore to shore at dawn, thick enough to hold a mouse. The old cats have never seen it so early. The fish have gone deep. The birds have gone south. The rabbits on the moor are thin.`,
      `At the Gathering every leader is quieter than usual, and every Clan is counting its fresh-kill.`),
    advice: () => ({ rainpetal: 'If the leaders met, just the five of them, before leaf-bare... Minnowstar would come. Wrenstar would come.', oakfang: 'Fill the store. Every warrior hunting, every day, until the snow.', willowmoth: 'This is the first part. The lake is learning to forget.' }),
    options: () => [
      { t: 'Propose that the five leaders meet before leaf-bare and plan how to survive it together.', go: () => { const warm = OTHER_CLANS.filter(id => S.clans[id].att >= 0).length; if (warm >= 2) { flag('leaderCouncil'); OTHER_CLANS.forEach(id => rel(id, 1)); return P(`${warm === 4 ? 'All four' : warm === 3 ? 'Three' : 'Two'} of the other leaders agree to meet. The meeting is awkward, short and full of pride. But a thing has been said aloud that has never been said at the lake: that the Clans might have to share.`); } OTHER_CLANS.forEach(id => rel(id, -1)); return P('The other leaders look at each other. Nobody trusts ThunderClan enough to agree. The silence is worse than a refusal.'); } },
      { t: 'Order every warrior to hunt and store, every day, until the snow.', go: () => { add('prey', 12); add('mood', -1); return P('ThunderClan hunts itself thin. The cave behind the medicine den fills with frozen fresh-kill.'); } },
      { t: 'Walk to every Clan\'s camp yourself, and speak to each leader alone.', h: 'kindred', go: () => { flag('leaderCouncil'); OTHER_CLANS.forEach(id => rel(id, 2)); return P('It takes a quarter-moon. Kestrelstar listens. Minnowstar bargains. Wrenstar thanks you. Adderstar hears you out in a silence so long you think you have failed, and then he says, "I will come."'); } },
      { t: 'Strike now, while they are weak, and take their stores.', h: 'ambitious', go: () => { add('dark', 1); add('prey', 8); const t = pick(OTHER_CLANS); rel(t, -3); return P(`You choose ${cn(t)}. It is quick and ugly and your war party comes home heavy-jawed. ${ldr(t)} will never forgive it, and the others are watching.`); } },
    ],
  },

  dark1: {
    title: 'A forest with no stars', art: 'darkforest', kicker: 'A dream',
    text: () => P(`You fall asleep in your den and wake somewhere else: a forest where the trees are dead and dripping, where pale fungus glows on the roots, where you look up for Silverpelt and find nothing at all.`,
      `A broad-shouldered cat is waiting for you, so dark he is hardly there except for his eyes. He does not give his name. ${Q('You have the right instincts, little leader. They keep you on a leash, up there among the stars. Let me teach you what they won\'t.')}`),
    options: () => [
      { t: 'Let him teach you.', go: () => { add('dark', 2); add('favour', -2); S.bless.claws = Math.min(3, S.bless.claws + 1); flag('darkTrained'); logSaga(`${leaderName()} trained in the Place of No Stars.`); return P('Every night, in that dark wood, he teaches you to fight in ways no Clan teaches. Every morning you wake aching. Your warriors begin to fight like you. Willowmoth begins to watch you.'); } },
      { t: 'Refuse him, and wake yourself.', go: () => { add('dark', -2); add('favour', 2); return P('You claw your way up out of sleep and lie in your den, panting, until dawn. When you sleep again, there are stars.'); } },
      { t: 'Wake, and tell Willowmoth everything.', go: () => { add('dark', -2); add('favour', 1); flag('toldDark'); return P('She hears you out without interrupting, then goes to the Moonpool that same night. When she comes back she has juniper and a grim face. "They walk there because they want to be remembered," she says. "Do not give them that."'); } },
    ],
  },
  dark2: {
    title: 'The price of a name', art: 'darkforest', kicker: 'A dream',
    text: () => P(`The dark forest again, and the broad dark cat, and this time others behind him: shapes in the mist, watching. ${Q('A hard leaf-bare is coming. You know it. StarClan will let your Clan starve rather than break its precious Code.')}`,
      `${Q('I can make you strong enough that nobody at the lake can refuse you. All I ask is that you remember me. Say my name to your Clan. Let them remember me too.')}`),
    options: () => [
      { t: 'Agree. Strength is strength.', go: () => { add('dark', 2); flag('darkPact'); add('favour', -3); logSaga(`${leaderName()} made a bargain in the Place of No Stars.`); return P('He tells you his name. You will not repeat it here. When you wake, the stars over the hollow seem dimmer, and you are stronger than you have ever been.'); } },
      { t: 'Refuse. You have nine lives from StarClan, and you will spend them on your own terms.', go: () => { add('dark', -3); add('favour', 3); return P('The shapes in the mist hiss and fade. The dark cat stays longest, staring. Then he, too, is gone, and you wake to find Silverpelt bright over the Highledge.'); } },
    ],
  },

  finale1: {
    title: 'When the lake forgets to move', art: 'ice', kicker: 'Leaf-bare of the third year',
    text: () => {
      const warm = OTHER_CLANS.filter(id => S.clans[id].att >= 1).length;
      return P(`It happens in a single night. The wind drops, the stars come out hard and white, and in the morning the lake is silent. It has frozen to its heart. The fish are locked under it. On the moor, rabbits lie stiff in their burrows. In the pines, ShadowClan's frogs are buried in the frozen marsh. In the Oakwood, nothing moves.`,
        `ThunderClan has <b>${S.prey}</b> pieces of fresh-kill in store, and <b>${totalCats()}</b> mouths. Willowmoth has <b>${S.herbs}</b> bundles of herbs. ${warm ? `${warm === 4 ? 'All four' : warm === 1 ? 'One' : warm} of the other Clans would still call ThunderClan a friend.` : 'No other Clan would call ThunderClan a friend.'}`,
        `You stand on the Highledge and look at the white lake, and the prophecy goes through your head like the wind. ${Q('When the lake forgets to move, five must share one heart.')} The Clan is looking up at you.`);
    },
    advice: () => ({ willowmoth: 'This is the moment. Whatever we do now is what the stars will remember.', oakfang: 'Our store will last a moon, perhaps. Leaf-bare will last three.', rainpetal: 'Every nursery at the lake is as cold as ours tonight.', rookfeather: 'The Clan that is strongest now is the one that eats.' }),
    options: () => {
      const canUnite = canUniteNow();
      return [
        { t: 'Call all five Clans to the island, under the Great Oak. Share everything: prey, warmth, herbs.', req: () => canUnite, why: 'No Clan trusts ThunderClan enough to come. You needed allies, a council of leaders, or the legend of LionClan.', go: () => finaleUnity() },
        { t: 'Hold the hollow alone, and live on what you stored.', go: () => finaleAlone() },
        { t: 'Take what ThunderClan needs from the weakest Clan.', go: () => finaleRaid() },
        { t: 'Walk to every camp yourself, through the snow, and ask them to come.', h: 'kindred', go: () => { const l = chance(.6) ? loseLife('lost in the snow between the camps') : null; return finaleUnity(l === 'lost' ? `<p>It takes three days. Between WindClan's camp and RiverClan's the snow closes over you, and you walk for a while among the stars before you can walk on. ${S.lives} lives remain. But they come.</p>` : '<p>It takes three days of walking through snow to your belly, and they come.</p>'); } },
        { t: 'Lead a hunt across the ice to the Twoleg barns, where the rats are.', h: 'valiant', go: () => { const l = chance(.45) ? loseLife('fell through the ice') : null; add('prey', 26); return finaleChoiceAfter(`<p>You lead them across the white lake to the far shore and the Twoleg barns. ${l === 'lost' ? `On the way back the ice breaks under you, and you go into the black water and out of this life. ${S.lives} remain.` : 'The ice groans under you all the way.'} But the patrol comes home with rats enough to feed the nursery for a moon.</p>`); } },
        { t: 'You know where the Twolegs keep grain, and where rats grow fat on it.', h: 'shrewd', go: () => { add('prey', 20); return finaleChoiceAfter('<p>You remember a barn beyond the Greenway that you watched one greenleaf. The rats are there, slow with cold. ThunderClan will not starve.</p>'); } },
        { t: 'Give away your own share, and ask your Clan to feed the weakest first.', h: 'steadfast', go: () => { add('mood', 3); const l = chance(.4) ? loseLife('starved, giving away a leader\'s share') : null; return finaleAlone(`<p>You eat last, and then not at all. ${l === 'lost' ? `On the twentieth night your heart stops, and StarClan sends you back. ${S.lives} lives remain.` : ''} The Clan sees it, and does the same. The strong go hungry so the kits do not.</p>`, true); } },
        { t: 'Summon the other leaders, and make them bow to ThunderClan for a share of its prey.', h: 'ambitious', go: () => finaleDominion() },
      ];
    },
  },
  finale2: {
    title: 'The far side of the cold', art: 'ice', kicker: 'Leaf-bare of the third year',
    text: () => P(`Your Clan has prey enough now to choose. The lake is still white and silent. The other Clans are still starving.`),
    options: () => {
      const canUnite = canUniteNow();
      return [
        { t: 'Share it. Call the five Clans to the island.', req: () => canUnite, why: 'No Clan trusts ThunderClan enough to come.', go: () => finaleUnity() },
        { t: 'Keep it for ThunderClan.', go: () => finaleAlone() },
      ];
    },
  },
};

function chooseHeart(h) {
  S.player.heart = h;
  if (h === 'ambitious') { S.dark = 2; S.honour = 3; }
  if (h === 'kindred') add('mood', 1);
  if (h === 'steadfast') add('favour', 1);
  if (h === 'shrewd') add('herbs', 3);
  if (h === 'valiant') S.bless.claws = 2;
  logSaga(`At the Moonpool, ${HEARTS[h].patron === 'A voice with no stars' ? 'a voice with no stars' : HEARTS[h].patron} gave ${warriorName()} the life that became ${pr('her', 'his')} heart.`);
  return { text: P(HEARTS[h].offer, h === 'ambitious' ? 'You turn toward the starless edge, and the cold voice goes into you like a breath. StarClan\'s lives come anyway; they always do. But they come quieter, and every cat of Silverpelt has seen what you chose.' : `The life goes into you, and for a moment you are ${HEARTS[h].gift}, nothing else, from your whiskers to your tail.`), queue: [{ k: 'script', id: 'c3' }] };
}

/* ---------------- The finale's resolutions ---------------- */
function finaleUnity(pre = '') {
  flag('ending', 'unity'); logSaga('The five Clans wintered together on the island beneath the Great Oak.');
  const lost = Math.max(0, Math.round(totalCats() * .06) - (S.prey > 40 ? 2 : 0));
  killCats(lost, ['elders', 'kits']);
  OTHER_CLANS.forEach(id => S.clans[id].att = Math.max(S.clans[id].att, 3));
  return { text: pre + P(`They come across the ice in long dark lines: WindClan from the moor, RiverClan from the far shore, ShadowClan out of the pines, SkyClan down from the ridge, ThunderClan from the forest. Five Clans on one island, under one oak, in one great nest of bodies pressed close against the cold.`,
    `Every Clan brings what it has. ThunderClan's store, the rats from the barns, ShadowClan's frozen frogs, the last of RiverClan's fish. Medicine cats share their herbs without asking whose they are. Kits sleep in the bellies of queens from other Clans. For a whole moon there are no borders, and nobody unsheathes a claw.`,
    lost ? `Not everyone survives. ${lost} of ThunderClan's weakest go to StarClan before the thaw. Every Clan loses some. But every Clan lives.` : 'And when the thaw comes, every Clan is still alive.'), queue: [{ k: 'ending', why: 'unity' }] };
}
function finaleAlone(pre = '', shared = false) {
  const need = upkeep() * 2;
  let lost;
  if (S.prey >= need) lost = rnd(0, 2);
  else lost = Math.ceil((need - S.prey) / 8) + rnd(0, 2);
  if (shared) lost = Math.max(0, lost - 2);
  lost = Math.min(lost, totalCats() - 3);
  killCats(lost, ['elders', 'kits', 'apprentices', 'warriors']);
  flag('ending', 'alone'); logSaga(`ThunderClan held its hollow alone through the great freeze and lost ${lost} cats.`);
  return { text: pre + P(`ThunderClan seals the thorn walls and waits. Day after day the warriors dig under snow for anything that moves. Night after night the Clan sleeps in one heap in the warriors' den, and wakes counting.`,
    lost <= 2 ? `The store is enough, just. When the ice finally groans and breaks, ThunderClan is thin and alive and whole.` : `The store is not enough. Before the thaw, <b>${lost}</b> cats go to StarClan, and the Clan sits vigil so often that the vigils run together.`,
    `Across the lake, the other Clans fared as they could. Nobody came to ThunderClan, and ThunderClan went to nobody.`), queue: [{ k: 'ending', why: 'alone' }] };
}
function canUniteNow() { const warmth = OTHER_CLANS.reduce((a, id) => a + Math.max(0, S.clans[id].att), 0); return S.allies.length >= 1 || hasBoon('lion') || F('leaderCouncil') || warmth >= 6; }
function finaleChoiceAfter(pre) { return { text: pre, queue: [{ k: 'script', id: 'finale2' }] }; }
function finaleRaid() {
  const weakest = OTHER_CLANS.slice().sort((a, b) => S.clans[a].str - S.clans[b].str)[0];
  const f = fight({ clan: weakest, sent: Math.min(10, S.cats.warriors), aim: 'prey' });
  rel(weakest, -5); OTHER_CLANS.forEach(id => rel(id, -2)); add('dark', 2); add('honour', -3);
  if (f.won) add('prey', 24);
  const r = finaleAlone(P(`You choose ${cn(weakest)}, because ${cn(weakest)} is weakest. ${f.won ? `Your warriors cross the ice at night and come home with ${ldr(weakest)}'s store in their jaws.` : `They are weak, but they are desperate. Your war party comes home with almost nothing.`}${fightLine(f)}`));
  flag('ending', 'raid'); r.queue = [{ k: 'ending', why: 'raid' }];
  return r;
}
function finaleDominion() {
  const strong = S.cats.warriors >= 12 || F('darkPact') || F('rogueClaws');
  if (!strong) { OTHER_CLANS.forEach(id => rel(id, -2)); return finaleAlone(P('You summon them. They do not come. Kestrelstar sends back a single word, and it is not a polite one.')); }
  flag('ending', 'dominion'); add('dark', 2); OTHER_CLANS.forEach(id => S.clans[id].att = -3);
  killCats(rnd(0, 2), ['elders', 'kits']);
  return { text: P(`They come, because they are starving and you are not. One by one, under the Great Oak, the leaders of WindClan, RiverClan, ShadowClan and SkyClan lower their heads to ${leaderName()}, and one by one their Clans are fed from ThunderClan's store.`,
    `No Clan dies that winter. But at the thaw, when the leaders walk home across the breaking ice, none of them looks back at you, and the stars over the island are dim.`), queue: [{ k: 'ending', why: 'dominion' }] };
}

/* ---------------- Generated scenes: war, raids, gifts, Gatherings ---------------- */
function raidScene(v) {
  const id = v.clan, held = Object.keys(ZONES).find(z => S.zones[z].owner === id);
  const opts = [
    { t: 'A swift strike on their border prey. Four warriors.', go: () => doRaid(id, 4, 'prey', false) },
  ];
  if (held) opts.push({ t: `A full war party to take ${ZONES[held].name}. Eight warriors.`, go: () => doRaid(id, 8, 'land', false, held) });
  opts.push({ t: 'A war party to punish them, and nothing more. Eight warriors.', go: () => doRaid(id, 8, 'honour', false) });
  if (!isHeart('valiant')) opts.push({ t: `Lead the war party yourself${held ? ` and take ${ZONES[held].name}` : ''}.`, go: () => doRaid(id, 8, held ? 'land' : 'honour', true, held) });
  opts.push({ t: 'Call off the raid.', go: () => { S.actions += 1; return P('The warriors unsheathe their claws from the moss and go back to their dens, muttering.'); } });
  return {
    title: `War council: ${cn(id)}`, art: CLANS[id].art, artOpts: { clan: id, time: 'dusk' },
    text: P(`Your warriors gather in the clearing at dusk with their claws in the moss. ${cn(id)} ${S.clans[id].att >= 0 ? 'has done nothing to ThunderClan lately; an attack now will be seen as unprovoked, and StarClan will see it too.' : 'has earned this.'}`,
      `${F('intel_' + id) ? `You know they have about ${S.clans[id].str} warriors.` : `${ldr(id)} can field perhaps ${S.clans[id].str > 16 ? 'more warriors than you' : S.clans[id].str < 11 ? 'fewer warriors than you' : 'as many warriors as you'}.`} ThunderClan has ${S.cats.warriors}.${isHeart('valiant') ? ' You will lead, of course.' : ''}`),
    advice: { oakfang: S.clans[id].att >= 0 ? 'An attack without cause. I\'ll follow you. I won\'t like it.' : 'They\'ve had it coming for a season.', rookfeather: 'At last.', willowmoth: 'I will have cobwebs ready.' },
    options: opts,
  };
}
function doRaid(id, n, aim, lead, zone) {
  const provoked = S.clans[id].att < 0;
  if (F('rookLeads')) { flag('rookLeads', false); n += 1; }
  const f = fight({ clan: id, sent: n, lead, aim });
  rel(id, aim === 'land' ? -3 : -2);
  if (!provoked) { add('honour', -1); add('favour', -1); }
  flag('offence_' + id + '_us');
  let t = '';
  if (f.won) {
    if (aim === 'prey') { const g = rnd(7, 13) * (f.result === 'rout' ? 1.4 : 1) | 0; add('prey', g); t = `They never see you coming. Your warriors come home with <b>${g}</b> pieces of ${cn(id)}'s fresh-kill in their jaws.`; }
    else if (aim === 'land') { S.zones[zone].owner = 'thunder'; add('mood', 1); logSaga(`ThunderClan took ${ZONES[zone].name} from ${cn(id)}.`); t = `${cn(id)} breaks and runs. By dusk ThunderClan scent marks the far side of ${ZONES[zone].name}, and it is yours.`; }
    else { add('mood', 2); t = `${cn(id)} will remember this one. Your warriors come home yowling.`; }
  } else { add('mood', -1); t = `${cn(id)} was ready. Your war party is driven back across the border.`; }
  return P(t + fightLine(f), !provoked ? '<span class="quiet">An unprovoked attack. ThunderClan\'s honour, and StarClan\'s favour, are lessened.</span>' : '');
}

function raidedScene(v) {
  const id = v.clan;
  return {
    title: `${cn(id)} at the walls`, art: 'battle',
    text: P(`A patrol comes crashing back into the hollow: ${cn(id)} is over the border in force, ${ldr(id)} at the head of them, and heading this way. ${S.scent === 0 ? 'Your markers had faded. They could pretend not to know.' : ''}`,
      `There is no time for a council. Everyone is looking at you.`),
    advice: { oakfang: 'Meet them at the border. Don\'t let them near the nursery.', rainpetal: 'Give them some prey. Nothing in the pile is worth a kit.', willowmoth: 'Whatever you choose, choose now.' },
    options: [
      { t: 'Meet them at the border with every warrior.', go: () => defendResult(id, fight({ clan: id, sent: S.cats.warriors, mode: 'defend' }), false) },
      { t: 'Hold the hollow behind the thorn walls.', go: () => { S.prey = Math.max(0, S.prey - rnd(3, 7)); return defendResult(id, fight({ clan: id, sent: S.cats.warriors, mode: 'defend' }), true); } },
      { t: 'Give them fresh-kill and send them home.', req: () => S.prey >= 6, why: 'Needs 6 fresh-kill.', go: () => { S.prey -= Math.min(S.prey, 10); add('mood', -2); add('honour', -1); rel(id, 1); return P(`${ldr(id)} takes it and goes. Your warriors watch them leave with their tails down.`); } },
      { t: `Challenge ${ldr(id)}, claw to claw, to settle it.`, h: 'valiant', odds: () => .62, go: () => { if (chance(.62)) { add('mood', 2); add('honour', 1); flag('deter'); logSaga(`${leaderName()} beat ${ldr(id)} in single combat.`); return P(`The two war parties draw back to watch. It is short and savage, and at the end of it ${ldr(id)} is on ${lpr(id,'her','his')} back with your claws at ${lpr(id,'her','his')} throat. You let ${lpr(id,'her','him')} up. ${cn(id)} goes home.`); } const l = loseLife(`killed by ${ldr(id)} in single combat`); S.prey = Math.max(0, S.prey - 8); return P(l === 'lost' ? `${ldr(id)} is the better fighter today. You die in front of both Clans, and come back gasping, and ${cn(id)} takes what it came for. ${S.lives} lives remain.` : `${ldr(id)} is the better fighter today. Only luck keeps you alive.`); } },
      { t: `Walk out alone and ask ${ldr(id)} what has gone so wrong between you.`, h: 'kindred', go: () => { if (chance(.55)) { rel(id, 2); return P(`${ldr(id)} is so surprised that ${lpr(id,'she','he')} listens. It turns out there are things to say. ${cn(id)} goes home without a fight.`); } return defendResult(id, fight({ clan: id, sent: S.cats.warriors - 2, mode: 'defend' }), false, `${lpr(id,'She','He')} does not want to talk. Your warriors arrive late, and it costs them.`); } },
      { t: 'Let them into the hollow, then close the thorn tunnel behind them.', h: 'shrewd', go: () => { const f = fight({ clan: id, sent: Math.round(S.cats.warriors * 1.4), mode: 'defend' }); return defendResult(id, f, false, 'The hollow is a trap with stone walls, and they walk right into it.'); } },
    ],
  };
}
function defendResult(id, f, walls, pre = '') {
  flag('offence_' + id, `raiding ThunderClan`);
  let t = pre ? pre + ' ' : '';
  if (f.won) { add('mood', 1); rel(id, -1); flag('deter'); t += walls ? `${cn(id)} throws itself at the thorn walls and breaks on them.` : `Your warriors meet them at the stream and drive them back across it.`; }
  else { S.prey = Math.max(0, S.prey - rnd(6, 12)); add('mood', -2); t += `${cn(id)} breaks through, takes what it wants from the fresh-kill pile, and goes.`; const z = Object.keys(ZONES).find(z => ZONES[z].contested === id && S.zones[z].owner === 'thunder'); if (z) { S.zones[z].owner = id; t += ` Their markers now stand in ${ZONES[z].name}.`; } }
  return P(t + fightLine(f));
}

function giftScene(v) {
  const id = v.clan, what = v.what || 'prey';
  const text = { prey: `A ${cn(id)} patrol appears at the border, carrying fresh-kill. ${ldr(id)} sends it with a message: friends feed friends.`, herbs: `${cn(id)}'s medicine cat sends Willowmoth a bundle of herbs that grow only on ${cn(id)}'s land.`, warning: `A ${cn(id)} warrior meets your patrol at the border, quietly. ${ldr(id)} wanted you to know: a fox pack is moving toward your territory from the hills.` }[what];
  return {
    title: `A gift from ${cn(id)}`, art: CLANS[id].art, artOpts: { clan: id },
    text: P(text), advice: { rainpetal: 'This is what friendship looks like. Remember it.', rookfeather: 'Nobody gives anything for nothing.' },
    options: [
      { t: 'Accept it with thanks.', go: () => { if (what === 'prey') add('prey', 8); if (what === 'herbs') add('herbs', 4); if (what === 'warning') { S.scent = 3; add('mood', 1); } return P('You send your thanks back with their warrior, and mean it.'); } },
      { t: 'Accept it, and send a gift of your own in return.', req: () => S.prey >= 4, why: 'Needs 4 fresh-kill.', go: () => { S.prey -= 4; if (what === 'prey') add('prey', 8); if (what === 'herbs') add('herbs', 4); rel(id, 1); if (S.clans[id].att >= 4 && !S.allies.includes(id)) { S.allies.push(id); logSaga(`ThunderClan and ${cn(id)} became allies.`); return P(`The exchange becomes a custom, and the custom becomes something more. ${cn(id)} and ThunderClan are allies now.`); } return P('Gift for gift. The bond between the Clans is the stronger for it.'); } },
      { t: 'Refuse it. ThunderClan needs nobody\'s charity.', go: () => { rel(id, -2); add('mood', 1); return P(`The ${cn(id)} cats go home with their gift and a story about ThunderClan pride.`); } },
    ],
  };
}

function gatheringScene(v) {
  if (v.clouded) return {
    title: 'Clouds over the moon', art: 'gathering', artOpts: { clouded: true },
    text: P(`The five Clans cross the tree-bridge to the island as the moon rises. The leaders climb into the Great Oak. And before the first of them can speak, cloud slides over the moon, and the island goes dark.`,
      `StarClan is angry. ${S.dark >= 5 ? 'Several cats look at you as they say it.' : ''} The Gathering is over before it began.`),
    options: [{ t: 'Lead ThunderClan home in silence.', go: () => { add('favour', -1); add('mood', -1); return P('Nobody speaks on the way home. Everybody is thinking.'); } }],
  };
  const news = v.news.map(n => `<p>${n}</p>`).join('');
  const offences = OTHER_CLANS.filter(id => typeof F('offence_' + id) === 'string');
  const opts = [
    { t: 'Speak of ThunderClan\'s strength: prey running, warriors many.', go: () => { if (S.prey >= 18 && S.cats.warriors >= 10) { flag('deter'); add('mood', 1); return P('It is true, and every Clan can see it is true. Raiders will think twice this season.'); } add('honour', -1); return P('The other leaders listen politely. They can smell hunger on a Clan, and ThunderClan smells of it.'); } },
    { t: 'Honour the truce, and thank the Clans that have kept their word to ThunderClan.', go: () => { OTHER_CLANS.forEach(id => { if (S.clans[id].att >= 0) rel(id, 1); }); add('honour', 1); return P('It is a small thing to say. It is remembered.'); } },
  ];
  offences.forEach(id => opts.push({ t: `Accuse ${cn(id)} before every Clan of ${F('offence_' + id)}.`, go: () => { rel(id, -1); add('mood', 1); add('honour', 1); flag('offence_' + id, false); OTHER_CLANS.filter(o => o !== id).forEach(o => { if (chance(.5)) rel(o, 1); }); return P(`${ldr(id)}'s fur bristles, but there is no denying it in front of everyone. ${cn(id)} is shamed. The other Clans look at them, and then at you, with new respect.`); } }));
  opts.push({ t: 'Say little, and listen.', go: () => { OTHER_CLANS.forEach(id => flag('intel_' + id)); return P(`You learn a good deal by keeping your mouth shut. ${OTHER_CLANS.map(id => `${cn(id)}: ${S.clans[id].str} warriors${S.clans[id].sick ? ', sickness in the nursery' : ''}`).join('. ')}.`); } });
  opts.push({ t: 'Offer herbs to any Clan with sickness in its nursery.', h: 'kindred', req: () => S.herbs >= 3, why: 'Willowmoth has fewer than three bundles.', go: () => { S.herbs -= 3; const sick = OTHER_CLANS.filter(id => S.clans[id].sick); (sick.length ? sick : OTHER_CLANS).forEach(id => rel(id, sick.length ? 2 : 1)); return P(sick.length ? `${sick.map(cn).join(' and ')} accept${sick.length === 1 ? 's' : ''}, stiffly and gratefully.` : 'Nobody needs them this moon. But everybody heard you offer.'); } });
  opts.push({ t: 'Speak of the leaders who came before, and what they sacrificed.', h: 'steadfast', go: () => { add('favour', 1); OTHER_CLANS.forEach(id => rel(id, 1)); return P('You speak of Bluestar at the gorge and Tallstar\'s last choice and Crookedstar\'s long patience. For a moment the Clans remember they share their dead.'); } });
  opts.push({ t: 'Ask what everyone else is too polite to ask.', h: 'shrewd', go: () => { const w = OTHER_CLANS.slice().sort((a, b) => S.clans[a].str - S.clans[b].str)[0]; OTHER_CLANS.forEach(id => flag('intel_' + id)); rel(w, -1); add('mood', 1); return P(`You ask ${ldr(w)} how ${cn(w)} is really eating. The silence that follows is an answer, and everyone hears it.`); } });
  opts.push({ t: 'Let any Clan that doubts ThunderClan say so, to your face.', h: 'valiant', go: () => { flag('deter'); add('honour', 1); OTHER_CLANS.forEach(id => { if (S.clans[id].att < 0) rel(id, -1); }); return P('Nobody says so. Several cats think it very loudly.'); } });
  opts.push({ t: 'Warn the other Clans that ThunderClan\'s patience has an end.', h: 'ambitious', go: () => { flag('deter'); add('dark', 1); OTHER_CLANS.forEach(id => rel(id, -1)); return P('The island goes quiet. You have their attention. You do not have their goodwill.'); } });
  return {
    title: 'The Gathering', art: 'gathering', kicker: `Full moon, ${seasonName().toLowerCase()}`,
    text: P(`The five Clans cross the fallen tree to the island and mingle under the Great Oak, old friends and old enemies sharing tongues by the truce of the full moon. The leaders climb into the branches. One by one, they speak.`) + news + P(`Then it is your turn.`),
    advice: { oakfang: offences.length ? 'They wronged us. Say so, here, where they can\'t pretend otherwise.' : 'Say nothing that makes us look weak.', rainpetal: 'Every leader up there is as worried as you are. Remember that.' },
    options: opts,
  };
}
function gatheringNews() {
  const lines = [];
  const generic = {
    wind: ['Kestrelstar reports the rabbits are running and a dog has been loose near the horseplace.', 'Kestrelstar announces two new warriors, and boasts that WindClan\'s apprentices can outrun a hare.'],
    river: ['Minnowstar says the fish are fat and the Twolegs\' boats are back on the lake.', 'Minnowstar welcomes three new kits, and smiles at everyone a little too long.'],
    shadow: ['Adderstar says ShadowClan has nothing to report, which is what ShadowClan always says.', 'Adderstar says the frogs in the marsh are plentiful, and looks at Thornmarsh as he says it.'],
    sky: ['Wrenstar announces two apprentices, and glances at the other leaders when she finishes, as if for approval.', 'Wrenstar reports a hawk has been taking prey on the ridge.'],
  };
  OTHER_CLANS.forEach(id => {
    const c = S.clans[id];
    if (S.year === 3 && S.season === 2) { lines.push(`${ldr(id)} speaks of thin prey and an early frost.`); return; }
    if (c.att >= 4) lines.push(`${ldr(id)} speaks warmly of ThunderClan, and meets your eyes when ${lpr(id,'she','he')} does.`);
    else if (c.att <= -3) lines.push(`${ldr(id)} speaks of "thieves in the woods" without once looking at you.`);
    else if (c.sick && chance(.6)) lines.push(`${cn(id)} has whitecough in its nursery. ${ldr(id)} admits it only when pressed.`);
    else if (c.str >= 18) lines.push(`${cn(id)}'s warriors fill half the clearing. ${ldr(id)} names three new warriors.`);
    else if (c.str <= 9) lines.push(`${cn(id)} is thin; ribs show under its warriors' fur. ${ldr(id)} says only that prey is "running well".`);
    else lines.push(pick(generic[id]));
  });
  return lines;
}
