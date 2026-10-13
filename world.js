// Dunia 2D tampak samping (canvas). Kamera mengikuti pemain, bisa zoom. Memakai: sb, me, room, G, SKINS, Z, drawGame
const CW=640,CH=360,TS=32,WW=56,GY=10;
const ZN={
 restoran:{x:2,w:10,c:'#fde0b8',r:'#ea580c',n:'🏠 RESTORAN',s:['🔥','🍳','🥘','🔪']},
 sayur:{x:15,w:8,c:'#d6efcf',r:'#16a34a',n:'🥬 SAYUR',s:['🥬','🥔','🍅']},
 daging:{x:25,w:8,c:'#f6d3d3',r:'#dc2626',n:'🥩 DAGING',s:['🥩','🐟','🥚']},
 bumbu:{x:35,w:8,c:'#f5e6b8',r:'#ca8a04',n:'🧄 BUMBU',s:['🧄','🌶️','🧈']},
 alat:{x:45,w:8,c:'#d9dcec',r:'#4f46e5',n:'🔧 ALAT',s:['🍳','🔪','♨️']}
};
let WD=null;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const KM={ArrowLeft:'l',a:'l',ArrowRight:'r',d:'r'};
addEventListener('keydown',e=>{if(WD&&KM[e.key]&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)){WD.k[KM[e.key]]=1;e.preventDefault()}});
addEventListener('keyup',e=>{if(WD&&KM[e.key])WD.k[KM[e.key]]=0});
const dp=(k,t)=>`<button class="b2" style="font-size:26px;padding:10px 22px" onpointerdown="WD.k['${k}']=1" onpointerup="WD.k['${k}']=0" onpointerleave="WD.k['${k}']=0" onpointercancel="WD.k['${k}']=0" oncontextmenu="return false">${t}</button>`;
const zoomWd=f=>{if(WD)WD.z=clamp(WD.z*f,.5,3)};

