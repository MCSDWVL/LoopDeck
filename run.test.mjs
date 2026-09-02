import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, availableNodes, selectNode, resolveVictory, chooseReward, skipReward, buyCard, rollOfferDefinition, rewardOffers, encounterFor } from './run.js';
import { MUSIC_CONFIG, soundtrackForSeed, chordForBeat, allocateChordVoices, OFFER_CONFIG } from './cards.js';

test('a striker run begins with a deliberately connectable strike and defend chain', () => {
  const run = createRun('striker', 42);
  assert.equal(run.collection.length, 3);
  assert.equal(run.collection.filter(card => card.type === 'activator').length, 1);
  assert.deepEqual(run.collection.map(card => card.type), ['activator', 'relay', 'relay']);
  assert.deepEqual(run.collection.map(card => card.action.name), ['', 'Strike', 'Defend']);
  assert.deepEqual(run.collection.map(card => card.turns), [0, 0, 0]);
  assert.equal(run.hp, 60);
  assert.equal(run.gold, 0);
  assert.equal(run.soundtrack, soundtrackForSeed(42).id);
  assert.equal(Number.isInteger(run.progression), true);
  assert.equal(run.collection.every(card => card.degree >= 0 && card.degree < 5), true);
  assert.equal(availableNodes(run).length, 3);
});

test('soundtracks are deterministic per run and provide dark modal chord-voice data', () => {
  assert.equal(createRun('striker', 10).soundtrack, createRun('striker', 10).soundtrack);
  assert.equal(Object.values(MUSIC_CONFIG.soundtracks).every(preset => preset.scale.length === 7 && preset.voiceSlots.length === 5 && preset.progression.length === 4 && preset.tonicHz < 60), true);
});

test('offer class and rarity are rolled independently of the card pool', () => {
  const roll=(...values)=>()=>values.shift() ?? 0;
  assert.equal(rollOfferDefinition('striker',roll(0,.9,0)).id,'signal-link');
  assert.equal(rollOfferDefinition('striker',roll(0,0)).id,'pulse-source');
  assert.equal(rollOfferDefinition('striker',roll(.9,0,0)).offerRarity,'common');
  assert.equal(rollOfferDefinition('striker',roll(.9,.56,0)).offerRarity,'uncommon');
  assert.equal(rollOfferDefinition('striker',roll(.9,.9,0)).offerRarity,'rare');
  assert.deepEqual(OFFER_CONFIG.actionRarities,[['common',.55],['uncommon',.32],['rare',.13]]);
});

test('generated reward connectors regularly include distinct multi-output routes', () => {
  let connectors=0,multiOutput=0;
  for(let seed=0;seed<1000;seed++) for(const card of rewardOffers(createRun('striker',seed),3)) if(card.action.connector){
    connectors++;
    if(card.out.length>1)multiOutput++;
    assert.equal(new Set(card.out).size,card.out.length);
  }
  assert.ok(connectors>800);
  assert.ok(multiOutput>400);
});

test('soundtrack chords only contain consonant simultaneous intervals', () => {
  for (const preset of Object.values(MUSIC_CONFIG.soundtracks)) for (const chord of preset.chords) {
    const intervals=chord.tones.flatMap((tone,index)=>chord.tones.slice(index+1).map(other=>other-tone));
    assert.equal(intervals.every(interval=>[3,4,7].includes(interval)),true);
  }
  assert.equal(MUSIC_CONFIG.soundtracks.phrygian.chords.some(chord=>chord.root===1),false);
});

test('chord-tone voicing de-duplicates notes and permits five consonant voices', () => {
  const preset=MUSIC_CONFIG.soundtracks.aeolian;
  const voices=allocateChordVoices(preset,1,[{degree:0},{degree:0},{degree:1},{degree:2},{degree:3},{degree:4}]);
  assert.equal(voices.length,5);
  assert.deepEqual(voices.map(voice=>voice.semitones),[0,3,7,12,15]);
});

test('generated card degrees and progression variants are deterministic per run', () => {
  const first=createRun('striker',42), replay=createRun('striker',42), other=createRun('striker',43);
  assert.deepEqual(first.collection.map(card=>card.degree),replay.collection.map(card=>card.degree));
  assert.equal(first.progression,replay.progression);
  assert.ok(new Set(first.collection.map(card=>card.degree)).size>1);
  assert.equal(other.collection.every(card=>card.degree>=0&&card.degree<5),true);
  assert.ok(new Set(Array.from({length:20},(_,seed)=>createRun('striker',seed).collection[0].degree)).size>1);
});

