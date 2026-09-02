import { CARD_DEFINITIONS, OFFER_CONFIG, PORT_WEIGHTS, cardById, catalogFor } from './cards.js';
import { advance, createBattle, fieldCard, makeCard, poweredNodes, seeded } from './game.js';
import { availableNodes, buyCard, chooseReward, createRun, encounterFor, leaveCampfire, leaveShop, resolveVictory, selectNode, skipReward } from './run.js';
import {BOSS_DEFINITIONS,BOSS_SCHEDULE,bossById} from './bosses.js';

const hashText=text=>{let value=2166136261;for(const char of text)value=Math.imul(value^char.charCodeAt(0),16777619);return (value>>>0).toString(16)};
const clone=value=>structuredClone(value);
const encounterOptions=encounter=>({enemyHp:encounter.enemyHp,enemyStrength:encounter.enemyStrength,enemyPieces:encounter.enemyPieces,enemyDepth:encounter.enemyDepth,enemyRank:encounter.enemyRank,bossId:encounter.bossId,seed:encounter.seed});

export function createTuningConfig(overrides={}) {
  const config={version:'balance-v1',campaignBattles:12,forecastBeats:24,battleBeatCap:200,milestones:[4,8,12],lowHpFraction:.4,...overrides};
  // The snapshot makes reports traceable to the authored knobs in cards.js/game.js.
  config.content={cards:CARD_DEFINITIONS,bosses:BOSS_DEFINITIONS,offerConfig:OFFER_CONFIG,portWeights:PORT_WEIGHTS};
  config.hash=hashText(JSON.stringify(config));
  return config;
}

export function simulateBattle(board,encounter,options={}) {
  const cap=options.beatCap??200;
  let battle=createBattle(clone(board),encounter.enemy,encounter.scale,{playerHp:options.playerHp,playerMaxHp:options.playerMaxHp,...encounterOptions(encounter)});
  while(!battle.over&&battle.beat<cap) battle=advance(battle);
  const stalled=!battle.over;
  return {result:stalled?'Stall':battle.result,stalled,beats:battle.beat,playerHp:battle.player.hp,playerMaxHp:battle.player.maxHp,enemyHp:battle.enemy.hp,enemyMaxHp:battle.enemy.maxHp,battle};
}

function score(result,board) {
  return [result.result==='Victory'?1:0,result.enemyMaxHp-result.enemyHp,result.playerHp,poweredNodes(board).size];
}
function better(a,b) { for(let i=0;i<a.length;i++){if(a[i]!==b[i])return a[i]>b[i]} return false }
function equal(a,b) { return a.every((value,index)=>value===b[index]) }
function forecast(board,run,encounter,config) {
  const result=simulateBattle(board,encounter,{playerHp:run.hp,playerMaxHp:run.maxHp,beatCap:config.forecastBeats});
  return {result,score:score(result,board)};
}
function sourceCards(collection) { return collection.filter(card=>card.type==='activator').sort((a,b)=>a.id.localeCompare(b.id)) }
const offsets={N:-5,E:1,S:5,W:-1},opposite={N:'S',E:'W',S:'N',W:'E'};
function frontier(board) {
  const cells=new Map();
  board.forEach((node,index)=>{if(!node)return;for(const direction of node.out){const cell=index+offsets[direction],row=Math.floor(index/5),col=index%5;
      if((direction==='N'&&row===0)||(direction==='S'&&row===4)||(direction==='W'&&col===0)||(direction==='E'&&col===4)||board[cell])continue;
      cells.set(cell,opposite[direction]);
  }});
  return cells;
}

/** A reproducible, intentionally limited player model; it is not a power optimizer. */
export class SimpleForecastPolicy {
  constructor(config=createTuningConfig()) { this.config=config; this.version='simple-forecast-v1' }