function startWorld(){
  if(WD&&WD.rid==room.id) return;
  stopWorld();
  $('wd').innerHTML=`<canvas id="cv" width="${CW}" height="${CH}" style="width:100%;image-rendering:pixelated;border:3px solid #3b2a1a;border-radius:10px;touch-action:none"></canvas>
  <div style="display:flex;gap:8px;justify-content:center;align-items:center;margin:10px 0;user-select:none;touch-action:none">${dp('l','⬅️')}${dp('r','➡️')}<button class="b2" style="font-size:18px" onclick="zoomWd(1.25)">🔍＋</button><button class="b2" style="font-size:18px" onclick="zoomWd(.8)">🔍－</button></div>`;
  WD={rid:room.id,x:13.5,f:1,ph:0,z:1,k:{},o:{},t:0,s:0,raf:0};
  const c=$('cv'), dist=e=>Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
  let pd=0;
  c.addEventListener('wheel',e=>{e.preventDefault();zoomWd(e.deltaY<0?1.15:1/1.15)},{passive:false});
  c.addEventListener('touchstart',e=>{if(e.touches.length==2)pd=dist(e)},{passive:true});
  c.addEventListener('touchmove',e=>{if(e.touches.length==2){e.preventDefault();const d=dist(e);if(pd)zoomWd(d/pd);pd=d}},{passive:false});
  WD.ch=sb.channel('w:'+room.id,{config:{broadcast:{self:false}}})
    .on('broadcast',{event:'p'},({payload:p})=>{
      if(!WD||p.id==me.id) return;
      const o=WD.o[p.id]||(WD.o[p.id]={x:p.x});
      o.tx=p.x; o.f=p.f||1; o.seen=Date.now();
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
function nearIds(){if(!WD)return[];return Object.keys(WD.o).filter(id=>Math.abs(WD.o[id].x-WD.x)<3)}

function loop(t){
  if(!WD) return;
  const dt=Math.min(.05,(t-WD.t)/1000||0); WD.t=t;
  const dx=(WD.k.r?1:0)-(WD.k.l?1:0);
  WD.mv=!!dx;
  if(dx){WD.x=clamp(WD.x+dx*4*dt,.5,WW-.5); WD.f=dx; WD.ph+=dt*10}
  let z=null;
  for(const k in ZN){const a=ZN[k]; if(WD.x>a.x&&WD.x<a.x+a.w) z=k}
  if(z!==Z){Z=z; drawGame()}
  const nb=nearIds().join(); if(nb!==WD.nb){WD.nb=nb; drawGame()}
  if(t-WD.s>(dx?100:1000)){
    WD.s=t;
    WD.ch.send({type:'broadcast',event:'p',payload:{id:me.id,x:+WD.x.toFixed(2),y:GY,f:WD.f}});
  }
  draw();
  WD.raf=requestAnimationFrame(loop);
}
function who(id){const r=G.p&&G.p.find(x=>x.player_id==id);return r?r.players:{name:'?',skin:null}}
function sprite(g,cx,fy,u,id,mine,f,mv,ph){
  const p=who(id), sk=SKINS.includes(p.skin)?p.skin:SKINS[0], sw=mv?Math.sin(ph)*2*u:0, ex=f>0?1:-1;
  g.fillStyle='#0003'; g.fillRect(cx-8*u,fy-1.5*u,16*u,3*u);
  g.fillStyle='#3b2a1a'; g.fillRect(cx-5*u+sw,fy-8*u,4*u,8*u); g.fillRect(cx+1*u-sw,fy-8*u,4*u,8*u);
  g.fillStyle='#fff'; g.fillRect(cx-7*u,fy-20*u,14*u,12*u);
  g.fillStyle=sk; g.fillRect(cx-6*u,fy-31*u,12*u,11*u);
  g.fillStyle='#222'; g.fillRect(cx-3*u+ex*u,fy-27*u,2*u,2*u); g.fillRect(cx+1*u+ex*u,fy-27*u,2*u,2*u);
  g.fillStyle='#fff'; g.fillRect(cx-7*u,fy-37*u,14*u,6*u);
  g.font='bold 11px monospace'; g.textAlign='center'; g.fillStyle=mine?'#ea580c':'#3b2a1a';
  g.fillText(p.name,cx,fy-41*u); g.textAlign='left';
}
function draw(){
  const c=$('cv'); if(!c||!WD) return;
  const g=c.getContext('2d'), sc=TS*WD.z, u=sc/32;
  let ox=CW/2-WD.x*sc; ox=WW*sc>CW?clamp(ox,CW-WW*sc,0):(CW-WW*sc)/2;
  const fy=GY*sc+(CH*.72-GY*sc);
  g.fillStyle='#bfe3f5'; g.fillRect(0,0,CW,CH);
  g.fillStyle='#fff';
  for(let i=0;i<6;i++){const px=((i*260+ox*.3)%900+900)%900-130,py=30+(i%3)*30;g.fillRect(px,py,70,16);g.fillRect(px+14,py-10,40,12)}
  for(let i=Math.floor(-ox/sc);i<Math.ceil((CW-ox)/sc);i++){g.fillStyle=i%2?'#7a4f26':'#8b5a2b';g.fillRect(i*sc+ox,fy+sc*.25,sc+1,CH)}
  g.fillStyle='#6abe45'; g.fillRect(0,fy,CW,sc*.25);
  for(const k in ZN){
    const a=ZN[k], bx=a.x*sc+ox, bw=a.w*sc, bh=(k=='restoran'?6:4.5)*sc, by=fy-bh;
    g.fillStyle=a.c; g.fillRect(bx,by,bw,bh);
    g.strokeStyle=Z==k?'#ea580c':'#3b2a1a'; g.lineWidth=Math.max(2,sc/12); g.strokeRect(bx,by,bw,bh);
    g.fillStyle=a.r; g.fillRect(bx-sc*.3,by-sc*.6,bw+sc*.6,sc*.6);
    g.fillStyle='#a8733a'; g.fillRect(bx,fy-sc*.7,bw,sc*.7);
    g.font=`bold ${Math.max(9,sc*.4)}px monospace`; g.fillStyle='#3b2a1a'; g.fillText(a.n,bx+sc*.3,by+sc*.95);
    g.font=`${sc*.9}px serif`; a.s.forEach((e,i)=>g.fillText(e,bx+sc*.6+i*(bw-sc*1.6)/Math.max(1,a.s.length-1),fy-sc*.85));
  }
  const now=Date.now();
  for(const id in WD.o){
    const o=WD.o[id];
    if(now-o.seen>4000){delete WD.o[id];continue}
    const mv=Math.abs(o.tx-o.x)>.03; o.x+=(o.tx-o.x)*.3;
    sprite(g,o.x*sc+ox,fy,u,id,false,o.f,mv,WD.t/100);
  }
  sprite(g,WD.x*sc+ox,fy,u,me.id,true,WD.f,WD.mv,WD.ph);
}
