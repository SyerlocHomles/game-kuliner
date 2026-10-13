// Gameplay (dipakai oleh index.html). Memakai: sb, me, room, $, esc, toast, askLeave
let G={},C={},Q={},tAt=0,rt=null,Z=null;
const fm=n=>'Rp'+Number(n).toLocaleString('id-ID');
const pr=(b,k=1)=>Math.round(b*(1+(G.g.mult-1)*k));
const BOX='border:1px solid var(--line);border-radius:12px;padding:10px;margin:8px 0;background:#fff';
async function rp(fn,a){const {error}=await sb.rpc(fn,a);if(error)toast(error.message);drawGame()}
const startGame=()=>rp('start_game',{p_room:room.id});
const qs=(id,n)=>{Q[id]=Math.max(1,(Q[id]||1)+n);drawGame()};
const cook=id=>rp('cook',{p_room:room.id,p_recipe:id,p_qty:Q[id]||1});
const buy=k=>rp('buy_item',{p_room:room.id,p_item:k,p_qty:Math.max(1,+$('bq_'+k).value||1)});
const tool=(k,fix)=>rp('buy_tool',{p_room:room.id,p_tool:k,p_fix:fix});

function renderGame(m){
  if(m) G.mem=new Set(m.map(x=>x.player_id));
  clearTimeout(rt); rt=setTimeout(drawGame,250);
}

async function drawGame(){
  if(!room||!room.status||room.status=='waiting') return;
  if(!C.items){
    const [a,b,c]=await Promise.all([sb.from('items').select('*'),sb.from('recipes').select('*').order('id'),sb.from('tooldefs').select('*')]);
    C.items=Object.fromEntries((a.data||[]).map(x=>[x.id,x]));
    C.rec=Object.fromEntries((b.data||[]).map(x=>[x.id,x]));
    C.tools=Object.fromEntries((c.data||[]).map(x=>[x.id,x]));
  }
  const id=room.id;
  const [g,p,v,m,tr]=await Promise.all([
    sb.from('games').select('*').eq('room_id',id).maybeSingle(),
    sb.from('gp').select('player_id,money,busy_until,players(name,skin)').eq('room_id',id),
    sb.from('inv').select('item,qty').eq('room_id',id).eq('player_id',me.id),
    sb.from('mk').select('item,stock').eq('room_id',id),
    sb.from('trades').select('*').eq('room_id',id).eq('status','open')
  ]);
  if(!g.data||!p.data) return;
  G.g=g.data; G.p=p.data; G.tr=tr.data||[];
  G.inv=Object.fromEntries((v.data||[]).map(x=>[x.item,x.qty]));
  G.mk=Object.fromEntries((m.data||[]).map(x=>[x.item,x.stock]));
  if(!G.mem) G.mem=new Set(G.p.map(x=>x.player_id));
  const mine=G.p.find(x=>x.player_id==me.id)||{money:0};
  const rank=G.p.filter(x=>G.mem.has(x.player_id)).sort((a,b)=>b.money-a.money);
  const rh=rank.map((x,i)=>`<div class="mem"><b>${i+1}</b><span>${esc(x.players.name)}${x.player_id==me.id?' (kamu)':''}</span><span style="margin-left:auto">${fm(x.money)}</span></div>`).join('');
  const leave='<div class="rw"><button class="b2" onclick="askLeave()">Keluar</button></div>';
  let h;
  if(room.status=='finished'){
    h=`<div class="c"><h2>🏆 ${esc(rank[0]?rank[0].players.name:'-')} menang!</h2><p class="l">Uang terbanyak di akhir game</p></div>${rh}${leave}`;
  } else {
    const g2=G.g;
    h=`<div class="c"><b>HARI ${g2.day}/${room.total_days}</b> · ⏱ <b id="cd"></b><br><small>${esc(g2.ev)} (harga ×${g2.mult})</small>
    <h3 style="margin:6px 0">${fm(mine.money)}</h3><small id="bz"></small></div>
    ${Z=='restoran'?'<p class="l">MENU HARI INI</p>'+g2.menu.map(card).join(''):''}
    ${ZT[Z]&&Z!='alat'?'<p class="l">'+ZT[Z]+' (stok dibagi semua pemain)</p>'+Object.values(C.items).filter(i=>i.cat==Z).map(itemRow).join(''):''}${Z=='alat'?'<p class="l">TOKO ALAT</p>'+Object.values(C.tools).map(toolRow).join(''):''}${Z?'':'<p class="l c">Jalan ke 🍳 Restoran atau pasar (sayur, daging, bumbu, alat)</p>'}
    ${tradePanel()}<p class="l">PERINGKAT</p>${rh}${leave}`;
  }
  if(!$('gp'))$('roomv').innerHTML='<div id="wd"></div><div id="gp"></div>'; $('gp').innerHTML=h; room.status=='playing'?startWorld():stopWorld();
  tickUI();
}

