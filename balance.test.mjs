import test from 'node:test';
import assert from 'node:assert/strict';
import { SimpleForecastPolicy, createTuningConfig, evaluateCardInScenarios, evaluateCatalog, evaluateSeeds, simulateBattle, simulateRun } from './balance.js';
import { createRun, encounterFor } from './run.js';

test('headless battles cap an unresolved fight as a stall',()=>{
  const run=createRun('striker',1);run.selectedNode={kind:'fight'};
  const result=simulateBattle([],encounterFor(run),{beatCap:3});
  assert.equal(result.result,'Stall');assert.equal(result.beats,3);
});
test('simulation is deterministic and reports campaign milestones',()=>{
  const config=createTuningConfig({campaignBattles:2,milestones:[1,2],battleBeatCap:80});const policy=new SimpleForecastPolicy(config);
  const first=simulateRun(42,policy,config),second=simulateRun(42,policy,config),report=evaluateSeeds([1,2],policy,config);
  assert.deepEqual(first,second);assert.deepEqual(Object.keys(report.milestones),['1','2']);assert.equal(report.configHash,config.hash);
});
test('card scenarios use matched alternatives and expose attribution telemetry',()=>{
  const config=createTuningConfig({forecastBeats:12,battleBeatCap:40}),policy=new SimpleForecastPolicy(config),run=createRun('striker',9);run.selectedNode={kind:'fight'};
  const report=evaluateCardInScenarios('strike',[{seed:9,run,encounter:encounterFor(run)},{seed:10,run,encounter:encounterFor(run)}],policy,config);
  assert.equal(report.samples,2);assert.equal(report.damageDelta95CI.length,2);assert.equal(typeof report.activationRate,'number');
});
test('catalog report ranks concise card summaries from replay states',()=>{
  const config=createTuningConfig({campaignBattles:1,forecastBeats:8,battleBeatCap:30}),policy=new SimpleForecastPolicy(config),runs=[simulateRun(3,policy,config)];
  const report=evaluateCatalog(runs,policy,config,1);
  assert.ok(report.length>40);assert.equal(report[0].rows,undefined);assert.equal(typeof report[0].meanWinDelta,'number');
});
