export const BOSS_SCHEDULE=[{battle:12,bossId:'reprisal-conduit'}];

export const BOSS_DEFINITIONS=[{
  id:'reprisal-conduit',
  name:'Reprisal Conduit',
  enemy:'striker',
  hp:160,
  reward:{gold:30,cardChoices:5},
  board:[
    {cell:0,type:'activator',out:['E'],params:{cadence:4}},
    {cell:1,type:'delay',in:['W'],out:['E'],params:{beats:2}},
    {cell:2,type:'delay',in:['W'],out:['E'],params:{beats:2}},
    {cell:3,type:'delay',in:['W'],out:['E'],params:{beats:2}},
    {cell:4,type:'delay',in:['W'],out:['S'],params:{beats:2}},
    {cell:9,type:'delay',in:['N'],out:['S'],params:{beats:2}},
    {cell:14,type:'delay',in:['N'],out:['S'],params:{beats:2}},
    {cell:19,type:'relay',in:['N'],out:[],actionId:'reprisal'}
  ]
}];

export const bossById=id=>BOSS_DEFINITIONS.find(boss=>boss.id===id);
export const bossForBattle=battle=>{const entry=BOSS_SCHEDULE.find(item=>item.battle===battle);return entry?bossById(entry.bossId):null};
