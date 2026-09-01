import { SimpleForecastPolicy, createTuningConfig, evaluateCatalog, evaluateSeeds } from './balance.js';

const count=Math.max(1,Number.parseInt(process.argv[2]||'100',10)||100);
const start=Number.parseInt(process.argv[3]||'1',10)||1;
const config=createTuningConfig(), policy=new SimpleForecastPolicy(config);
const report=evaluateSeeds(Array.from({length:count},(_,index)=>start+index),policy,config);
// Keep per-run detail available to API callers, but make the CLI output practical for review/check-in.
const {runs,...summary}=report;
summary.cards=evaluateCatalog(runs,policy,config,Math.min(24,runs.flatMap(run=>run.battles).length));
console.log(JSON.stringify(summary,null,2));
