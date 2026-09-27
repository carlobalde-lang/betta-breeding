'use strict';
window.BettaCareer=(()=>{
 const starters=['royal','red','black','turquoise'];
 const colors=()=>BettaTypes.colors;
 const byId=id=>colors().find(c=>c.id===id);
 const clone=x=>JSON.parse(JSON.stringify(x));
 const signature=fish=>{
  const p=BettaAppearance.params(fish);
  // Visible phenotype: recessive carriers and hidden blue alleles are not separate coats.
  const keys=['alien','white','orange','purple','gold','speckle','samurai','rim','bicolor','green','dragon','yellow','marble','butterfly','black','red','copper'];
  const values=keys.map(k=>p[k]>0?1:0);
  const blueMasked=Math.max(p.red,p.black,p.white,p.orange,p.gold,p.copper)>=.9;
  values.push(blueMasked?'hidden':p.blue,p.iridescence>=.7?1:0);
  return values.join(':');
 };
 let reference;
 function matches(fish){
  if(!BettaSpecies.ornamental(fish))return [];
  if(!reference)reference=colors().map(c=>({id:c.id,key:signature(BettaTypes.specimen('halfmoon',c.id,'M'))}));
  const key=signature(fish);return reference.filter(c=>c.key===key).map(c=>c.id);
 }
 function rarity(fish){return 1+['M','F','C','O','T','N','P','J','Q','U','Z','X','G','V'].filter(k=>fish.genes[k]?.includes(k)).length;}
 function demand(month){return colors()[(month*7)%colors().length].id;}
 function value(fish,month=1){return Math.round((38+rarity(fish)*17+Math.min(fish.gen,6)*5+(fish.form.E==='ee'?15:0))*(matches(fish).includes(demand(month))?1.25:1));}
 function chance(price,max){return price>max?.1:price<=max*.7?.9:.9-(price/max-.7)/.3*.5;}
 function offers(state){
  return [...starters,...[0,1,2].map(i=>colors()[(state.month*3+i)%colors().length].id)].map((id,i)=>({id:'stock-'+state.month+'-'+i,colorId:id,price:i<4?65:160+Object.keys(byId(id).genes).length*25}));
 }
 function makeOrders(month,discoveries){
  const pool=Object.keys(discoveries);return Array.from({length:3},(_,i)=>{
   const colorId=pool[(month+i)%pool.length]||'royal';
   return {id:'order-'+month+'-'+i,colorId,reward:150+i*35,deadline:month+6,status:'available'};
  });
 }
 function initial(){const discoveries=Object.fromEntries(starters.map(id=>[id,{month:1,fishId:null,parents:null,starter:true}]));return {version:1,cash:600,reputation:0,capacity:40,shopSlots:4,expansions:0,discoveries,listings:[],visits:[],archive:[],orders:makeOrders(1,discoveries),nextCustomer:1};}
 function normalize(source,fish,month){
  if(!source||source.version!==1)throw Error('Dati carriera mancanti o non supportati.');
  const c=clone(source),integer=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
  for(const [k,min,max] of [['cash',0,1000000000],['reputation',0,1000000],['capacity',40,3000],['shopSlots',4,24],['expansions',0,124],['nextCustomer',1,1000000000]])if(!integer(c[k],min,max))throw Error('Valore carriera non valido: '+k);
  if(!c.discoveries||Array.isArray(c.discoveries)||typeof c.discoveries!=='object')throw Error('Album non valido.');
  for(const [id,d] of Object.entries(c.discoveries))if(!byId(id)||!d||!integer(d.month,1,month)||!(d.fishId===null||integer(d.fishId,1,1000000000))||!(d.parents===null||Array.isArray(d.parents)&&d.parents.length===2&&d.parents.every(p=>integer(p,1,1000000000))))throw Error('Scoperta non valida.');
  if(!starters.every(id=>c.discoveries[id]))throw Error('Album iniziale incompleto.');
  if(!Array.isArray(c.listings)||c.listings.length>c.shopSlots)throw Error('Vetrine non valide.');
  const seen=new Set();for(const l of c.listings){if(!l||seen.has(l.fishId)||!fish.some(f=>f.id===l.fishId&&f.age>=4)||!integer(l.price,1,1000000)||!integer(l.listedMonth,1,month))throw Error('Annuncio non valido.');seen.add(l.fishId);}
  if(!Array.isArray(c.orders)||c.orders.length>12||new Set(c.orders.map(o=>o.id)).size!==c.orders.length)throw Error('Ordini non validi.');
  for(const o of c.orders)if(!o||typeof o.id!=='string'||o.id.length>60||!byId(o.colorId)||!integer(o.reward,1,100000)||!integer(o.deadline,1,month+12)||!['available','accepted','completed','expired'].includes(o.status))throw Error('Ordine non valido.');
  if(!Array.isArray(c.visits)||c.visits.length>24||!Array.isArray(c.archive)||c.archive.length>3000)throw Error('Storico negozio non valido.');
  for(const v of c.visits)if(!v||typeof v.name!=='string'||typeof v.message!=='string'||v.name.length>80||v.message.length>300)throw Error('Visita non valida.');
  for(const a of c.archive)if(!a||!integer(a.id,1,1000000000)||typeof a.name!=='string'||a.name.length>120||!integer(a.month,1,month))throw Error('Archivio non valido.');
  return c;
 }
 function discover(state,batch){
  for(const fish of batch)for(const id of matches(fish))if(!state.career.discoveries[id]){
   state.career.discoveries[id]={month:state.month,fishId:fish.id,parents:fish.parents};state.career.cash+=100;state.career.reputation+=2;
   state.log.unshift('Nuova livrea: '+byId(id).name+' · +100 monete.');
  }
  state.log=state.log.slice(0,5);
 }
 function removable(state,fish){return fish&&state.fish.length>2&&state.fish.some(f=>f.id!==fish.id&&f.sex===fish.sex&&f.age>=2&&!state.career.listings.some(l=>l.fishId===f.id));}
 function remove(state,fish,reason){
  state.career.archive.push({id:fish.id,name:fish.name,month:state.month,parents:fish.parents,reason});state.career.archive=state.career.archive.slice(-3000);
  state.fish=state.fish.filter(f=>f.id!==fish.id);state.career.listings=state.career.listings.filter(l=>l.fishId!==fish.id);
  if(state.selected===fish.id)state.selected=state.fish[0].id;
  if(state.mother===fish.id)state.mother=null;if(state.father===fish.id)state.father=null;
 }
 function transact(state,action,data={}){
  if(state.mode!=='career')throw Error('Questa azione è disponibile in carriera.');
  const c=state.career,fish=state.fish.find(f=>f.id===Number(data.fishId));
  function spend(n){if(c.cash<n)throw Error('Monete insufficienti.');c.cash-=n;}
  if(action==='list'){
   if(!fish||fish.age<4)throw Error('Puoi vendere esemplari adulti da 4 mesi.');
   if(!removable(state,fish))throw Error('Conserva almeno un riproduttore per sesso fuori dal negozio.');
   if(state.fish.some(f=>f.age===0&&f.parents?.includes(fish.id)))throw Error('Attendi il prossimo mese: questo genitore ha appena avuto una nidiata.');
   if(!Number.isSafeInteger(data.price)||data.price<1||data.price>1000000)throw Error('Inserisci un prezzo intero fra 1 e 1.000.000.');
   const listing=c.listings.find(l=>l.fishId===fish.id);
   if(!listing&&c.listings.length>=c.shopSlots)throw Error('Vetrine piene: ritira un pesce o amplia il negozio.');
   if(listing)listing.price=data.price;else c.listings.push({fishId:fish.id,price:data.price,listedMonth:state.month});
   if(state.mother===fish.id)state.mother=null;if(state.father===fish.id)state.father=null;
  }else if(action==='withdraw'){c.listings=c.listings.filter(l=>l.fishId!==Number(data.fishId));
  }else if(action==='buy'){
   const offer=offers(state).find(o=>o.id===data.offerId);if(!offer||!['F','M'].includes(data.sex))throw Error('Offerta non valida.');
   if(state.fish.length>=c.capacity)throw Error('Allevamento pieno: amplia o vendi alcuni pesci.');spend(offer.price);
   const f=BettaTypes.normalize(BettaTypes.specimen('halfmoon',offer.colorId,data.sex));f.id=state.nextFishId++;state.fish.unshift(f);state.selected=f.id;
   state.log.unshift('Acquistato '+f.name+' · '+offer.price+' monete.');
  }else if(action==='accept'){
   const o=c.orders.find(o=>o.id===data.orderId&&o.status==='available'&&o.deadline>=state.month);if(!o)throw Error('Ordine non disponibile.');
   if(c.orders.filter(o=>o.status==='accepted').length>=2)throw Error('Puoi accettare due ordini alla volta.');o.status='accepted';
  }else if(action==='deliver'){
   const o=c.orders.find(o=>o.id===data.orderId&&o.status==='accepted'&&o.deadline>=state.month);
   if(!o||!fish||fish.age<4||fish.gen<1||!matches(fish).includes(o.colorId)||!removable(state,fish))throw Error('Serve un adulto nato qui con la livrea richiesta, conservando i riproduttori.');
   if(c.listings.some(l=>l.fishId===fish.id)||state.fish.some(f=>f.age===0&&f.parents?.includes(fish.id)))throw Error('Ritira il pesce dalla vendita e attendi eventuale riposo mensile.');
   remove(state,fish,'ordine');o.status='completed';c.cash+=o.reward;c.reputation+=3;state.log.unshift('Ordine consegnato · +'+o.reward+' monete.');
  }else if(action==='expand'){
   if(c.capacity>=3000)throw Error('Capienza massima raggiunta.');spend(250+c.expansions*150);c.expansions++;c.capacity=Math.min(3000,c.capacity+24);
  }else if(action==='shopExpand'){
   if(c.shopSlots>=24)throw Error('Negozio già completo.');spend(c.shopSlots*60);c.shopSlots+=4;
  }else throw Error('Azione sconosciuta.');
  state.log=state.log.slice(0,5);return state;
 }
 function advance(state,rng=Math.random){
  const c=state.career;for(const o of c.orders)if(o.deadline<state.month&&['available','accepted'].includes(o.status))o.status='expired';
  if(state.month%3===1){c.orders=[...c.orders.filter(o=>o.status==='accepted'),...makeOrders(state.month,c.discoveries)];}
  const visits=[];const names=['Ada','Luca','Nora','Milo','Emma','Leo','Sofia','Elia'];
  for(let i=0;i<Math.min(8,3+Math.floor(c.reputation/10));i++){
   const number=c.nextCustomer++,wanted=i===0?'any':Object.keys(c.discoveries)[Math.floor(rng()*Object.keys(c.discoveries).length)],budget=80+Math.floor(rng()*360)+c.reputation*3;
   const candidates=c.listings.map(l=>({l,f:state.fish.find(f=>f.id===l.fishId)})).filter(x=>x.f&&(wanted==='any'||matches(x.f).includes(wanted)));
   const visit={id:number,name:names[number%names.length],month:state.month,wanted,budget,message:'Nessun pesce corrisponde ai miei gusti.',bought:false};
   if(candidates.length){
    const {l,f}=candidates[Math.floor(rng()*candidates.length)],max=value(f,state.month);visit.fishId=f.id;visit.price=l.price;visit.max=max;
    if(l.price>budget)visit.message='Mi piace, ma supera il mio budget.';
    else if(removable(state,f)&&rng()<chance(l.price,max)){c.cash+=l.price;c.reputation++;remove(state,f,'vendita');visit.bought=true;visit.message='Acquistato '+f.name+' per '+l.price+' monete.';state.log.unshift(visit.name+': '+visit.message);}
    else visit.message=l.price>max?'Prezzo alto: questa volta non acquisto.':'Oggi preferisco pensarci.';
   }
   visits.push(visit);
  }
  c.visits=visits;state.log=state.log.slice(0,5);return state;
 }
 return {starters,initial,normalize,matches,signature,value,chance,offers,byId,demand,transact,discover,advance};
})();