function card(id){
  const r=C.rec[id], q=Q[id]||1, tk='T:'+r.tool, dur=G.inv[tk]||0;
  const lack=Object.entries(r.ing).filter(([k,v])=>(G.inv[k]||0)<v*q).map(([k,v])=>`Kurang ${v*q-(G.inv[k]||0)} ${C.items[k].name}`);
  if(dur<2*q) lack.push(`Alat ${C.tools[r.tool].name} kurang (${dur}%)`);
  const need=Object.entries(r.ing).map(([k,v])=>`<span style="color:${(G.inv[k]||0)>=v*q?'#16a34a':'#dc2626'}">${C.items[k].name} ${G.inv[k]||0}/${v*q}</span>`).join(' · ');
  return `<div style="${BOX}"><b>${esc(r.name)}</b> <span class="tag">${r.cat}</span> <span style="float:right">${fm(r.price)}/porsi</span>
  <div style="font-size:13px;margin:6px 0">${need}</div>
  <div class="step"><span><button class="b2" onclick="qs(${id},-1)">−</button> <b>${q}</b> <button class="b2" onclick="qs(${id},1)">+</button></span>
  <button class="b1" ${lack.length?'disabled style="opacity:.5"':''} onclick="cook(${id})">MEMASAK</button></div>
  ${lack.length?`<small style="color:#dc2626">(${lack.join(', ')})</small>`:''}</div>`;
}
function itemRow(i){
  return `<div class="step" style="font-size:14px"><span><b>${i.name}</b><br><small>${fm(pr(i.price))} · stok ${G.mk[i.id]||0} · punya ${G.inv[i.id]||0}</small></span>
  <span><input id="bq_${i.id}" type="number" min="1" value="1" style="width:60px;padding:8px"> <button class="b1" onclick="buy('${i.id}')">Beli</button></span></div>`;
}
function toolRow(t){
  const d=G.inv['T:'+t.id], c=pr(t.price,0.3);
  return `<div class="step" style="font-size:14px"><span><b>${t.name}</b><br><small>${d===undefined?'belum punya':'kondisi '+d+'%'} · baru ${fm(c)}</small></span>
  <span>${d!==undefined&&d<=50?`<button class="b2" onclick="tool('${t.id}',true)">Perbaiki ${fm(Math.round(c*0.4))}</button> `:''}<button class="b1" onclick="tool('${t.id}',false)">Beli</button></span></div>`;
}

function tickUI(){
  if(!room||!G.g||room.status!='playing') return;
  const s=Math.max(0,Math.ceil((new Date(G.g.day_ends)-Date.now())/1000));
  const c=$('cd'); if(c) c.textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
  const b=G.p&&G.p.find(x=>x.player_id==me.id);
  const z=b&&b.busy_until?Math.ceil((new Date(b.busy_until)-Date.now())/1000):0;
  const e=$('bz'); if(e) e.textContent=z>0?'👩‍🍳 Memasak… '+z+' dtk':'';
  if(s<=0&&Date.now()-tAt>2500){tAt=Date.now();sb.rpc('tick',{p_room:room.id}).then(drawGame)}
}
setInterval(tickUI,1000);

// ===== PASAR TERPISAH + TRADE =====
const ZT={sayur:'PASAR SAYUR',daging:'PASAR DAGING & IKAN',bumbu:'PASAR BUMBU',alat:'TOKO ALAT'};
const nm=id=>(G.p.find(x=>x.player_id==id)||{players:{name:'?'}}).players.name;
const side=(o,m)=>[...Object.entries(o).map(([k,v])=>v+' '+(C.items[k]?C.items[k].name:k)),m?fm(m):''].filter(Boolean).join(' + ')||'-';
function tradePanel(){
  const near=typeof nearIds=='function'?nearIds():[];
  let h='<p class="l">🤝 TRADE</p>';
  (G.tr||[]).forEach(t=>{
    h+=t.to_id==me.id
      ?`<div style="${BOX}"><b>${esc(nm(t.from_id))}</b> menawarkan:<br>Memberi: ${esc(side(t.give,t.give_money))}<br>Meminta: ${esc(side(t.want,t.want_money))}<div class="rw"><button class="b2" onclick="ans('${t.id}',false)">Tolak</button><button class="b1" onclick="ans('${t.id}',true)">Terima</button></div></div>`
      :`<div style="${BOX}">Menunggu ${esc(nm(t.to_id))}…<br><small>Beri ${esc(side(t.give,t.give_money))} · minta ${esc(side(t.want,t.want_money))}</small><div class="rw"><button class="b2" onclick="cancelT('${t.id}')">Batal</button></div></div>`;
  });
  h+=near.length?near.map(id=>`<div class="step"><span>👤 ${esc(nm(id))}</span><button class="b1" onclick="openTrade('${id}')">Trade</button></div>`).join(''):'<small class="l">Dekati pemain lain untuk trade.</small>';
  return h;
}
function openTrade(id){
  const opt=Object.values(C.items).map(i=>`<option value="${i.id}">${i.name}</option>`).join('');
  const row=p=>`<div class="rw"><input id="${p}m" type="number" min="0" value="0" style="width:90px"><select id="${p}i" style="padding:10px;border-radius:12px"><option value="">(tanpa bahan)</option>${opt}</select><input id="${p}q" type="number" min="1" value="1" style="width:60px"></div>`;
  modal(`<h3>Trade dengan ${esc(nm(id))}</h3><p class="l">Kamu BERI (uang / bahan / jumlah)</p>${row('g')}<p class="l">Kamu MINTA (uang / bahan / jumlah)</p>${row('w')}<small>Uang dengan bahan = jual/beli. Bahan dengan bahan = barter.</small><div class="rw" style="margin-top:14px"><button class="b2" onclick="closeM()">Batal</button><button class="b1" onclick="sendTrade('${id}')">Kirim</button></div>`);
}
async function sendTrade(id){
  const rd=p=>{const k=$(p+'i').value,q=Math.max(1,+$(p+'q').value||1);return [k?{[k]:q}:{},Math.max(0,+$(p+'m').value||0)]};
  const [g,gm]=rd('g'),[w,wm]=rd('w');
  const {error}=await sb.rpc('offer_trade',{p_room:room.id,p_to:id,p_give:g,p_gm:gm,p_want:w,p_wm:wm});
  if(error) return toast(error.message);
  closeM(); toast('Penawaran terkirim'); drawGame();
}
const ans=(id,ok)=>rp('answer_trade',{p_id:id,p_accept:ok});
const cancelT=id=>rp('cancel_trade',{p_id:id});
