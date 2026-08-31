import test from 'node:test';
import assert from 'node:assert/strict';
import { TILES, emptyBoard, reachableSocket, poweredNodes, createBattle, advance, makeEncounter } from './game.js';

const tile = (type, action) => ({ ...TILES[type], type, id: type, action });

test('an activator route reaches a socketed action', () => {
  const board = emptyBoard();
  board[0] = tile('activator');
  board[1] = tile('relay', { name: 'Strike', value: 6, kind: 'striker' });
  assert.equal(reachableSocket(board), true);
});

test('activator resolves on beat one and sends its pulse next beat', () => {
  const board = emptyBoard();
  board[0] = tile('activator', { name: 'Strike', value: 6, kind: 'striker' });
  board[1] = tile('relay', { name: 'Guard', value: 7, kind: 'bulwark' });
  let battle = createBattle(board, 'striker');
  battle.enemy.board = emptyBoard();
  battle = advance(battle);
  assert.equal(battle.enemy.hp, 114);
  battle = advance(battle);
  assert.equal(battle.player.block, 7);
});

test('block absorbs damage and poison ticks every third beat', () => {
  const board = emptyBoard();
  let battle = createBattle(board, 'striker');
  battle.enemy.board = emptyBoard();
  battle.player.block = 2;
  battle.player.poison = 5;
  battle = advance(advance(battle));
  battle = advance(battle);
  assert.equal(battle.player.hp, 117);
  assert.equal(battle.player.block, 0);
});

test('tile deals strongly favor a mix of straight and corner relays', () => {
  const types = makeEncounter(123).tiles.map(tile => tile.type);
  assert.equal(types.filter(type => type === 'relay' || type === 'relayTurn').length, 8);
  assert.equal(types.filter(type => type === 'relayTurn').length, 4);
  assert.equal(types.filter(type => type.startsWith('multi')).length, 1);
  assert.equal(types.filter(type => type === 'activator').length, 1);
  assert.equal(types.filter(type => type === 'delay').length, 1);
  assert.equal(types.filter(type => type === 'accumulator').length, 1);
});

test('a completed battle keeps its pulse simulation running without changing stats', () => {
  const board = emptyBoard();
  board[0] = tile('activator', { name: 'Strike', value: 6, kind: 'striker' });
  let battle = createBattle(board, 'striker');
  battle.over = true;
  battle.result = 'Victory';
  const hp = battle.player.hp;
  battle = advance(battle);
  assert.equal(battle.player.hp, hp);
  assert.deepEqual(battle.player.activeNodes, [0]);
});

test('a partial multi hit reports the received fraction for rendering', () => {
  const board = emptyBoard();
  board[0] = tile('activator');
  board[1] = tile('multi2');
  let battle = createBattle(board, 'striker');
  battle.enemy.board = emptyBoard();
  battle = advance(advance(battle));
  assert.equal(battle.player.partialNodes[1], 0.5);
});

test('a delay retains its scheduled release beat for countdown feedback', () => {
  const board = emptyBoard();
  board[0] = tile('activator');
  board[1] = tile('delay');
  let battle = createBattle(board, 'striker');
  battle.enemy.board = emptyBoard();
  battle = advance(advance(battle));
  assert.equal(battle.player.delays[1], 4);
  battle = advance(battle);
  assert.equal(battle.player.delays[1] - battle.beat, 1);
});

test('reachability dims a multi node without all required reachable inputs', () => {
  const board = emptyBoard();
  board[0] = tile('activator');
  board[1] = tile('multi2');
  const powered = poweredNodes(board);
  assert.equal(powered.has(0), true);
  assert.equal(powered.has(1), false);
});
