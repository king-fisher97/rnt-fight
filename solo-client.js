// Entire solo release runs in the browser. No identity, token, API, or socket required.
export const DIFFICULTIES=Object.freeze([
 {label:'WARM UP',reaction:26,guard:.12,punish:.10,approach:.65,attack:.42,jump:.03},
 {label:'GETTING SERIOUS',reaction:22,guard:.20,punish:.18,approach:.72,attack:.50,jump:.05},
 {label:'HOLD YOUR GROUND',reaction:18,guard:.28,punish:.27,approach:.78,attack:.58,jump:.07},
 {label:'CONTENDER',reaction:14,guard:.36,punish:.36,approach:.84,attack:.66,jump:.09},
 {label:'FINAL BOSS',reaction:10,guard:.44,punish:.45,approach:.90,attack:.74,jump:.11}
]);
export const difficulty=round=>DIFFICULTIES[Math.max(0,Math.min(4,round-1))];
const BEST_KEY='rnt.solo.best.v1';
export class SoloRun {
 constructor(storage){
  try{this.storage=storage===undefined?globalThis.localStorage:storage;const n=Number(this.storage?.getItem(BEST_KEY));this.best=Number.isSafeInteger(n)&&n>=0?n:0;}catch{this.best=0;}
  this.start();
 }
 start(){this.round=1;this.score=0;this.wins=0;this.finished=false;this.complete=false;}
 resolve(won,hp,seconds){
  if(this.finished)return {finished:true,complete:this.complete,points:0};
  const bounded=(v,max)=>Number.isFinite(v)?Math.max(0,Math.min(max,Math.floor(v))):0;
  const points=won?1000+bounded(hp,100)*10+bounded(seconds,99)*5:0;
  this.score+=points;if(won)this.wins++;
  this.complete=this.wins===5;this.finished=!won||this.complete;
  if(!this.finished)this.round++;
  this.best=Math.max(this.best,this.score);
  try{this.storage?.setItem(BEST_KEY,String(this.best));}catch{/* private browsing: run still works */}
  return {finished:this.finished,complete:this.complete,points};
 }
}
export function createRntClient(){
 return {active:false,running:false,slot:0,recentHashes:{},step(){},async init(){
  const tg=window.Telegram?.WebApp;
  tg?.ready();tg?.expand();
  if(tg?.isVersionAtLeast?.('7.7'))tg.disableVerticalSwipes();
  const updateSafe=()=>{const safe=tg?.contentSafeAreaInset||tg?.safeAreaInset||{};
   document.documentElement.style.setProperty('--tg-safe-top',(safe.top||0)+'px');
   document.documentElement.style.setProperty('--tg-safe-bottom',(safe.bottom||0)+'px');};
  updateSafe();tg?.onEvent('contentSafeAreaChanged',updateSafe);
  const res=await fetch('./roster.json');if(!res.ok)throw new Error('Could not load roster');
  const registry=await res.json(),select=document.getElementById('character'),buttons=document.querySelector('.roster-buttons');
  select.replaceChildren();buttons.replaceChildren();
  for(const fighter of registry.fighters){
   const o=document.createElement('option');o.value=fighter.id;o.textContent=fighter.name;select.append(o);
   const b=document.createElement('button');b.dataset.fighter=fighter.id;b.textContent=fighter.name;
   b.onclick=()=>{select.value=fighter.id;select.dispatchEvent(new Event('change'));};buttons.append(b);
  }
  select.onchange=()=>document.querySelectorAll('[data-fighter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.fighter===select.value)));
  select.dispatchEvent(new Event('change'));
  const run=new SoloRun();document.getElementById('lobbyStatus').textContent='PERSONAL BEST: '+run.best+' · Saved on this device only';
 }};
}
