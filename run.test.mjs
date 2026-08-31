import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, availableNodes, selectNode, resolveVictory, chooseReward, buyCard } from './run.js';
import { MUSIC_CONFIG, soundtrackForSeed, chordForBeat, allocateChordVoices } from './cards.js';

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
  assert.equal(availableNodes(run).length, 3);
});

test('soundtracks are deterministic per run and provide dark modal pitch data', () => {
  assert.equal(createRun('striker', 10).soundtrack, createRun('striker', 10).soundtrack);
  assert.equal(Object.values(MUSIC_CONFIG.soundtracks).every(preset => preset.scale.length === 7 && preset.progression.length === 4 && preset.tonicHz < 60), true);
});

test('soundtrack chords only contain consonant simultaneous intervals', () => {
  for (const preset of Object.values(MUSIC_CONFIG.soundtracks)) for (const chord of preset.chords) {
    const intervals=chord.tones.flatMap((tone,index)=>chord.tones.slice(index+1).map(other=>other-tone));
    assert.equal(intervals.every(interval=>[3,4,7].includes(interval)),true);
  }
  assert.equal(chordForBeat(MUSIC_CONFIG.soundtracks.phrygian,5).transitionAccent,true);
});

test('chord voicing de-duplicates notes and limits a busy beat to three voices', () => {
  const preset=MUSIC_CONFIG.soundtracks.aeolian;
  const voices=allocateChordVoices(preset,1,[{degree:0},{degree:0},{degree:1},{degree:2},{degree:3},{degree:4}]);
  assert.equal(voices.length,3);
  assert.deepEqual(voices.map(voice=>voice.semitones),[0,3,7]);
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

test('enemies grow from a two-card low-stat board as battle depth increases', async () => {
  const { encounterFor } = await import('./run.js');
  const run = createRun('striker', 42);
  run.selectedNode = { kind:'fight' };
  const first = encounterFor(run);
  run.battleNumber = 5;
  const later = encounterFor(run);
  assert.deepEqual([first.enemyHp, first.enemyStrength, first.enemyPieces], [25, 0, 1]);
  assert.deepEqual([later.enemyHp, later.enemyStrength, later.enemyPieces], [73, 1, 3]);
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
