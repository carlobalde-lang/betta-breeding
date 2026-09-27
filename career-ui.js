'use strict';
(()=>{
 const node=(tag,text,className)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;};
 const dialog=node('dialog',undefined,'career-dialog');dialog.id='career-panel';
 const head=node('header'),heading=node('h2','Il tuo allevamento'),close=node('button','Chiudi','secondary');close.onclick=()=>dialog.close();head.append(heading,close);dialog.append(head);
 const notice=node('p','','career-notice');notice.setAttribute('role','status');dialog.append(notice);
 const stats=node('div',undefined,'career-stats'),tabs=node('nav',undefined,'career-tabs'),content=node('div',undefined,'career-content');dialog.append(stats,tabs,content);
 const footer=node('footer'),switchMode=node('button','Cambia modalità','secondary');switchMode.onclick=()=>{try{sessionStorage.removeItem('betta-mode');}catch{}location.reload();};footer.append(node('p','Carriera e creativa hanno salvataggi separati. Il cambio di modalità conserva i progressi.'),switchMode);dialog.append(footer);document.body.append(dialog);
 const buttons=[];for(const container of [document.querySelector('.room-header'),document.querySelector('.top-right')]){const b=node('button','','room-button career-open');b.onclick=()=>open();container.append(b);buttons.push(b);}
 let tab='shop',goal=null,guideMemo=null,guidePair=null;
 const goalBanner=node('div',undefined,'breeding-goal');goalBanner.id='breeding-goal';goalBanner.hidden=true;document.getElementById('roster').before(goalBanner);
 function guidePlan(s){
  const key=JSON.stringify([goal,s.month,s.fish.map(f=>[f.id,f.sex,f.age,f.genes,f.ancestry,f.parents]),s.career.listings,s.career.capacity]);
  if(guideMemo?.key!==key)guideMemo={key,value:BettaBreedingGuide.plan(s,goal)};return guideMemo.value;
 }
 function chooseGoal(id){goal=id;guideMemo=null;guidePair=null;tab='album';render();dialog.scrollTop=0;}
 function refreshGuide(s){
  goalBanner.hidden=!goal||s.mode!=='career';const plan=!goalBanner.hidden?guidePlan(s):null,pair=plan?.pairs.find(p=>p.mother===guidePair?.mother&&p.father===guidePair?.father)||plan?.pairs[0];
  for(const card of document.querySelectorAll('#roster .fish-card')){const selected=!!pair&&[pair.mother,pair.father].includes(Number(card.dataset.fishId));card.classList.toggle('guide-parent',selected);let badge=card.querySelector('.guide-parent-badge');if(selected&&!badge){badge=node('small','Consigliato per '+BettaCareer.byId(goal).name,'guide-parent-badge');card.append(badge);}if(badge){badge.hidden=!selected;if(selected)badge.textContent='Consigliato per '+BettaCareer.byId(goal).name;}}
  if(!plan)return;
  goalBanner.replaceChildren(node('strong','Obiettivo: '+BettaCareer.byId(goal).name+(s.career.discoveries[goal]?' · scoperto!':'')),button('Vedi guida',()=>window.bettaCareerUI.open('album')),button('Rimuovi obiettivo',()=>{goal=null;guideMemo=null;render();}));
 }
 function renderGuide(s){
  if(!goal)return;const plan=guidePlan(s),panel=node('section',undefined,'breeding-guide');panel.id='breeding-guide';panel.append(node('h3','Come ottenere '+BettaCareer.byId(goal).name),node('p','Probabilità calcolate sui geni e sulle regole dell’album del gioco. Ogni nascita è indipendente: un incrocio favorevole non garantisce lo sblocco.'));
  const percent=p=>p>0&&p<.001?'<0,1%':(p*100).toLocaleString('it-IT',{maximumFractionDigits:1})+'%';
  for(const [i,pair] of plan.pairs.entries()){
   const mother=s.fish.find(f=>f.id===pair.mother),father=s.fish.find(f=>f.id===pair.father),row=node('article',undefined,'guide-pair');
   row.append(node('strong',(i===0?'Coppia consigliata: ':'Alternativa: ')+'#'+mother.id+' '+mother.name+' × #'+father.id+' '+father.name),node('p',percent(pair.probability)+' per piccolo · '+percent(pair.brood)+' di almeno uno in una nidiata di quattro.'));
   if(!pair.ready)row.append(node('p',pair.reason));
   const select=button('Evidenzia e scegli questa coppia',()=>{if(!BettaStore.pairingStatus(appStore.getState(),mother,father).allowed){render();return;}guidePair=pair;dialog.close();setRosterFilter('all');document.getElementById('room-lab').click();appStore.choosePair(mother.id,father.id);document.getElementById('collection-panel').scrollIntoView({block:'start'});});select.disabled=!pair.ready;row.append(select);panel.append(row);
  }
  if(!plan.pairs.length){
   panel.append(node('p','Non ho trovato un incrocio diretto per questa livrea tra i profili confrontati.'));
   if(plan.missing.length)panel.append(node('p','Tratti mancanti: '+plan.missing.map(k=>(labels[k]||k).replace(' (sim.)','')).join(', ')+'. Introducili acquistando riproduttori; sbloccare un nome nell’album da solo non cambia i geni.'));
   for(const donor of plan.donors){const available=BettaCareer.offers(s).some(o=>o.colorId===donor.id);panel.append(node('p','Cerca '+BettaCareer.byId(donor.id).name+' per introdurre '+donor.supplies.map(k=>(labels[k]||k).replace(' (sim.)','')).join(', ')+(available?' · disponibile ora nel mercato.':' · controlla le offerte dei prossimi mesi.')));}
   if(!plan.missing.length)panel.append(node('p','I caratteri sono presenti ma non ancora combinabili in una sola nidiata. Può servire una nuova generazione o un riproduttore della linea cercata.'));
   if(plan.steps.length){panel.append(node('h3','Nel frattempo puoi sbloccare'),node('p','Livree vicine al tuo obiettivo e ottenibili adesso. Sono suggerimenti di progressione, non prerequisiti obbligatori.'));for(const step of plan.steps)panel.append(button(BettaCareer.byId(step.id).name+' · '+percent(step.pair.probability)+' per piccolo',()=>chooseGoal(step.id)));}
   panel.append(button('Cerca riproduttori nel mercato',()=>{tab='market';render();dialog.scrollTop=0;}));
  }
  if(plan.limited)panel.append(node('p','Allevamento ampio: confronto i 128 profili genetici più vicini per sesso.'));
  content.append(panel);
 }

 const titles={shop:'Negozio',album:'Album',market:'Riproduttori',orders:'Ordini',house:'Casa'};
 for(const [id,title] of Object.entries(titles)){const b=node('button',title);b.dataset.tab=id;b.onclick=()=>{tab=id;render();};tabs.append(b);}
 function action(type,data){try{appStore.career(type,data);notice.textContent='Operazione completata.';}catch(e){notice.textContent=e.message;}}
 function open(which){if(which)tab=which;render();notice.textContent='';if(!dialog.open)dialog.showModal();}
 window.bettaCareerUI={open};
 function button(text,fn){const b=node('button',text,'secondary');b.onclick=fn;return b;}
 function fishCard(f){const card=node('article',undefined,'career-card');const img=node('img');img.width=256;img.height=160;drawPreview(img,f);card.append(img,node('h3',f.name+' · #'+f.id),node('p',(f.sex==='F'?'Femmina':'Maschio')+' · '+f.age+' mesi · '+BettaTypes.name(f)));return card;}
 function render(){
  const s=appStore.getState(),c=s.career,creative=s.mode!=='career';
  refreshGuide(s);
  for(const b of buttons)b.textContent=creative?'Creativa · modalità':'Carriera · '+c.cash+' ◈';
  if(!dialog.open&&!render.force)return;
  heading.textContent=creative?'Modalità creativa':'La tua carriera';tabs.hidden=creative;stats.hidden=creative;content.replaceChildren();
  if(creative){content.append(node('p','Catalogo completo e incroci liberi. Il tuo allevamento originale è conservato qui.'));return;}
  stats.replaceChildren(...[c.cash+' monete',c.reputation+' reputazione',s.fish.length+' / '+c.capacity+' pesci',Object.keys(c.discoveries).length+' / '+BettaTypes.colors.length+' livree'].map(v=>node('span',v)));
  for(const b of tabs.children)b.setAttribute('aria-pressed',String(b.dataset.tab===tab));
  if(tab==='shop'){
   content.append(node('h3','Le vetrine · '+c.listings.length+' / '+c.shopSlots),node('p','I clienti visitano il negozio quando passi al mese successivo. Ogni cliente valuta un solo pesce compatibile con i suoi gusti e il budget.'));
   const visit=button('Visita la Stanza 3 · negozio',()=>{dialog.close();window.betta3d?.openShop();});content.append(visit);
   const form=node('div',undefined,'career-sale-form'),select=node('select'),price=node('input'),hint=node('p');select.id='sale-fish';select.setAttribute('aria-label','Pesce da esporre');price.id='sale-price';price.type='number';price.min='1';price.max='1000000';price.step='1';price.setAttribute('aria-label','Prezzo in monete');
   for(const f of s.fish.filter(f=>f.age>=4&&!c.listings.some(l=>l.fishId===f.id))) {const option=node('option','#'+f.id+' · '+f.name);option.value=f.id;select.append(option);}
   if([...select.options].some(o=>Number(o.value)===s.selected))select.value=s.selected;
   function recommendation(reset){const f=s.fish.find(f=>f.id===Number(select.value));if(!f){hint.textContent='Non ci sono adulti disponibili.';return;}const max=BettaCareer.value(f,s.month);if(reset)price.value=max;hint.textContent='Massimo consigliato: '+max+' monete · '+Math.round(BettaCareer.chance(Number(price.value),max)*100)+'% per cliente interessato con budget sufficiente.';}
   select.onchange=()=>recommendation(true);price.oninput=()=>recommendation(false);recommendation(true);
   form.append(node('label','Esponi un adulto'),select,node('label','Prezzo'),price,button('Sposta in vetrina',()=>action('list',{fishId:Number(select.value),price:Number(price.value)})),hint);content.append(form);
   const grid=node('div',undefined,'career-grid');for(const l of c.listings){const f=s.fish.find(f=>f.id===l.fishId),card=fishCard(f),edit=node('input');edit.type='number';edit.min=1;edit.max=1000000;edit.value=l.price;edit.setAttribute('aria-label','Prezzo di '+f.name);const max=BettaCareer.value(f,s.month);card.append(node('p','Consigliato fino a '+max+' ◈ · probabilità '+Math.round(BettaCareer.chance(l.price,max)*100)+'%'),edit,button('Aggiorna prezzo',()=>action('list',{fishId:f.id,price:Number(edit.value)})),button('Riporta in allevamento',()=>action('withdraw',{fishId:f.id})));grid.append(card);}content.append(grid,node('h3','Ultime visite'));
   if(!c.visits.length)content.append(node('p','Allestisci le vetrine e passa un mese per accogliere i primi clienti.'));
   for(const v of c.visits)content.append(node('p',v.name+' · budget '+v.budget+' ◈ · '+(v.wanted==='any'?'curioso':BettaCareer.byId(v.wanted)?.name||'collezionista')+' — '+v.message,'customer-visit'));
  }else if(tab==='album'){
   renderGuide(s);
   content.append(node('p','Le nuove livree si scoprono quando nascono piccoli con quei caratteri visibili. Ogni scoperta vale 100 monete e 2 punti reputazione. Acquistare un riproduttore non sblocca la sua livrea. Caratteri sovrapposti possono registrare più nomi commerciali.'));
   const grid=node('div',undefined,'career-grid');for(const color of BettaTypes.colors){const found=c.discoveries[color.id],card=node('article',undefined,'career-card '+(found?'discovered':'locked'));card.append(node('span',found?'✓ Scoperta':'Da allevare','discovery-badge'),node('h3',color.name));
    const f=BettaTypes.specimen('halfmoon',color.id,'M');f.seed=123456;const image=node('img');drawPreview(image,f);card.append(image);if(found)card.append(node('p',found.starter?'Livrea iniziale':'Mese '+found.month+' · esemplare #'+found.fishId+' · genitori '+(found.parents||[]).map(id=>'#'+id).join(' × ')));
    const hints=Object.keys(color.genes).filter(k=>color.genes[k].includes(k)).map(k=>(labels[k]||k).replace(' (sim.)',''));card.append(node('p','Tratti da riunire: '+(hints.join(', ')||'colorazione di base')+'.'));if(!found){const help=button(goal===color.id?'Obiettivo selezionato':'Guida agli incroci',()=>chooseGoal(color.id));help.dataset.guideColor=color.id;card.append(help);}grid.append(card);
   }content.append(grid);
  }else if(tab==='market'){
   content.append(node('h3','Riproduttori da altri allevatori'),node('p','Quattro linee comuni sempre disponibili e tre offerte che cambiano ogni mese. Le nuove linee introducono i tratti necessari per scoprire altre livree attraverso le nascite.'));
   const grid=node('div',undefined,'career-grid');for(const offer of BettaCareer.offers(s)){const f=BettaTypes.specimen('halfmoon',offer.colorId,'M');f.seed=234567;const card=fishCard(f);card.querySelector('h3').textContent=BettaCareer.byId(offer.colorId).name;card.append(node('strong',offer.price+' monete'));for(const sex of ['F','M'])card.append(button(sex==='F'?'Acquista femmina':'Acquista maschio',()=>action('buy',{offerId:offer.id,sex})));grid.append(card);}content.append(grid);
  }else if(tab==='orders'){
   content.append(node('p','Alleva e consegna un adulto nato nel tuo allevamento. Puoi seguire due ordini alla volta; nuove richieste ogni tre mesi. La consegna trasferisce il pesce al cliente.'));
   for(const o of c.orders){const card=node('article',undefined,'career-card');card.append(node('h3',BettaCareer.byId(o.colorId).name),node('p',o.reward+' monete · scadenza mese '+o.deadline+' · '+({available:'Disponibile',accepted:'Accettato',completed:'Consegnato',expired:'Scaduto'}[o.status])));
    if(o.status==='available')card.append(button('Accetta ordine',()=>action('accept',{orderId:o.id})));
    if(o.status==='accepted'){const choices=node('select');choices.setAttribute('aria-label','Esemplare da consegnare');for(const f of s.fish.filter(f=>f.age>=4&&f.gen>=1&&BettaCareer.matches(f).includes(o.colorId)&&!c.listings.some(l=>l.fishId===f.id))){const opt=node('option','#'+f.id+' · '+f.name);opt.value=f.id;choices.append(opt);}card.append(choices,button('Consegna',()=>action('deliver',{orderId:o.id,fishId:Number(choices.value)})));if(!choices.options.length)card.append(node('p','Non hai ancora un adulto nato qui con questa livrea.'));}content.append(card);
   }
  }else{
   content.append(node('h3','Amplia la casa'),node('p','Stanza 1: riproduttori · Stanza 2: crescita · Stanza 3: negozio. Gli ampliamenti aumentano i posti disponibili; le vasche di crescita si organizzano automaticamente per nidiata.'));
   content.append(node('p','Capienza attuale: '+c.capacity+' pesci.'),button('Aggiungi 24 posti · '+(250+c.expansions*150)+' ◈',()=>action('expand')));
   content.append(node('p','Vetrine allestite: '+c.shopSlots+' / 24.'),button(c.shopSlots<24?'Allestisci altre 4 vetrine · '+c.shopSlots*60+' ◈':'Negozio completo',()=>action('shopExpand')));
   content.append(node('p','In evidenza questo mese: '+BettaCareer.byId(BettaCareer.demand(s.month)).name+' · valore consigliato +25%.'));
  }
 }
 const draw=()=>{render.force=true;render();render.force=false;};
 // Populate before showModal as well as after store updates.
 for(const b of buttons)b.onclick=()=>{draw();notice.textContent='';dialog.showModal();};
 window.bettaCareerUI.open=which=>{if(which)tab=which;draw();notice.textContent='';if(!dialog.open)dialog.showModal();};
 appStore.subscribe(render);render();
 if(state.mode==='career'){
  document.getElementById('open-catalog').textContent='Acquista riproduttori';document.getElementById('open-catalog').onclick=()=>window.bettaCareerUI.open('market');
  const sell=button('Esponi nel negozio',()=>window.bettaCareerUI.open('shop'));sell.id='open-sale';document.getElementById('fish-traits').after(sell);
 }
})();