  buildBoard(run,encounter) {
    const empty=Array(25).fill(null), sources=sourceCards(run.collection);
    if(!sources.length)return empty;
    // A fixed corner bootstrap leaves both starter outputs usable and avoids an omniscient layout search.
    let board=empty;board[0]=fieldCard(sources[0]);
    for(let step=0;step<run.collection.length;step++){
      const current=forecast(board,run,encounter,this.config);let choice=null;
      const used=new Set(board.filter(Boolean).map(card=>card.id));
      const cells=frontier(board);
      for(const card of run.collection.filter(card=>!used.has(card.id)).sort((a,b)=>a.id.localeCompare(b.id)))for(const [cell,input] of cells)if(card.in.includes(input)){
        const candidate=clone(board);candidate[cell]=fieldCard(card);const projected=forecast(candidate,run,encounter,this.config),key=`${card.id}:${cell}`;
        if(better(projected.score,current.score)&&(!choice||better(projected.score,choice.projected.score)||(equal(projected.score,choice.projected.score)&&key<choice.key)))choice={board:candidate,projected,key};
      }
      if(!choice)break;
      board=choice.board;
    }
    return board;
  }

  chooseMap(run) {
    const nodes=availableNodes(run);if(!nodes.length)return null;
    if(run.hp/run.maxHp<this.config.lowHpFraction){const fire=nodes.find(node=>node.kind==='campfire');if(fire)return fire.id}
    // Shop contents are not previewed, so the policy only visits when it can afford a card.
    if(run.gold>=25){const shop=nodes.find(node=>node.kind==='shop');if(shop)return shop.id}
    let best=null;
    for(const node of nodes.filter(node=>node.kind==='fight'||node.kind==='miniboss')){
      const candidate=selectNode(run,node.id),encounter=encounterFor(candidate),board=this.buildBoard(candidate,encounter),projected=forecast(board,candidate,encounter,this.config);
      if(!best||better(projected.score,best.projected.score)||(equal(projected.score,best.projected.score)&&node.id<best.node.id))best={node,projected};
    }
    return best?.node.id??nodes[0].id;
  }

  chooseReward(run) {
    if(!run.offers.length)return null;
    const samples=[run.battleNumber,run.battleNumber+1].map(number=>{const sample=clone(run);sample.battleNumber=number;sample.selectedNode={kind:'fight'};return encounterFor(sample)});
    let best=null;
    for(const offer of run.offers){let total=0;for(const encounter of samples){const candidate=clone(run);candidate.collection.push(offer);const board=this.buildBoard(candidate,encounter);total+=forecast(board,candidate,encounter,this.config).score[1]}if(!best||total>best.total||(total===best.total&&offer.id<best.offer.id))best={offer,total}}
    return best?.offer.id??null;
  }

  chooseShop(run) {
    let best=null;for(const offer of run.offers.filter(card=>card.shopCost<=run.gold)){const sample=clone(run);sample.selectedNode={kind:'fight'};const encounter=encounterFor(sample),candidate=clone(run);candidate.collection.push(offer);const board=this.buildBoard(candidate,encounter),value=forecast(board,candidate,encounter,this.config).score[1];if(!best||value>best.value||(value===best.value&&offer.id<best.offer.id))best={offer,value}}
    return best?.offer.id??null;
  }
}

