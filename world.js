// Dunia 2D bersama (canvas biasa, tanpa library). Memakai: sb, me, room, G, SKINS, Z, drawGame
const TS=32,W=20,H=12;
const ZN={
 restoran:{x:1,y:2,w:5,h:8,c:'#fde0b8',n:'🏠 RESTORAN',s:[[2,3,'🔥'],[4,3,'🍳'],[2,6,'🥘'],[4,6,'🔪'],[3,8,'♨️']]},
 sayur:{x:8,y:2,w:5,h:3,c:'#d6efcf',n:'🥬 SAYUR',s:[[9,3,'🥬'],[11,3,'🥔']]},
 daging:{x:14,y:2,w:5,h:3,c:'#f6d3d3',n:'🥩 DAGING',s:[[15,3,'🥩'],[17,3,'🐟']]},
 bumbu:{x:8,y:6,w:5,h:4,c:'#f5e6b8',n:'🧄 BUMBU',s:[[9,7,'🧄'],[11,7,'🌶️']]},
 alat:{x:14,y:6,w:5,h:4,c:'#d9dcec',n:'🔧 ALAT',s:[[15,7,'🍳'],[17,7,'🔪']]}
};
function nearIds(){if(!WD)return[];return Object.keys(WD.o).filter(id=>{const o=WD.o[id];return Math.hypot(o.x-WD.x,o.y-WD.y)<3})}
let WD=null;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const KM={ArrowUp:'u',w:'u',ArrowDown:'d',s:'d',ArrowLeft:'l',a:'l',ArrowRight:'r',d:'r'};
addEventListener('keydown',e=>{if(WD&&KM[e.key]&&!/INPUT|TEXTAREA/.test(e.target.tagName)){WD.k[KM[e.key]]=1;e.preventDefault()}});
addEventListener('keyup',e=>{if(WD&&KM[e.key])WD.k[KM[e.key]]=0});
const dp=(k,t)=>`<button class="b2" style="font-size:24px;padding:10px" onpointerdown="WD.k['${k}']=1" onpointerup="WD.k['${k}']=0" onpointerleave="WD.k['${k}']=0" onpointercancel="WD.k['${k}']=0" oncontextmenu="return false">${t}</button>`;

function startWorld(){
  if(WD&&WD.rid==room.id) return;
  stopWorld();
  $('wd').innerHTML=`<canvas id="cv" width="${W*TS}" height="${H*TS}" style="width:100%;image-rendering:pixelated;border:3px solid #3b2a1a;border-radius:10px;touch-action:none"></canvas>
  <div style="display:grid;grid-template-columns:repeat(3,64px);gap:6px;justify-content:center;margin:10px 0;user-select:none;touch-action:none"><span></span>${dp('u','⬆️')}<span></span>${dp('l','⬅️')}${dp('d','⬇️')}${dp('r','➡️')}</div>`;
  WD={rid:room.id,x:7,y:10.5,k:{},o:{},t:0,s:0,raf:0};
  WD.ch=sb.channel('w:'+room.id,{config:{broadcast:{self:false}}})
    .on('broadcast',{event:'p'},({payload:p})=>{
      if(!WD||p.id==me.id) return;
      const o=WD.o[p.id]||(WD.o[p.id]={x:p.x,y:p.y});
      o.tx=p.x; o.ty=p.y; o.seen=Date.now();
    }).subscribe();
  WD.raf=requestAnimationFrame(loop);
}
function stopWorld(){
  if(!WD) return;
  cancelAnimationFrame(WD.raf);
  sb.removeChannel(WD.ch);
  WD=null; Z=null;
  const b=$('wd'); if(b) b.innerHTML='';
}
function loop(t){
  if(!WD) return;
  const dt=Math.min(.05,(t-WD.t)/1000||0); WD.t=t;
  const dx=(WD.k.r?1:0)-(WD.k.l?1:0), dy=(WD.k.d?1:0)-(WD.k.u?1:0);
  if(dx||dy){
    const n=Math.hypot(dx,dy);
    WD.x=clamp(WD.x+dx/n*4*dt,.5,W-.5); WD.y=clamp(WD.y+dy/n*4*dt,.5,H-.5);
  }
  let z=null;
  for(const k in ZN){const a=ZN[k]; if(WD.x>a.x&&WD.x<a.x+a.w&&WD.y>a.y&&WD.y<a.y+a.h) z=k}
  if(z!==Z){Z=z; drawGame()}
  const nb=nearIds().join(); if(nb!==WD.nb){WD.nb=nb; drawGame()}
  if(t-WD.s>(dx||dy?100:1000)){
    WD.s=t;
    WD.ch.send({type:'broadcast',event:'p',payload:{id:me.id,x:+WD.x.toFixed(2),y:+WD.y.toFixed(2)}});
  }
  draw();
  WD.raf=requestAnimationFrame(loop);
}
function who(id){const r=G.p&&G.p.find(x=>x.player_id==id);return r?r.players:{name:'?',skin:null}}
function sprite(g,x,y,id,mine){
  const p=who(id), sk=SKINS.includes(p.skin)?p.skin:SKINS[0], px=x*TS, py=y*TS;
  g.fillStyle='#0003'; g.fillRect(px-9,py+8,18,5);
  g.fillStyle='#fff'; g.fillRect(px-8,py-2,16,12); g.strokeStyle='#999'; g.lineWidth=1; g.strokeRect(px-8,py-2,16,12);
  g.fillStyle=sk; g.fillRect(px-7,py-14,14,13);
  g.fillStyle='#222'; g.fillRect(px-4,py-9,3,3); g.fillRect(px+2,py-9,3,3);
  g.fillStyle='#fff'; g.fillRect(px-8,py-20,16,7);
  g.font='bold 11px monospace'; g.textAlign='center'; g.fillStyle=mine?'#ea580c':'#3b2a1a';
  g.fillText(p.name,px,py-24); g.textAlign='left';
}
function draw(){
  const c=$('cv'); if(!c||!WD) return;
  const g=c.getContext('2d');
  g.fillStyle='#fff7ed'; g.fillRect(0,0,c.width,c.height);
  for(const k in ZN){
    const a=ZN[k];
    g.fillStyle=a.c; g.fillRect(a.x*TS,a.y*TS,a.w*TS,a.h*TS);
    g.strokeStyle=Z==k?'#ea580c':'#3b2a1a'; g.lineWidth=3; g.strokeRect(a.x*TS,a.y*TS,a.w*TS,a.h*TS);
    g.font='bold 14px monospace'; g.fillStyle='#3b2a1a'; g.fillText(a.n,a.x*TS+4,a.y*TS-6);
    g.font='24px serif'; a.s.forEach(s=>g.fillText(s[2],s[0]*TS,s[1]*TS+24));
  }
  const now=Date.now(), list=[];
  for(const id in WD.o){
    const o=WD.o[id];
    if(now-o.seen>4000){delete WD.o[id];continue}
    o.x+=(o.tx-o.x)*.3; o.y+=(o.ty-o.y)*.3;
    list.push([o.y,o.x,id,false]);
  }
  list.push([WD.y,WD.x,me.id,true]);
  list.sort((a,b)=>a[0]-b[0]).forEach(a=>sprite(g,a[1],a[0],a[2],a[3]));
}
