'use strict';
(()=>{
 const node=(tag,text,className)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;};
 const dialog=node('dialog',undefined,'career-dialog');dialog.id='career-panel';
 dialog.setAttribute('aria-labelledby','career-title');
 const head=node('header'),heading=node('h2','Il tuo allevamento'),close=node('button','Chiudi','secondary');close.onclick=()=>dialog.close();heading.id='career-title';head.append(heading,close);dialog.append(head);
 const notice=node('p','','career-notice');notice.setAttribute('role','status');dialog.append(notice);
 const stats=node('div',undefined,'career-stats'),tabs=node('nav',undefined,'career-tabs'),content=node('div',undefined,'career-content');dialog.append(stats,tabs,content);
 const footer=node('footer'),switchMode=node('button','Cambia modalità / pesci','secondary');switchMode.onclick=()=>{try{sessionStorage.removeItem('fishchromia-mode');sessionStorage.removeItem('fishchromia-collection');}catch{}location.reload();};footer.append(node('p','Carriera e creativa hanno salvataggi separati. Il cambio di modalità conserva i progressi.'),switchMode);dialog.append(footer);document.body.append(dialog);
 const buttons=[];for(const container of [document.querySelector('.room-header'),document.querySelector('.top-right')]){const b=node('button','','room-button career-open');b.onclick=()=>open();container.append(b);buttons.push(b);}
 let tab='shop',goal=null,guideMemo=null,guidePair=null,marketRoute=null;
 const flowKey='fishchromia-flow-'+(window.FishCollection?.discus?'discus':'betta');
 try{const saved=JSON.parse(localStorage.getItem(flowKey)||'null');if(saved&&BettaCareer.byId(saved.goal)){goal=saved.goal;const r=saved.route;if(r&&r.goal===goal&&BettaCareer.byId(r.pair?.mother?.colorId)&&BettaCareer.byId(r.pair?.father?.colorId))marketRoute=r;}}catch{}
 function saveFlow(){try{localStorage.setItem(flowKey,JSON.stringify({goal,route:marketRoute}));}catch{}}
 const roomGoal=node('div',undefined,'room-goal');roomGoal.id='room-breeding-goal';roomGoal.hidden=true;document.querySelector('.room-bottom').before(roomGoal);
 const catalogQueries={market:'',album:''};let albumStatus='all';
 const tabScroll=new Map();dialog.addEventListener('close',()=>tabScroll.set(tab,dialog.scrollTop));
 function changeTab(next){tabScroll.set(tab,dialog.scrollTop);tab=next;draw();dialog.scrollTop=tabScroll.get(next)||0;}
 function routeParents(s){if(!marketRoute||marketRoute.goal!==goal)return [];return ['F','M'].map((sex,i)=>{const offer=i?marketRoute.pair.father:marketRoute.pair.mother,genes=BettaTypes.specimen('halfmoon',offer.colorId,sex).genes;return s.fish.find(f=>f.sex===sex&&BettaTypes.colorLoci.every(k=>f.genes[k]===genes[k])&&!s.career.listings.some(l=>l.fishId===f.id));});}
 function selectPair(mother,father){
  const status=BettaStore.pairingStatus(appStore.getState(),mother,father);if(!status.allowed){notice.textContent=status.reason;return;}
  guidePair={mother:mother.id,father:father.id};dialog.close();setRosterFilter('parents');document.getElementById('room-lab').click();appStore.choosePair(mother.id,father.id);document.querySelector('.breeding').scrollIntoView({block:'start',behavior:'smooth'});
 }
 function nextStep(s){
  if(s.career.discoveries[goal])return {text:'Livrea scoperta! Scegli il prossimo obiettivo nell’album.',label:'Scegli una nuova livrea',run:()=>window.bettaCareerUI.open('album')};
  const direct=guidePlan(s).pairs.find(p=>p.ready);if(direct&&(!marketRoute||routeParents(s).every(Boolean)&&s.fish.some(f=>f.parents?.includes(routeParents(s)[0].id)&&f.parents?.includes(routeParents(s)[1].id))))return {text:'La coppia è pronta. Sceglila e genera una nidiata.',label:'Vai alla coppia',run:()=>selectPair(s.fish.find(f=>f.id===direct.mother),s.fish.find(f=>f.id===direct.father))};
  const [mother,father]=routeParents(s);
  if(mother&&father){const children=s.fish.filter(f=>f.parents?.includes(mother.id)&&f.parents?.includes(father.id)),useful=children.filter(f=>BettaTypes.colorLoci.every(k=>f.genes[k]===marketRoute.pair.intermediateGenes[k]));
   if(children.length&&!useful.length&&BettaStore.pairingStatus(s,mother,father).allowed)return {text:'Questa nidiata non contiene il profilo cercato. Puoi ripetere il primo incrocio.',label:'Ripeti il primo incrocio',run:()=>selectPair(mother,father)};
   if(children.length)return {text:useful.length?'I discendenti utili sono evidenziati nella vasca. Maturità a 2 mesi.':'Fai crescere la nidiata e attendi il prossimo mese per ripetere l’incrocio.',label:'Vedi i discendenti',run:()=>{dialog.close();document.getElementById('room-lab').click();window.bettaApp.showBrood(children.map(f=>f.id),'Discendenti per '+BettaCareer.byId(goal).name);document.getElementById('collection-panel').scrollIntoView({block:'start'});}};
   const status=BettaStore.pairingStatus(s,mother,father);if(status.allowed)return {text:'I riproduttori sono acquistati. Il primo incrocio prepara la generazione successiva.',label:'Vai alla coppia',run:()=>selectPair(mother,father)};
   return {text:status.reason,label:'Vedi guida',run:()=>window.bettaCareerUI.open('album')};
  }
  const waiting=guidePlan(s).pairs[0];if(waiting&&!waiting.ready)return {text:waiting.reason,label:'Vedi guida',run:()=>window.bettaCareerUI.open('album')};
  return {text:marketRoute?'Completa la coppia consigliata nel mercato.':'Introduci i riproduttori mancanti dal mercato.',label:'Continua nel mercato',run:()=>window.bettaCareerUI.open('market')};
 }
 const goalBanner=node('div',undefined,'breeding-goal');goalBanner.id='breeding-goal';goalBanner.hidden=true;document.querySelector('.breeding').prepend(goalBanner);
 function guidePlan(s){
  const key=JSON.stringify([goal,s.month,s.fish.map(f=>[f.id,f.sex,f.age,f.genes,f.ancestry,f.parents]),s.career.listings,s.career.capacity]);
  if(guideMemo?.key!==key)guideMemo={key,value:BettaBreedingGuide.plan(s,goal)};return guideMemo.value;
 }
 function chooseGoal(id){goal=id;guideMemo=null;guidePair=null;marketRoute=null;saveFlow();changeTab('album');dialog.scrollTop=0;}
 function refreshGuide(s){
  goalBanner.hidden=!goal||s.mode!=='career';roomGoal.hidden=goalBanner.hidden;const plan=!goalBanner.hidden?guidePlan(s):null,routePair=routeParents(s),pair=guidePair&&s.fish.some(f=>f.id===guidePair.mother)&&s.fish.some(f=>f.id===guidePair.father)?guidePair:routePair.length===2&&routePair.every(Boolean)?{mother:routePair[0].id,father:routePair[1].id}:plan?.pairs[0];
  for(const card of document.querySelectorAll('#roster .fish-card')){const selected=!!pair&&[pair.mother,pair.father].includes(Number(card.dataset.fishId));card.classList.toggle('guide-parent',selected);let badge=card.querySelector('.guide-parent-badge');if(selected&&!badge){badge=node('small','Consigliato per '+BettaCareer.byId(goal).name,'guide-parent-badge');card.append(badge);}if(badge){badge.hidden=!selected;if(selected)badge.textContent='Consigliato per '+BettaCareer.byId(goal).name;}}
  const route=routeParents(s);
  for(const card of document.querySelectorAll('#roster .fish-card')){
   const fish=s.fish.find(f=>f.id===Number(card.dataset.fishId)),useful=!!(goal&&route[0]&&route[1]&&fish?.parents?.includes(route[0].id)&&fish.parents.includes(route[1].id)&&BettaTypes.colorLoci.every(k=>fish.genes[k]===marketRoute.pair.intermediateGenes[k]));
   card.classList.toggle('guide-offspring',useful);let badge=card.querySelector('.guide-offspring-badge');if(useful&&!badge){badge=node('small','Da conservare per il prossimo incrocio','guide-offspring-badge');card.append(badge);}if(badge)badge.hidden=!useful;
  }
  if(!plan)return;
  const step=nextStep(s);
  for(const banner of [goalBanner,roomGoal]){
   const copy=node('div',undefined,'goal-copy');copy.append(node('small','OBIETTIVO DI ALLEVAMENTO'),node('strong',BettaCareer.byId(goal).name),node('span',step.text));
   banner.replaceChildren(copy,button(step.label,step.run));
  }
  goalBanner.append(button('Vedi guida',()=>window.bettaCareerUI.open('album')),button('Rimuovi obiettivo',()=>{goal=null;guideMemo=null;marketRoute=null;saveFlow();render();}));
 }
 function renderGuide(s){
  if(!goal)return;const plan=guidePlan(s),panel=node('section',undefined,'breeding-guide');panel.id='breeding-guide';panel.append(node('h3','Come ottenere '+BettaCareer.byId(goal).name),node('p','Probabilità calcolate sui geni e sulle regole dell’album del gioco. Ogni nascita è indipendente: un incrocio favorevole non garantisce lo sblocco.'));
  const percent=p=>p>0&&p<.001?'<0,1%':(p*100).toLocaleString('it-IT',{maximumFractionDigits:1})+'%';
  for(const [i,pair] of plan.pairs.entries()){
   const mother=s.fish.find(f=>f.id===pair.mother),father=s.fish.find(f=>f.id===pair.father),row=node(i?'details':'article',undefined,'guide-pair');if(i){row.dataset.detail='alternative-'+i;row.append(node('summary','Coppia alternativa '+i));}
   row.append(node('strong',(i===0?'Coppia consigliata: ':'Alternativa: ')+'#'+mother.id+' '+mother.name+' × #'+father.id+' '+father.name),node('p',percent(pair.probability)+' per piccolo · '+percent(pair.brood)+' di almeno uno in una nidiata di quattro.'));
   if(!pair.ready)row.append(node('p',pair.reason));
   const select=button('Evidenzia e scegli questa coppia',()=>{if(!BettaStore.pairingStatus(appStore.getState(),mother,father).allowed){render();return;}selectPair(mother,father);});select.disabled=!pair.ready;row.append(select);panel.append(row);
  }
  if(!plan.pairs.length){
   panel.append(node('p','Non ho trovato un incrocio diretto per questa livrea tra i profili confrontati.'));
   if(plan.missing.length)panel.append(node('p','Tratti mancanti: '+plan.missing.map(k=>(labels[k]||k).replace(' (sim.)','')).join(', ')+'. Introducili acquistando riproduttori; sbloccare un nome nell’album da solo non cambia i geni.'));
   for(const donor of plan.donors){const available=BettaCareer.offers(s).some(o=>o.colorId===donor.id);panel.append(node('p','Cerca '+BettaCareer.byId(donor.id).name+' per introdurre '+donor.supplies.map(k=>(labels[k]||k).replace(' (sim.)','')).join(', ')+(available?' · disponibile ora nel mercato.':' · controlla i riproduttori già posseduti.')));}
   if(!plan.missing.length)panel.append(node('p','I caratteri sono presenti ma non ancora combinabili in una sola nidiata. Può servire una nuova generazione o un riproduttore della linea cercata.'));
   if(plan.steps.length){panel.append(node('h3','Nel frattempo puoi sbloccare'),node('p','Livree vicine al tuo obiettivo e ottenibili adesso. Sono suggerimenti di progressione, non prerequisiti obbligatori.'));for(const step of plan.steps)panel.append(button(BettaCareer.byId(step.id).name+' · '+percent(step.pair.probability)+' per piccolo',()=>chooseGoal(step.id)));}
   panel.append(button('Cerca riproduttori nel mercato',()=>changeTab('market')));
  }
  if(plan.limited)panel.append(node('p','Allevamento ampio: confronto i 128 profili genetici più vicini per sesso.'));
  content.append(panel);
 }

 const titles={shop:'Negozio',album:'Album',market:'Riproduttori',orders:'Ordini',house:'Casa'};
 for(const [id,title] of Object.entries(titles)){const b=node('button',title);b.dataset.tab=id;b.onclick=()=>changeTab(id);tabs.append(b);}
 function action(type,data){
  const scroll=dialog.scrollTop,focus=document.activeElement,focusId=focus?.dataset.focusKey;
  try{appStore.career(type,data);if(type==='list'){priceDrafts.delete(data.fishId);saleDrafts.delete(data.fishId);}notice.textContent=({buy:'Riproduttore acquistato. La coppia consigliata resta qui.',list:'Vetrina aggiornata.',withdraw:'Pesce riportato in allevamento.',deliver:'Ordine consegnato.',accept:'Ordine accettato.'})[type]||'Operazione completata.';notice.dataset.kind='success';}catch(e){notice.textContent=e.message;notice.dataset.kind='error';}
  dialog.scrollTop=scroll;if(focusId){const target=[...content.querySelectorAll('[data-focus-key]')].find(el=>el.dataset.focusKey===focusId);target?.focus({preventScroll:true});}
 }
 function open(which){if(which)tab=which;render();notice.textContent='';delete notice.dataset.kind;if(!dialog.open)dialog.showModal();}
 window.bettaCareerUI={open};
 function button(text,fn){const b=node('button',text,'secondary');b.onclick=fn;return b;}
 function fishCard(f,owned=false){const card=node('article',undefined,'career-card');const img=node('img');img.width=256;img.height=160;drawPreview(img,f);if(owned){const preview=button('Osserva',()=>{dialog.close();window.bettaApp.observeFish(f.id);});preview.className='fish-preview-control';preview.setAttribute('aria-label','Osserva '+BettaCareer.displayName(f)+' #'+f.id);preview.replaceChildren(img);card.append(preview);}else card.append(img);card.append(node('h3',BettaCareer.displayName(f)+' · #'+f.id),node('p',(f.sex==='F'?'Femmina':'Maschio')+' · '+f.age+' mesi · '+BettaTypes.name(f)));return card;}
 function catalogFilter(grid,kind){
  const tools=node('div',undefined,'career-catalog-tools'),label=node('label',kind==='market'?'Cerca riproduttori':'Cerca una livrea'),input=node('input');input.type='search';input.id='career-search-'+kind;label.htmlFor=input.id;input.value=catalogQueries[kind];tools.append(label,input);
  let status;if(kind==='album'){status=node('select');status.setAttribute('aria-label','Stato delle livree');for(const [value,text] of [['all','Tutte le livree'],['new','Da scoprire'],['found','Scoperte']]){const option=node('option',text);option.value=value;status.append(option);}status.value=albumStatus;tools.append(status);}
  const empty=node('p','Nessuna livrea corrisponde alla ricerca.','catalog-empty');
  function filter(){let count=0;for(const card of grid.children){card.hidden=!card.querySelector('h3').textContent.toLocaleLowerCase().includes(catalogQueries[kind].toLocaleLowerCase())||(kind==='album'&&albumStatus!=='all'&&(albumStatus==='found')!==card.classList.contains('discovered'));if(!card.hidden)count++;}empty.hidden=count>0;}
  input.oninput=()=>{catalogQueries[kind]=input.value;filter();};if(status)status.onchange=()=>{albumStatus=status.value;filter();};content.append(tools,grid,empty);filter();
 }
 function renderVisits(c){const visits=document.getElementById('shop-visits');if(!visits)return;
  visits.replaceChildren(node('h3','Ultime visite'));
  if(!c.visits.length)visits.append(node('p','Allestisci le vetrine: i clienti arriveranno mentre giochi.'));
  for(const v of c.visits.slice(0,6)){const row=node('article',undefined,'customer-visit'+(v.bought?' customer-purchase':''));row.append(node('strong',(v.bought?'✓ Acquisto · ':'Visita · ')+v.name),node('p',v.message),node('small','Budget '+v.budget+' ◈'));visits.append(row);}
 }
 const priceDrafts=new Map(),saleDrafts=new Map();let saleSelection=null,shopTank=null;
 let stableContentKey=null;
 function render(){
  const s=appStore.getState(),c=s.career,creative=s.mode!=='career';
  refreshGuide(s);
  for(const b of buttons)b.textContent=creative?'Creativa · modalità':'Carriera · '+c.cash+' ◈';
  if(!dialog.open&&!render.force)return;
  heading.textContent=creative?'Modalità creativa':'La tua carriera';tabs.hidden=creative;stats.hidden=creative;
  if(creative){content.replaceChildren(node('p','Catalogo completo e incroci liberi. Il tuo allevamento originale è conservato qui.'));return;}
  stats.replaceChildren(...[c.cash+' monete',c.reputation+' reputazione',s.fish.length+' / '+c.capacity+' pesci',Object.keys(c.discoveries).length+' / '+BettaTypes.colors.length+' livree'].map(v=>node('span',v)));
  for(const b of tabs.children)b.setAttribute('aria-pressed',String(b.dataset.tab===tab));
  // Customer arrivals update the counters without rebuilding unchanged previews.
  const key=JSON.stringify([tab,goal,guidePair,s.month,s.fish,c.listings,c.discoveries,c.orders,c.capacity,c.shopSlots,c.expansions,shopTank,tab==='market'?c.cash:null]);
  if(key===stableContentKey){if(tab==='shop')renderVisits(c);return;}
  stableContentKey=key;
  const focused=document.activeElement,focusedKey=focused?.dataset.focusKey,focusedId=focused?.id;
  const scroll=dialog.scrollTop,details=[...content.querySelectorAll('details[data-detail]')].filter(el=>el.open).map(el=>el.dataset.detail);
  content.replaceChildren();
  function restoreView(){const control=focusedKey?[...content.querySelectorAll('[data-focus-key]')].find(el=>el.dataset.focusKey===focusedKey):focusedId?document.getElementById(focusedId):null;if(control&&content.contains(control))control.focus({preventScroll:true});dialog.scrollTop=scroll;for(const el of content.querySelectorAll('details[data-detail]'))el.open=details.includes(el.dataset.detail);}
  
  if(tab==='shop'){
   content.append(node('h3','Pesci in vendita · '+c.listings.length+' / '+(c.shopSlots*4)),node('p','I clienti arrivano a intervalli casuali durante il mese mentre giochi. Ogni cliente valuta un pesce compatibile con i suoi gusti e il budget.'));
   const visit=button('Visita la Stanza 3 · negozio',()=>{dialog.close();window.betta3d?.openShop();});content.append(visit);
   const form=node('div',undefined,'career-sale-form'),select=node('select'),price=node('input'),hint=node('p');select.id='sale-fish';select.dataset.focusKey='sale-fish';select.setAttribute('aria-label','Pesce da esporre');price.id='sale-price';price.dataset.focusKey='sale-price';price.type='number';price.min='1';price.max='1000000';price.step='1';price.setAttribute('aria-label','Prezzo in monete');
   for(const f of s.fish.filter(f=>f.age>=4&&!c.listings.some(l=>l.fishId===f.id))) {const option=node('option','#'+f.id+' · '+BettaCareer.displayName(f));option.value=f.id;select.append(option);}
   if([...select.options].some(o=>Number(o.value)===(saleSelection??s.selected)))select.value=saleSelection??s.selected;
   function recommendation(reset){const f=s.fish.find(f=>f.id===Number(select.value));if(!f){hint.textContent='Non ci sono adulti disponibili.';return;}const max=BettaCareer.value(f,s.month);if(reset)price.value=saleDrafts.get(f.id)??max;hint.textContent='Massimo consigliato: '+max+' monete · '+Math.round(BettaCareer.chance(Number(price.value),max)*100)+'% per cliente interessato con budget sufficiente.';}
   select.onchange=()=>{saleSelection=Number(select.value);recommendation(true);};price.oninput=()=>{saleDrafts.set(Number(select.value),price.value);recommendation(false);};recommendation(true);
   const listButton=button('Sposta in vetrina',()=>action('list',{fishId:Number(select.value),price:Number(price.value)}));listButton.disabled=!select.options.length||c.listings.length>=c.shopSlots*4;const fishLabel=node('label','Esponi un adulto'),priceLabel=node('label','Prezzo');fishLabel.htmlFor=select.id;priceLabel.htmlFor=price.id;form.append(fishLabel,select,priceLabel,price,listButton,hint);content.append(form);
   const tankFilter=node('select');tankFilter.id='shop-tank-filter';tankFilter.setAttribute('aria-label','Filtra gli acquari del negozio');const all=node('option','Tutti gli acquari');all.value='all';tankFilter.append(all);for(let i=0;i<c.shopSlots;i++){const option=node('option','Acquario #'+BettaStore.tankNumber('shop-'+i)+' · '+c.listings.filter(l=>l.tank===i).length+'/4');option.value='shop-'+i;tankFilter.append(option);}tankFilter.value=shopTank||'all';tankFilter.onchange=()=>{shopTank=tankFilter.value==='all'?null:tankFilter.value;draw();};content.append(tankFilter);
   const grid=node('div',undefined,'career-grid');for(const l of c.listings.filter(l=>!shopTank||'shop-'+l.tank===shopTank)){const f=s.fish.find(f=>f.id===l.fishId),card=fishCard(f,true),edit=node('input');edit.type='number';edit.min=1;edit.max=1000000;edit.value=priceDrafts.get(f.id)??l.price;edit.oninput=()=>priceDrafts.set(f.id,edit.value);edit.setAttribute('aria-label','Prezzo di '+BettaCareer.displayName(f));const max=BettaCareer.value(f,s.month);card.append(node('span','Acquario #'+BettaStore.tankNumber('shop-'+l.tank)+' · '+c.listings.filter(item=>item.tank===l.tank).length+'/4','discovery-badge'));edit.dataset.focusKey='price-'+f.id;card.append(node('p','Consigliato fino a '+max+' ◈ · probabilità '+Math.round(BettaCareer.chance(l.price,max)*100)+'%'),edit,button('Aggiorna prezzo',()=>action('list',{fishId:f.id,price:Number(edit.value)})),button('Riporta in allevamento',()=>action('withdraw',{fishId:f.id})));grid.append(card);}content.append(grid);
   const visits=node('section',undefined,'shop-visits');visits.id='shop-visits';content.append(visits);renderVisits(c);
  }else if(tab==='album'){
   renderGuide(s);
   const reachable=BettaTypes.colors.filter(color=>!c.discoveries[color.id]).map(color=>({color,pair:BettaBreedingGuide.plan(s,color.id,false).pairs.find(p=>p.ready)})).filter(item=>item.pair);
   content.append(node('h3','Nuove livree ottenibili con i tuoi pesci'));
   if(!reachable.length)content.append(node('p','Non ci sono nuovi sblocchi diretti con le coppie disponibili: fai crescere i piccoli o introduci una linea dal mercato.'));
   for(const {color,pair} of reachable)content.append(button(color.name+' · '+(pair.probability*100).toLocaleString('it-IT',{maximumFractionDigits:1})+'% per piccolo',()=>chooseGoal(color.id)));
   content.append(node('p','Le nuove livree si scoprono quando nascono piccoli con quei caratteri visibili. Ogni scoperta vale 100 monete e 2 punti reputazione. Acquistare un riproduttore non sblocca la sua livrea. Caratteri sovrapposti possono registrare più nomi commerciali.'));
   const grid=node('div',undefined,'career-grid');for(const color of BettaTypes.colors){const found=c.discoveries[color.id],card=node('article',undefined,'career-card '+(found?'discovered':'locked'));card.append(node('span',found?'✓ Scoperta':'Da allevare','discovery-badge'),node('h3',color.name));
    const f=BettaTypes.specimen('halfmoon',color.id,'M');f.seed=123456;const image=node('img');drawPreview(image,f);card.append(image);if(found)card.append(node('p',found.starter?'Livrea iniziale':'Mese '+found.month+' · esemplare #'+found.fishId+' · genitori '+(found.parents||[]).map(id=>'#'+id).join(' × ')));
    const hints=Object.keys(color.genes).filter(k=>color.genes[k].includes(k)).map(k=>(labels[k]||k).replace(' (sim.)',''));card.append(node('p','Tratti da riunire: '+(hints.join(', ')||'colorazione di base')+'.'));if(!found){const help=button(goal===color.id?'Obiettivo selezionato':'Guida agli incroci',()=>chooseGoal(color.id));help.dataset.guideColor=color.id;card.append(help);}grid.append(card);
   }catalogFilter(grid,'album');
  }else if(tab==='market'){
   content.append(node('h3','Riproduttori da altri allevatori'),node('p',goal?'Completa la coppia, poi prosegui con il primo incrocio.':'Introduci una nuova linea nel tuo allevamento. Acquistare un pesce non sblocca la sua livrea nell’album.'));
   if(goal){
    if(!marketRoute||marketRoute.goal!==goal){const pair=BettaBreedingGuide.marketPair(s,goal);if(pair){marketRoute={goal,pair};saveFlow();refreshGuide(s);}}
    const pair=marketRoute?.pair,section=node('section',undefined,'breeding-guide market-route');section.id='market-breeding-pair';
    section.append(node('small','IL TUO PERCORSO'),node('h3','Coppia consigliata per '+BettaCareer.byId(goal).name));
    if(pair){
     const owned=routeParents(s),cards=node('div',undefined,'route-parents');section.append(node('p',owned.filter(Boolean).length+'/2 riproduttori in allevamento','route-progress'));if(owned.every(Boolean)){const step=nextStep(s),go=button(step.label,step.run);go.id='market-go-pair';section.append(go);}
     for(const [i,sex,offer] of [[0,'F',pair.mother],[1,'M',pair.father]]){
      const fish=owned[i]||BettaTypes.specimen('halfmoon',offer.colorId,sex),card=fishCard(fish,!!owned[i]);card.classList.add('route-parent');card.querySelector('h3').textContent=(sex==='F'?'Femmina · ':'Maschio · ')+BettaCareer.byId(offer.colorId).name;
      card.append(node('span',owned[i]?'✓ In allevamento · #'+fish.id:offer.price+' monete',owned[i]?'route-owned':'route-needed'));
      if(!owned[i]){const available=BettaCareer.offers(s).find(o=>o.id===offer.id),buy=button('Acquista '+(sex==='F'?'femmina ':'maschio ')+BettaCareer.byId(offer.colorId).name+' · '+offer.price+' monete',()=>action('buy',{offerId:offer.id,sex}));buy.dataset.focusKey='route-buy-'+sex;buy.disabled=!available||s.career.cash<offer.price||s.fish.length>=s.career.capacity;card.append(buy);if(!available)card.append(node('p','Linea già presente: cerca il sesso richiesto nel tuo allevamento.'));else if(s.career.cash<offer.price)card.append(node('p','Monete insufficienti. Vendi un adulto o completa un ordine.'));else if(s.fish.length>=s.career.capacity)card.append(node('p','Allevamento pieno: libera spazio o amplia la casa.'));}
      cards.append(card);
     }
     section.append(cards);
     const steps=node('ol',undefined,'route-steps');for(const text of ['Acquista i due riproduttori.','Incrociali: il primo incrocio non genera la livrea scelta.','Seleziona i discendenti utili e falli crescere.','Incrocia i discendenti selezionati: '+(pair.probability*100).toLocaleString('it-IT',{maximumFractionDigits:1})+'% per piccolo.'])steps.append(node('li',text));section.append(steps);
     const detail=node('details',undefined,'guide-details');detail.dataset.detail='market-genetics';detail.append(node('summary','Geni da selezionare e probabilità'),node('p','Profilo da selezionare: '+Object.entries(pair.intermediateGenes).map(([k,v])=>k+' '+v).join(' · ')+'.'),node('p','Probabilità di questo profilo nel primo incrocio: '+(pair.intermediateProbability*100).toLocaleString('it-IT',{maximumFractionDigits:2})+'% per piccolo. Potrebbero servire più nidiate per ottenere entrambi i sessi.'));section.append(detail);
    }else section.append(node('p','Non ci sono due linee disponibili nel mercato che offrano un percorso verificato in due generazioni senza produrre direttamente questa livrea.'));
    content.append(section);
   }
   if(!BettaCareer.offers(s).length)content.append(node('p','Possiedi già tutte le livree disponibili nel mercato.'));
   const grid=node('div',undefined,'career-grid');for(const offer of BettaCareer.offers(s)){const f=BettaTypes.specimen('halfmoon',offer.colorId,'M');f.seed=234567;const card=fishCard(f);card.querySelector('h3').textContent=BettaCareer.byId(offer.colorId).name;card.append(node('strong',offer.price+' monete'));for(const sex of ['F','M'])card.append(button(sex==='F'?'Acquista femmina':'Acquista maschio',()=>action('buy',{offerId:offer.id,sex})));grid.append(card);}catalogFilter(grid,'market');
  }else if(tab==='orders'){
   content.append(node('p','Alleva e consegna un adulto nato nel tuo allevamento. Puoi seguire due ordini alla volta; nuove richieste ogni tre mesi. La consegna trasferisce il pesce al cliente.'));
   for(const o of c.orders){const card=node('article',undefined,'career-card');card.append(node('h3',BettaCareer.byId(o.colorId).name),node('p',o.reward+' monete · scadenza mese '+o.deadline+' · '+({available:'Disponibile',accepted:'Accettato',completed:'Consegnato',expired:'Scaduto'}[o.status])));
    if(o.status==='available')card.append(button('Accetta ordine',()=>action('accept',{orderId:o.id})));
    if(o.status==='accepted'){const choices=node('select');choices.setAttribute('aria-label','Esemplare da consegnare');for(const f of s.fish.filter(f=>f.age>=4&&f.gen>=1&&BettaCareer.matches(f).includes(o.colorId)&&!c.listings.some(l=>l.fishId===f.id))){const opt=node('option','#'+f.id+' · '+BettaCareer.displayName(f));opt.value=f.id;choices.append(opt);}card.append(choices,button('Consegna',()=>action('deliver',{orderId:o.id,fishId:Number(choices.value)})));if(!choices.options.length)card.append(node('p','Non hai ancora un adulto nato qui con questa livrea.'));}content.append(card);
   }
  }else{
   content.append(node('h3','Amplia la casa'),node('p','Stanza 1: riproduttori · Stanza 2: crescita · Stanza 3: negozio. Gli ampliamenti aumentano i posti disponibili; le vasche di crescita si organizzano automaticamente per nidiata.'));
   content.append(node('p','Capienza attuale: '+c.capacity+' pesci.'),button('Aggiungi 24 posti · '+(250+c.expansions*150)+' ◈',()=>action('expand')));
   content.append(node('p','Vetrine allestite: '+c.shopSlots+' / 24.'),button(c.shopSlots<24?'Allestisci altre 4 vetrine · '+c.shopSlots*60+' ◈':'Negozio completo',()=>action('shopExpand')));
   content.append(node('p','In evidenza questo mese: '+BettaCareer.byId(BettaCareer.demand(s.month)).name+' · valore consigliato +25%.'));
  }
  restoreView();
 }
 const draw=()=>{render.force=true;render();render.force=false;};
 // Populate before showModal as well as after store updates.
 for(const b of buttons)b.onclick=()=>{draw();notice.textContent='';dialog.showModal();};
 window.bettaCareerUI.open=(which,tank=null)=>{if(which==='shop')shopTank=tank;if(which&&which!==tab)changeTab(which);else draw();notice.textContent='';if(!dialog.open)dialog.showModal();dialog.scrollTop=tabScroll.get(tab)||0;};
 window.bettaCareerUI.openTankShop=tank=>window.bettaCareerUI.open('shop',tank);
 appStore.subscribe(render);render();
 let customerTick=performance.now();
 setInterval(()=>{
  const now=performance.now(),seconds=Math.min(5,(now-customerTick)/1000);customerTick=now;
  if(!document.hidden)appStore.tickCustomers(seconds);
 },1000);
 document.addEventListener('visibilitychange',()=>{customerTick=performance.now();});
 if(state.mode==='career'){
  document.getElementById('open-catalog').textContent='Acquista riproduttori';document.getElementById('open-catalog').onclick=()=>window.bettaCareerUI.open('market');
  const sell=button('Esponi nel negozio',()=>window.bettaCareerUI.open('shop'));sell.id='open-sale';document.querySelector('.fish-info').append(sell);
 }
})();