export function simulateRun(seed,policy=new SimpleForecastPolicy(),config=policy.config??createTuningConfig()) {
  let run=createRun('striker',seed), decisions=[], battles=[], guard=0;
  while(run.wins<config.campaignBattles&&guard++<config.campaignBattles*4){
    const nodeId=policy.chooseMap(run);if(!nodeId)break;run=selectNode(run,nodeId);decisions.push({type:'map',nodeId});
    if(run.phase==='campfire'){run=leaveCampfire(run);continue}
    if(run.phase==='shop'){const cardId=policy.chooseShop(run);if(cardId)run=buyCard(run,cardId);run=leaveShop(run);continue}
    const encounter=encounterFor(run),board=policy.buildBoard(run,encounter),result=simulateBattle(board,encounter,{playerHp:run.hp,playerMaxHp:run.maxHp,beatCap:config.battleBeatCap});
    battles.push({battleNumber:run.battleNumber,runState:clone(run),encounter,board,result});run.hp=result.playerHp;
    if(result.result!=='Victory')break;
    run=resolveVictory(run);const rewardId=policy.chooseReward(run);
    if(rewardId){decisions.push({type:'reward',cardId:rewardId});run=chooseReward(run,rewardId)}else run=skipReward(run);
  }
  return {seed,policyVersion:policy.version,configHash:config.hash,wins:run.wins,completed:run.wins>=config.campaignBattles,finalHp:run.hp,maxHp:run.maxHp,battles,decisions};
}
function percentile(values,p) { if(!values.length)return 0;const ordered=[...values].sort((a,b)=>a-b),index=(ordered.length-1)*p,low=Math.floor(index),high=Math.ceil(index);return ordered[low]+(ordered[high]-ordered[low])*(index-low) }
export function evaluateSeeds(seeds,policy=new SimpleForecastPolicy(),config=policy.config??createTuningConfig()) {
  const runs=seeds.map(seed=>simulateRun(seed,policy,config));
  const milestones=Object.fromEntries(config.milestones.map(milestone=>{const reached=runs.filter(run=>run.wins>=milestone);return [milestone,{survivalRate:reached.length/runs.length,medianHp:percentile(reached.map(run=>run.battles[milestone-1]?.result.playerHp??0),.5),p25Hp:percentile(reached.map(run=>run.battles[milestone-1]?.result.playerHp??0),.25)}]}));
  const battles=runs.flatMap(run=>run.battles),stalls=battles.filter(entry=>entry.result.stalled).length;
  return {configHash:config.hash,policyVersion:policy.version,runs,milestones,clearRate:runs.filter(run=>run.completed).length/runs.length,meanWins:runs.reduce((sum,run)=>sum+run.wins,0)/runs.length,meanHpLostPerBattle:battles.length?battles.reduce((sum,entry)=>sum+(entry.result.playerMaxHp-entry.result.playerHp),0)/battles.length:0,stallRate:battles.length?stalls/battles.length:0};
}

export function evaluateBoss(bossId,seeds,policy=new SimpleForecastPolicy(),config=policy.config??createTuningConfig()) {
  const boss=bossById(bossId),schedule=BOSS_SCHEDULE.find(entry=>entry.bossId===bossId);if(!boss||!schedule)throw new Error(`Unknown scheduled boss: ${bossId}`);
  const battleNumber=schedule.battle,rows=seeds.map(seed=>{
    let run=createRun('striker',seed);
    while(run.battleNumber<battleNumber){run.selectedNode={kind:'fight'};run=resolveVictory(run);const offer=run.offers[(seed+run.battleNumber)%run.offers.length];run=chooseReward(run,offer.id)}
    run.selectedNode={kind:'boss'};const encounter=encounterFor(run),board=policy.buildBoard(run,encounter),result=simulateBattle(board,encounter,{playerHp:run.hp,playerMaxHp:run.maxHp,beatCap:config.battleBeatCap});
    let checkpoint=createBattle(clone(board),encounter.enemy,encounter.scale,{playerHp:run.hp,playerMaxHp:run.maxHp,...encounterOptions(encounter)});while(!checkpoint.over&&checkpoint.beat<20)checkpoint=advance(checkpoint);
    return {result,damageByBeat20:checkpoint.enemy.maxHp-checkpoint.enemy.hp};
  }),wins=rows.filter(row=>row.result.result==='Victory');
  return {bossId,name:boss.name,samples:rows.length,winRate:wins.length/(rows.length||1),medianWinningHp:percentile(wins.map(row=>row.result.playerHp),.5),medianBossHpOnLoss:percentile(rows.filter(row=>row.result.result!=='Victory').map(row=>row.result.enemyHp),.5),medianDamageByBeat20:percentile(rows.map(row=>row.damageByBeat20),.5),rows};
}

