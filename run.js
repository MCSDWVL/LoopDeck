import { ARCHETYPES, emptyBoard, makeEncounter, makeCard, seeded } from './game.js';
import { cardById, catalogFor, OFFER_CONFIG, progressionForSeed, soundtrackForSeed } from './cards.js';

const LANES = 3;
const specialByRow = ['shop', 'campfire', 'miniboss', 'fight'];
const hash = (seed, n) => ((Math.imul(seed ^ n, 1103515245) + 12345) >>> 0);
const pick=(items,random)=>items[Math.floor(random()*items.length)];
const rollRarity=random=>{let roll=random();for(const [rarity,weight] of OFFER_CONFIG.actionRarities){roll-=weight;if(roll<0)return rarity}return OFFER_CONFIG.actionRarities.at(-1)[0]};
export function rollOfferDefinition(archetype,random){const catalog=catalogFor(archetype),connectors=catalog.filter(card=>!card.action),source=connectors.find(card=>card.id==='pulse-source');if(random()<OFFER_CONFIG.connectorChance){if(source&&random()<OFFER_CONFIG.pulseSourceChance)return source;return pick(connectors.filter(card=>card.id!=='pulse-source'),random)}const rarity=rollRarity(random),actions=catalog.filter(card=>card.action&&card.offerRarity===rarity);return pick(actions.length?actions:catalog.filter(card=>card.action),random)}
const cardFrom = (archetype, seed, id) => {const key=typeof id==='number'?id:[...String(id)].reduce((total,char)=>total+char.charCodeAt(0),0),random=seeded(hash(seed,key)),source=makeCard(rollOfferDefinition(archetype,random),random,`card-${id}`);return structuredClone({...source,id:`card-${id}`,action:{...source.action,id:`card-${id}-action`}})};
export function createRun(archetype, seed = Math.floor(Math.random() * 0xffffffff)) {
  const starterIds = ['pulse-source','strike','defend'];
  const soundtrack=soundtrackForSeed(seed), degreeRandom=seeded(hash(seed,701)), collection = starterIds.map((id, index) => makeCard(cardById(id), () => 0, `starter-${index}`, degreeRandom));
  return { seed, soundtrack:soundtrack.id, progression:progressionForSeed(soundtrack,hash(seed,911)), archetype:'striker', hp:60, maxHp:60, gold:0, wins:0, battleNumber:1, collection, board:emptyBoard(), map:makeMap(seed, 0, 4), position:{row:-1,lane:1}, phase:'map', selectedNode:null, offers:[], status:'active' };
}
export function makeMap(seed, startRow, count) { return Array.from({length:count},(_,offset)=>{const row=startRow+offset, special=specialByRow[row%4];return Array.from({length:LANES},(_,lane)=>({id:`${row}-${lane}`,row,lane,kind:lane===hash(seed,row)%LANES?special:'fight',visited:false}))}) }
export function availableNodes(run) { const next=run.position.row+1, row=run.map.find(r=>r[0].row===next)||[];return row.filter(node=>run.position.row<0||Math.abs(node.lane-run.position.lane)<=1) }
export function selectNode(run, id) { const node=availableNodes(run).find(n=>n.id===id); if(!node) return run; const next=structuredClone(run);next.selectedNode=node;next.position={row:node.row,lane:node.lane};next.map.flat().find(n=>n.id===id).visited=true;next.map=next.map.filter(row=>row[0].row>=node.row);while(next.map.length<4)next.map.push(makeMap(next.seed,next.map.at(-1)[0].row+1,1)[0]);if(node.kind==='campfire'){next.hp=Math.min(next.maxHp,next.hp+Math.ceil(next.maxHp*.3));next.phase='campfire'}else if(node.kind==='shop'){next.offers=shopOffers(next);next.phase='shop'}else next.phase='build';return next }
export function encounterFor(run){const seed=hash(run.seed,run.battleNumber*53+run.position.row),depth=run.battleNumber-1,base=25+12*depth,mini=run.selectedNode.kind==='miniboss',generated=makeEncounter(seed);return {...generated, enemy:depth<2?'striker':generated.enemy, enemyHp:Math.round(base*(mini?1.5:1)), enemyStrength:Math.floor(depth/3)+(mini?2:0), enemyPieces:Math.min(5,1+Math.floor(depth/2)), miniboss:mini} }
export function rewardOffers(run,count){return Array.from({length:count},(_,i)=>cardFrom(run.archetype,hash(run.seed,run.battleNumber*101+i),`${run.battleNumber}-reward-${i}`))}
export function resolveVictory(run){const next=structuredClone(run),mini=next.selectedNode.kind==='miniboss';next.gold+=mini?20:10;next.wins++;next.offers=rewardOffers(next,mini?5:3);next.phase='reward';return next}
export function chooseReward(run, cardId){const card=run.offers.find(x=>x.id===cardId);if(!card)return run;const next=structuredClone(run);next.collection.push(card);next.offers=[];next.selectedNode=null;next.battleNumber++;next.phase='map';return next}
export function skipReward(run){if(run.phase!=='reward')return run;const next=structuredClone(run);next.gold+=10;next.offers=[];next.selectedNode=null;next.battleNumber++;next.phase='map';return next}
export function shopOffers(run){return Array.from({length:3},(_,i)=>cardFrom(run.archetype,hash(run.seed,run.position.row*151+i),`${run.position.row}-shop-${i}`))}
export function buyCard(run,cardId){const card=run.offers.find(x=>x.id===cardId);if(!card||run.gold<card.shopCost)return run;const next=structuredClone(run);next.gold-=card.shopCost;next.collection.push(card);next.offers=next.offers.filter(x=>x.id!==cardId);return next}
export function leaveShop(run){const next=structuredClone(run);next.offers=[];next.selectedNode=null;next.phase='map';return next}
export function leaveCampfire(run){const next=structuredClone(run);next.selectedNode=null;next.phase='map';return next}
export const archetypeName = id => ARCHETYPES[id].name;
