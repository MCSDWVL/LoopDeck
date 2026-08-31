import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, availableNodes, selectNode, resolveVictory, chooseReward, buyCard } from './run.js';

test('a run begins with a deliberately connectable activator and relay chain', () => {
  const run = createRun('striker', 42);
  assert.equal(run.collection.length, 3);
  assert.equal(run.collection.filter(card => card.type === 'activator').length, 1);
  assert.deepEqual(run.collection.map(card => card.type), ['activator', 'relay', 'relay']);
  assert.deepEqual(run.collection.map(card => card.turns), [0, 0, 0]);
  assert.equal(run.hp, 60);
  assert.equal(run.gold, 0);
  assert.equal(availableNodes(run).length, 3);
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
  run.gold = 25;
  run = buyCard(run, run.offers[0].id);
  assert.equal(run.gold, 0);
  assert.equal(run.collection.length, before + 1);
});