export function evaluateCardInScenarios(definitionId,scenarios,policy=new SimpleForecastPolicy(),config=policy.config??createTuningConfig()) {
  const definition=cardById(definitionId);if(!definition)throw new Error(`Unknown card: ${definitionId}`);
  const alternatives=catalogFor('striker').filter(card=>card.action&&card.tier===definition.tier&&card.id!==definitionId);
  const rows=scenarios.map((scenario,index)=>{const random=seeded((scenario.seed??index)+17),card=makeCard(definition,random,`probe-${definitionId}-${index}`),replacement=alternatives.length?makeCard(alternatives[index%alternatives.length],random,`replacement-${index}`):null,withRun=clone(scenario.run),withoutRun=clone(scenario.run);withRun.collection.push(card);if(replacement)withoutRun.collection.push(replacement);const withBoard=policy.buildBoard(withRun,scenario.encounter),withoutBoard=policy.buildBoard(withoutRun,scenario.encounter),withResult=simulateBattle(withBoard,scenario.encounter,{playerHp:withRun.hp,playerMaxHp:withRun.maxHp,beatCap:config.battleBeatCap}),withoutResult=simulateBattle(withoutBoard,scenario.encounter,{playerHp:withoutRun.hp,playerMaxHp:withoutRun.maxHp,beatCap:config.battleBeatCap}),indexOnBoard=withBoard.findIndex(node=>node?.id===card.id),activations=indexOnBoard<0?0:withResult.battle.player.nodeState[indexOnBoard]?.activations||0;return {withResult,withoutResult,winDelta:Number(withResult.result==='Victory')-Number(withoutResult.result==='Victory'),damageDelta:(withResult.enemyMaxHp-withResult.enemyHp)-(withoutResult.enemyMaxHp-withoutResult.enemyHp),hpDelta:withResult.playerHp-withoutResult.playerHp,selected:indexOnBoard>=0,reachable:indexOnBoard>=0&&poweredNodes(withBoard).has(indexOnBoard),activated:activations>0,stalled:withResult.stalled}});
  const mean=key=>rows.reduce((sum,row)=>sum+row[key],0)/(rows.length||1);
  const interval=key=>{const values=rows.map(row=>row[key]),average=mean(key);if(values.length<2)return [average,average];const variance=values.reduce((sum,value)=>sum+(value-average)**2,0)/(values.length-1);const margin=1.96*Math.sqrt(variance/values.length);return [average-margin,average+margin]};
  return {definitionId,samples:rows.length,selectionRate:mean('selected'),reachableRate:mean('reachable'),activationRate:mean('activated'),stallRate:mean('stalled'),meanWinDelta:mean('winDelta'),winDelta95CI:interval('winDelta'),meanDamageDelta:mean('damageDelta'),damageDelta95CI:interval('damageDelta'),meanHpDelta:mean('hpDelta'),hpDelta95CI:interval('hpDelta'),rows};
}

function evenlySpaced(items,count) { if(items.length<=count)return items;return Array.from({length:count},(_,index)=>items[Math.floor(index*(items.length-1)/(count-1))]); }
/**
 * Evaluates every player-available definition against identical pre-battle states.
 * `scenarioLimit` is intentionally bounded: it is a screening report, not a replacement for
 * deeper mechanic-specific scenario suites.
 */
export function evaluateCatalog(runs,policy=new SimpleForecastPolicy(),config=policy.config??createTuningConfig(),scenarioLimit=24) {
  const scenarios=evenlySpaced(runs.flatMap(run=>run.battles.map(entry=>({seed:run.seed*100+entry.battleNumber,run:entry.runState,encounter:entry.encounter}))),scenarioLimit);
  const cards=CARD_DEFINITIONS.filter(definition=>definition.archetype==='striker'||definition.archetype==='*').map(definition=>{
    const report=evaluateCardInScenarios(definition.id,scenarios,policy,config);
    const {rows,...summary}=report;
    return {...summary,name:definition.name,tier:definition.tier,node:definition.node};
  });
  return cards.sort((a,b)=>b.meanWinDelta-a.meanWinDelta||b.meanHpDelta-a.meanHpDelta||b.meanDamageDelta-a.meanDamageDelta||a.definitionId.localeCompare(b.definitionId));
}
