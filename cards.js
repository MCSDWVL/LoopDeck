// Declarative, JSON-compatible card catalog. Runtime instances only add id/ports.
export const MUSIC_CONFIG={
  consistentCardDegrees:true,
  soundtracks:{
    aeolian:{id:'aeolian',name:'Aeolian crypt',scale:[0,2,3,5,7,8,10],progression:[0,5,8,7],chords:[{root:0,tones:[0,3,7]},{root:5,tones:[0,3,7]},{root:8,tones:[0,4,7]},{root:7,tones:[0,3,7]}],tonicHz:55,playerRoot:110,enemyRoot:220,nodeWave:'triangle',droneWave:'sine'},
    phrygian:{id:'phrygian',name:'Phrygian depths',scale:[0,1,3,5,7,8,10],progression:[0,1,7,0],chords:[{root:0,tones:[0,3,7]},{root:1,tones:[0,4,7],transitionAccent:true},{root:7,tones:[0,3,7]},{root:0,tones:[0,3,7]}],tonicHz:49,playerRoot:98,enemyRoot:196,nodeWave:'sine',droneWave:'triangle'},
    harmonicMinor:{id:'harmonicMinor',name:'Harmonic catacombs',scale:[0,2,3,5,7,8,11],progression:[0,5,8,7],chords:[{root:0,tones:[0,3,7]},{root:5,tones:[0,3,7]},{root:8,tones:[0,4,7]},{root:7,tones:[0,4,7]}],tonicHz:55,playerRoot:110,enemyRoot:220,nodeWave:'triangle',droneWave:'sawtooth'}
  }
};
export function soundtrackForSeed(seed){const presets=Object.values(MUSIC_CONFIG.soundtracks);return presets[(seed>>>0)%presets.length]}
export function chordForBeat(preset,beat){return preset.chords[Math.floor((beat-1)/4)%preset.chords.length]}
export function allocateChordVoices(preset,beat,candidates,limit=3){const chord=chordForBeat(preset,beat),voices=[],heard=new Set();for(const candidate of candidates){const degree=Math.max(0,candidate.degree||0),toneIndex=degree%chord.tones.length,octave=Math.floor(degree/chord.tones.length),key=`${toneIndex}:${octave}`;if(heard.has(key))continue;heard.add(key);voices.push({...candidate,semitones:chord.root+chord.tones[toneIndex]+octave*12});if(voices.length===limit)break}return voices}
export const PORT_WEIGHTS={connector:[.03,.42,.42,.13],low:[.18,.57,.21,.04],mid:[.42,.45,.11,.02],strong:[.72,.24,.035,.005]};
const amount=(base=0,from=null,per=1)=>({base,from,per});
const effect=(type,target,value,extra={})=>({type,target,value,...extra});
const action=(name,text,effects,tags=[])=>({name,text,effects,tags});
const set=(archetype,entries)=>entries.map(entry=>({...entry,archetype,shopCost:entry.shopCost??(entry.action?25:10),rewardWeight:entry.rewardWeight??(entry.action?1:4)}));

export const CARD_DEFINITIONS=[
  ...set('*',[
    {id:'pulse-source',name:'Pulse Source',tier:'connector',node:'activator',params:{cadence:4,incomingChance:.1},degree:0,action:null,rewardWeight:.08},
    {id:'signal-link',name:'Signal Link',tier:'connector',node:'relay',degree:1,action:null},
    {id:'turn-link',name:'Turn Link',tier:'connector',node:'relayTurn',degree:2,action:null},
  ]),
  ...set('striker',[
    {id:'strike',name:'Strike',tier:'low',node:'relay',degree:0,action:action('Strike','Deal 6 damage',[effect('damage','enemy',amount(6))],['attack'])},
    {id:'defend',name:'Defend',tier:'low',node:'relay',degree:0,action:action('Defend','Gain 5 block',[effect('block','self',amount(5))],['block'])},
    {id:'twin-strike',name:'Twin Strike',tier:'low',node:'relayTurn',degree:1,action:action('Twin Strike','Deal 4 damage twice',[effect('damage','enemy',amount(4),{times:2})],['attack'])},
    {id:'sharpen',name:'Sharpen',tier:'mid',node:'delay',params:{beats:2},degree:2,action:action('Sharpen','Gain 2 strong',[effect('status','self',amount(2),{status:'strong'})],['skill'])},
    {id:'crescendo',name:'Crescendo',tier:'strong',node:'accumulator',params:{threshold:3},degree:3,action:action('Crescendo','Deal 11 damage',[effect('damage','enemy',amount(11))],['attack'])},
    {id:'guard',name:'Guard',tier:'low',node:'relay',degree:0,action:action('Guard','Gain 7 block',[effect('block','self',amount(7))],['block'])},
    {id:'fortify',name:'Fortify',tier:'mid',node:'delay',params:{beats:2},degree:2,action:action('Fortify','Gain 12 block',[effect('block','self',amount(12))],['block'])},
    {id:'slam',name:'Slam',tier:'strong',node:'accumulator',params:{threshold:3},degree:3,action:action('Slam','Spend all block; deal that much damage',[effect('damage','enemy',amount(0,'selfBlock'),{spend:'selfBlock'})],['attack'])},
    {id:'brace',name:'Brace',tier:'low',node:'relayTurn',degree:2,action:action('Brace','Gain 4 block and 1 strong',[effect('block','self',amount(4)),effect('status','self',amount(1),{status:'strong'})],['block'])},
  ]),
  ...set('enemy-venom',[
    {id:'venom',name:'Venom',tier:'low',node:'relay',degree:0,action:action('Venom','Apply 3 poison',[effect('status','enemy',amount(3),{status:'poison'})],['debuff'])},
    {id:'toxic-slash',name:'Toxic Slash',tier:'low',node:'relayTurn',degree:1,action:action('Toxic Slash','Deal 4 damage; apply 2 poison',[effect('damage','enemy',amount(4)),effect('status','enemy',amount(2),{status:'poison'})],['attack'])},
    {id:'infect',name:'Infect',tier:'mid',node:'delay',params:{beats:2},degree:2,action:action('Infect','Apply 6 poison',[effect('status','enemy',amount(6),{status:'poison'})],['debuff'])},
    {id:'puncture',name:'Puncture',tier:'strong',node:'accumulator',params:{threshold:3},degree:3,action:action('Puncture','Deal 7 damage',[effect('damage','enemy',amount(7))],['attack'])},
  ])
];
export const catalogFor=archetype=>CARD_DEFINITIONS.filter(card=>card.archetype===archetype||card.archetype==='*');
export const cardById=id=>CARD_DEFINITIONS.find(card=>card.id===id);
export function outputCount(tier,random){const weights=PORT_WEIGHTS[tier],roll=random();let sum=0;for(let count=0;count<weights.length;count++){sum+=weights[count];if(roll<sum)return count}return 1}