test('progression variants are seeded cyclic rotations of the intended chord sequence', () => {
  const preset=MUSIC_CONFIG.soundtracks.aeolian;
  assert.equal(chordForBeat(preset,1,0).root,0);
  assert.equal(chordForBeat(preset,9,0).root,8);
  assert.equal(chordForBeat(preset,9,1).root,7);
  for(const variant of preset.progressionVariants) assert.equal(variant.every((index,position)=>index===(variant[0]+position)%preset.chords.length),true);
});

test('normal card degrees resolve to chord tones or octave transpositions', () => {
  for(const preset of Object.values(MUSIC_CONFIG.soundtracks)) for(let progression=0;progression<preset.progressionVariants.length;progression++) for(let beat=1;beat<=16;beat++){
    const chord=chordForBeat(preset,beat,progression),voices=allocateChordVoices(preset,beat,preset.voiceSlots.map(degree=>({degree})),5,progression);
    assert.equal(voices.every(voice=>chord.tones.includes((voice.semitones-chord.root)%12)),true);
  }
});

test('victory awards gold and one selected reward card', () => {
  let run = createRun('venom', 7);
  run = selectNode(run, availableNodes(run)[0].id);
  run = resolveVictory(run);
  assert.equal(run.gold, run.selectedNode.kind === 'miniboss' ? 20 : 10);
  assert.equal(run.offers.length, run.selectedNode.kind === 'miniboss' ? 5 : 3);
  run = chooseReward(run, run.offers[0].id);
  assert.equal(run.collection.length, 4);
  assert.equal(run.phase, 'map');
});

test('battle twelve is replaced by one mandatory boss with its authored rewards', () => {
  let run=createRun('striker',42);
  run.battleNumber=11;run.selectedNode={kind:'fight'};
  run=resolveVictory(run);run=chooseReward(run,run.offers[0].id);
  const nodes=availableNodes(run);
  assert.equal(nodes.length,1);
  assert.equal(nodes[0].kind,'boss');
  run=selectNode(run,nodes[0].id);
  const encounter=encounterFor(run);
  assert.deepEqual([encounter.boss,encounter.bossId,encounter.enemyHp], [true,'reprisal-conduit',160]);
  run=resolveVictory(run);
  assert.deepEqual([run.gold,run.offers.length],[40,5]);
});

test('skipping a reward grants 10 gold without adding a card', () => {
  let run = createRun('venom', 7);
  run = selectNode(run, availableNodes(run)[0].id);
  run = resolveVictory(run);
  const collectionSize = run.collection.length;
  const gold = run.gold;
  run = skipReward(run);
  assert.equal(run.gold, gold + 10);
  assert.equal(run.collection.length, collectionSize);
  assert.equal(run.offers.length, 0);
  assert.equal(run.phase, 'map');
});

test('enemies expand after the opening two-card onboarding encounters', async () => {
  const { encounterFor } = await import('./run.js');
  const run = createRun('striker', 42);
  run.selectedNode = { kind:'fight' };
  const first = encounterFor(run);
  run.battleNumber = 5;
  const later = encounterFor(run);
  assert.deepEqual([first.enemyHp, first.enemyStrength, first.enemyPieces, first.enemyDepth], [20, 0, 2, 0]);
  assert.deepEqual([later.enemyHp, later.enemyStrength, later.enemyPieces, later.enemyDepth], [57, 0, 5, 4]);
  run.battleNumber = 6;
  assert.equal(encounterFor(run).enemyPieces,5);
  run.battleNumber = 7;
  assert.equal(encounterFor(run).enemyPieces,6);
  run.battleNumber = 17;
  assert.equal(encounterFor(run).enemyPieces, 11);
});

test('shops refuse unaffordable cards and deduct 25 gold for purchases', () => {
  let run = createRun('bulwark', 99);
  const shop = availableNodes(run).find(n => n.kind === 'shop');
  run = selectNode(run, shop.id);
  const before = run.collection.length;
  assert.equal(buyCard(run, run.offers[0].id).collection.length, before);
  run.gold = run.offers[0].shopCost;
  run = buyCard(run, run.offers[0].id);
  assert.equal(run.gold, 0);
  assert.equal(run.collection.length, before + 1);
});

