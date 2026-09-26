'use strict';
const $ = selector => document.querySelector(selector);
const appStore = BettaStore.create({
  getItem: key => localStorage.getItem(key),
  setItem: (key,value) => localStorage.setItem(key,value)
});
let state = appStore.getState();
const labels = {T:'bianco (sim.)',N:'arancio (sim.)',P:'lavanda (sim.)',J:'giallo corpo (sim.)',Q:'puntinato (sim.)',U:'samurai (sim.)',Z:'bordo blu (sim.)',X:'bicolore (sim.)',G:'verde (sim.)',B:'Blu',M:'Marble',F:'Butterfly',I:'Iridescenza',K:'Nero',R:'Rosso',C:'Rame',O:'Dragon (sim.)',Y:'Giallo pinne (sim.)'};
const rosterCards = new Map();
const rosterView={query:'',filter:'all',sort:'recent',brood:null,broodName:''};
const selected = () => state.fish.find(f => f.id === state.selected) || state.fish[0];
const parents = () => [state.fish.find(f => f.id === state.mother),state.fish.find(f => f.id === state.father)];
const genotypeParams = BettaAppearance.params;
const phenotype = BettaAppearance.describe;

function message(text) {
  const notice=appStore.getStatus().notice;
  const content=notice&&text!==notice?[notice,text].filter(Boolean).join(' '):text;
  $('#app-status').textContent = content;
  $('#app-status').hidden = !content;
}
function act(action) {
  try { action(); } catch(error) { message(error.message); }
}
function download(content, name, type) {
  const url = URL.createObjectURL(new Blob([content], {type}));
  const link = document.createElement('a');
  link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
function drawPreview(image, fish) {
  image.alt = 'Anteprima 3D: ' + BettaTypes.name(fish);
  image.width = 256; image.height = 160;
  if (window.betta3d) window.betta3d.thumbnail(image, fish);
}
function renderStage() {
  const fish = selected();
  window.betta3d?.setFish(fish);
  $('#season').textContent = 'MESE ' + String(state.month).padStart(2,'0');
  $('#count').textContent = state.fish.length + ' ESEMPLARI';
  $('#generation').textContent = 'GEN. ' + Math.max(...state.fish.map(f => f.gen));
  $('#fish-number').textContent = '#' + fish.id + ' · ' + (fish.gen ? 'GENERAZIONE ' + fish.gen : 'FONDATORE');
  const dev=BettaTypes.development(fish);
  $('#fish-age').textContent = dev.stage.toUpperCase()+' · '+fish.age+' MESI DI GIOCO';
  $('#fish-development').textContent=dev.label+' · taglia '+Math.round(dev.size*100)+'% della propria taglia adulta simulata';
  $('#growth-progress').value=dev.size;
  $('#growth-note').textContent=fish.age<4?'Corpo, pinne e pigmentazione crescono a ogni mese. Riproduzione da 2 mesi; sviluppo completo a 4 mesi di gioco.':'Sviluppo completo nel modello. Proporzioni illustrative; il sesso non si deduce dai soli colori o dalle pinne.';
  $('#fish-name').textContent = fish.name;
  $('#fish-form').textContent = BettaTypes.name(fish);
  $('#fish-traits').textContent = phenotype(fish);
  $('#fish-family').textContent=fish.parents
    ? 'Genitori: '+fish.parents.map(id=>{const p=state.fish.find(f=>f.id===id);return p?p.name+' (#'+id+')':'#'+id;}).join(' × ')
    : 'Fondatore · nessun genitore registrato.';
  $('#stat-adults').textContent=state.fish.filter(f=>f.age>=2).length;
  $('#stat-young').textContent=state.fish.filter(f=>f.age<2).length;
  $('#stat-ready').textContent=state.fish.filter(f=>f.age===1).length;
  const ready=appStore.breedingStatus();
  $('#next-step').textContent=ready.allowed?'La coppia è pronta. Puoi generare quattro piccoli.':ready.reason;
  $('#advance').textContent='Passa al mese '+(state.month+1)+' ↗';
  $('#room-advance').textContent='Passa al mese '+(state.month+1)+' →';
  const latest=state.fish.find(f=>f.id===Number($('#birth-nursery').dataset.fishId));
  $('#birth-banner').hidden=!latest||latest.age>0;
}
function geneList(container, genes, names) {
  const nodes = Object.entries(genes).map(([key,value]) => {
    const label = document.createElement('span');
    label.className = 'gene';
    label.append((names[key] || key) + ' ');
    const allele = document.createElement('b');
    allele.textContent = value; label.append(allele);
    return label;
  });
  container.replaceChildren(...nodes);
}
let lastGenome = '';
function renderGenome() {
  const fish = selected();
  const key = BettaAppearance.key(fish);
  if (key === lastGenome) return;
  lastGenome = key;
  const ornamental = BettaSpecies.ornamental(fish);
  $('#seed-label').textContent = 'SEED ' + fish.seed;
  $('#color-genome-title').textContent = ornamental ? 'FATTORI CROMATICI DEL GIOCO' : 'SPECIE / ORIGINE';
  $('#form-genome-title').hidden = !ornamental;
  $('#form-genes').hidden = !ornamental;
  $('#shader-data').hidden = true;
  if (!ornamental) {
    $('#genes').textContent = BettaSpecies.label(fish) + ' · ' + BettaSpecies.description(fish);
    return;
  }
  geneList($('#genes'), fish.genes, labels);
  geneList($('#form-genes'), fish.form, BettaTypes.labels);
  const p = genotypeParams(fish);
  $('#shader-data').replaceChildren(...[
    ['DENSITÀ MACCHIE',p.spots],['CONTRASTO BORDI',p.contrast],['FREQUENZA MARBLE',p.frequency],['RIFLESSO FRESNEL',p.iridescence]
  ].map(([name,value]) => {
    const node = document.createElement('div'); node.className = 'metric';
    const label = document.createElement('span'); label.textContent = name;
    const number = document.createElement('strong'); number.textContent = value.toFixed(2);
    node.append(label,number); return node;
  }));
}
function renderParents() {
  for (const [fish,selector] of [[parents()[0],'#mother-slot'],[parents()[1],'#father-slot']]) {
    const slot = $(selector);
    const detail = document.createElement('small');
    detail.textContent = fish ? phenotype(fish) : 'Seleziona un esemplare dalla vasca';
    slot.replaceChildren();
    if(fish){
      const image=document.createElement('img');image.className='parent-preview';drawPreview(image,fish);slot.append(image);
      const name=document.createElement('strong');name.textContent=fish.name;slot.append(name);
      detail.textContent=BettaTypes.name(fish)+' · #'+fish.id;
    }else{
      const choose=document.createElement('button');choose.className='pick';choose.textContent='Scegli dalla vasca';
      choose.onclick=()=>{setRosterFilter(selector==='#mother-slot'?'F':'M');$('#collection-panel').scrollIntoView({block:'start'});$('#fish-filter').focus();};
      slot.append(choose);
    }
    slot.append(detail);
    $(selector==='#mother-slot'?'#clear-mother':'#clear-father').hidden=!fish;
  }
}
function renderForecast() {
  const [mom,dad] = parents();
  const compatibility = BettaSpecies.compatibility(mom,dad);
  const readiness=appStore.breedingStatus();
  $('#breed').disabled=!readiness.allowed;
  $('#breed-hint').textContent=readiness.reason;
  $('#breed-hint').classList.toggle('ready',readiness.allowed);
  $('#relationship').textContent = BettaStore.relationship(mom,dad);
  const box = $('#cross-forecast');
  const expanded=box.querySelector('details')?.open||false;
  box.replaceChildren();
  if (!compatibility.ornamental) { box.textContent = compatibility.message; return; }
  const heading = document.createElement('strong');
  heading.textContent = 'Previsione della simulazione';
  box.append(heading);
  for (const [label,value] of BettaTypes.forecast(mom,dad).filter(([label])=>['Pinne lunghe','Pinne corte','Doppia coda'].includes(label))) {
    const row=document.createElement('div'),name=document.createElement('span'),number=document.createElement('b');
    name.textContent=label; number.textContent=value+'%'; row.append(name,number); box.append(row);
  }
  const note=document.createElement('small');
  note.textContent='Per singolo nato, dagli alleli dei genitori nel gioco. Dominanza lungo/corto e recessività doubletail hanno supporto scientifico; i numeri non derivano da analisi del DNA. Quattro piccoli non garantiscono queste proporzioni.';
  box.append(note);
  const prediction=BettaTypes.predict(mom,dad);
  const details=document.createElement('details');details.className='experimental-forecast';details.open=expanded;
  const summary=document.createElement('summary');summary.textContent='Modello sperimentale · forme e colori';details.append(summary);
  const warning=document.createElement('p');warning.textContent='Non validato biologicamente. Calcolo esatto delle regole del gioco: loci indipendenti, nessuna selezione o mortalità. Le forme indicano il potenziale adulto; sesso ed età ne modificano la resa.';details.append(warning);
  function group(title,rows,description){
    const section=document.createElement('section'),h=document.createElement('strong');h.textContent=title;section.append(h);
    for(const [label,value] of rows){
      const row=document.createElement('div'),name=document.createElement('span'),number=document.createElement('b');
      name.textContent=label;number.textContent=new Intl.NumberFormat('it',{maximumFractionDigits:2}).format(value)+'%';row.append(name,number);section.append(row);
    }
    if(description){const note=document.createElement('small');note.textContent=description;section.append(note);}
    details.append(section);
  }
  const top=prediction.forms.slice(0,8),remaining=prediction.forms.slice(8).reduce((sum,row)=>sum+row[1],0);
  if(remaining)top.push(['Altre combinazioni ('+(prediction.forms.length-8)+')',remaining]);
  group('Forme adulte possibili',top,'Categorie esclusive, somma 100% prima dell’arrotondamento. I nomi possono combinare più tratti; velo e punta possono mascherare il nome dell’apertura.');
  group('Tratti e portatori',[
    ...BettaTypes.forecast(mom,dad).filter(([label])=>!['Pinne lunghe','Pinne corte','Doppia coda'].includes(label)),
    ['Portatore doubletail (Dd)',prediction.carrier],...prediction.modifiers
  ],'Tratti sovrapponibili. Ww: membrana intermedia; ww: corona; ee: Dumbo. V e S agiscono per dose, anche insieme.');
  group('Apertura nominale della coda',prediction.apertures.map(([angle,p])=>[angle+'°',p]),'Due fattori additivi A/H: 120° + 20° per allele maiuscolo. Velo, punta e incisioni modificano il contorno; questi gradi non sono misure certificate del pesce.');
  group('Fattore blu ereditato',prediction.blue,'BB steel, Bb royal, bb turchese: dominanza incompleta ipotizzata dal gioco.');
  group('Blu dopo la mascheratura cromatica',[...prediction.visibleBlue,['Blu mascherato dai pigmenti',prediction.maskedBlue]],'Categorie della descrizione adulta, non percentuali di superficie colorata. Gli altri pattern possono modificare ulteriormente l’aspetto.');
  group('Altri fattori cromatici',prediction.factors.flatMap(f=>[
    [labels[f.locus]+' · almeno un allele attivo',f.active],
    [labels[f.locus]+' · due alleli attivi',f.double]
  ]),'La seconda quota è inclusa nella prima. Due dosi possono intensificare il tratto; Dragon e giallo sono interruttori. I fattori si combinano: non sommare le percentuali. Marble predice il fattore, non le singole macchie.');
  group('Sesso assegnato',['Femmina','Maschio'].map(label=>[label,50]),'Estrazioni indipendenti del gioco; non è una previsione del rapporto sessi di una covata reale.');
  box.append(details);
}
function createCard(fish) {
  const card=document.createElement('div'); card.className='fish-card'; card.dataset.fishId=fish.id;
  const image=document.createElement('img'); image.className='fish-thumbnail';
  const info=document.createElement('div'); info.className='card-info';
  const name=document.createElement('strong'),detail=document.createElement('small'),reason=document.createElement('small');reason.className='pair-reason';
  info.append(name,detail,reason);
  const actions=document.createElement('div'); actions.className='card-actions';
  const study=document.createElement('button'); study.className='pick'; study.textContent='Osserva';
  study.onclick=()=>act(()=>{appStore.select(fish.id);if(innerWidth<=720)$('#observation').scrollIntoView({block:'start'});});
  const pick=document.createElement('button'); pick.className='pick';
  pick.onclick=()=>act(()=>{
    const candidate=state.fish.find(f=>f.id===fish.id);
    if(!BettaStore.selectionStatus(state,candidate).allowed)return;
    appStore.pick(candidate.id);
    if(innerWidth<=720)$('#breeding-panel').scrollIntoView({block:'start'});
  });
  actions.append(study,pick); card.append(image,info,actions);
  return {card,image,name,detail,pick,reason};
}
function renderRoster() {
  const ids=new Set(state.fish.map(f=>f.id));
  for(const [id,item] of rosterCards) if(!ids.has(id)) { item.card.remove(); rosterCards.delete(id); }
  const roster=$('#roster');
  const query=rosterView.query.trim().toLocaleLowerCase('it');
  const matches=fish=>{
    if(rosterView.brood&&!rosterView.brood.includes(fish.id))return false;
    const group=rosterView.filter;
    const filter=group==='all'||(group==='young'&&fish.age<2)||(group==='adult'&&fish.age>=2)
      ||(['F','M'].includes(group)&&fish.sex===group&&fish.age>=2)
      ||(group==='parents'&&[state.mother,state.father].includes(fish.id));
    return filter&&(!query||(fish.name+' '+BettaTypes.name(fish)+' #'+fish.id).toLocaleLowerCase('it').includes(query));
  };
  const ordered=[...state.fish].sort((a,b)=>rosterView.sort==='name'?a.name.localeCompare(b.name,'it')||a.id-b.id:rosterView.sort==='age'?a.age-b.age||b.id-a.id:b.id-a.id);
  const count=ordered.filter(matches).length;
  $('#roster-summary').textContent=count+' di '+state.fish.length+' esemplari';
  $('#brood-context').hidden=!rosterView.brood;
  $('#brood-title').textContent=rosterView.broodName;
  $('#roster-empty').hidden=count>0;
  ordered.forEach((fish,index)=>{
    let item=rosterCards.get(fish.id);
    if(!item) { item=createCard(fish); rosterCards.set(fish.id,item); }
    item.card.hidden=!matches(fish);
    item.card.classList.toggle('active',fish.id===state.selected);
    item.name.textContent=(fish.sex==='F'?'♀ ':'♂ ')+fish.name;
    item.detail.textContent=BettaTypes.development(fish).stage+' · '+fish.age+' mesi · '+BettaTypes.name(fish);
    item.detail.className=fish.age<2?'juvenile':'';
    const chosen=state[fish.sex==='F'?'mother':'father']===fish.id;
    item.pick.textContent=chosen?'✓ Genitore':fish.age<2?'Adulto tra '+(2-fish.age)+' mesi':fish.sex==='F'?'Scegli ♀':'Scegli ♂';
    item.pick.setAttribute('aria-pressed',String(chosen));
    const availability=BettaStore.selectionStatus(state,fish);
    const incompatible=!rosterView.brood&&!availability.allowed;
    item.card.classList.toggle('incompatible',incompatible);
    const showReason=!availability.allowed&&(!rosterView.brood||fish.age>=2);
    item.reason.textContent=showReason?availability.reason:'';
    item.reason.hidden=!showReason;
    item.pick.disabled=chosen||!availability.allowed;
    item.pick.hidden=!!rosterView.brood&&fish.age<2;
    item.pick.title=availability.allowed?'':availability.reason;
    if(!chosen&&!availability.allowed&&fish.age>=2)item.pick.textContent='Non disponibile';
    item.pick.classList.toggle('chosen',state[fish.sex==='F'?'mother':'father']===fish.id);
    if(roster.children[index]!==item.card) roster.insertBefore(item.card,roster.children[index]||null);
    if(!item.card.hidden)drawPreview(item.image,fish);
  });
}
function renderLog() {
  $('#log').replaceChildren(...state.log.map(text=>{
    const p=document.createElement('p'); p.textContent=text; return p;
  }));
}
function render() {
  state=appStore.getState();
  if(rosterView.brood&&!rosterView.brood.includes(state.selected))clearBrood();
  renderStage(); renderGenome(); renderParents(); renderForecast(); renderRoster(); renderLog();
  const status=appStore.getStatus();
  message(status.notice);
  $('#export-original').hidden=!status.blocked;
  if(status.blocked)$('.backup-menu').open=true;
}
appStore.subscribe(render);
// Bridge for the separately bundled 3D rooms.
window.bettaParents=parents;
window.bettaParams=genotypeParams;
window.bettaSelected=selected;
function clearBrood(){rosterView.brood=null;rosterView.broodName='';}
function showBrood(ids,name){
  rosterView.brood=ids;rosterView.broodName=name;
  setRosterFilter('all',true);appStore.select(ids[0]);
}
window.bettaApp={store:appStore,render,drawPreview,message,showBrood,clearBrood};
function setRosterFilter(filter,keepBrood=false){
  if(!keepBrood)clearBrood();
  rosterView.filter=filter;rosterView.query='';$('#fish-filter').value=filter;$('#fish-search').value='';renderRoster();
}
$('#fish-search').oninput=event=>{rosterView.query=event.target.value;renderRoster();};
$('#fish-filter').onchange=event=>{clearBrood();rosterView.filter=event.target.value;renderRoster();};
$('#fish-sort').onchange=event=>{rosterView.sort=event.target.value;renderRoster();};
$('#clear-filters').onclick=()=>setRosterFilter('all');
$('#show-all-fish').onclick=()=>setRosterFilter('all');
$('#clear-mother').onclick=()=>act(()=>appStore.clearParent('F'));
$('#clear-father').onclick=()=>act(()=>appStore.clearParent('M'));
$('#breed').onclick=()=>act(()=>{
  if(appStore.breed()){
    const fish=selected(),ids=state.fish.filter(f=>f.age===0&&JSON.stringify(f.parents)===JSON.stringify(fish.parents)).map(f=>f.id);
    showBrood(ids,'La nuova nidiata');
    $('#birth-nursery').dataset.fishId=fish.id;
    $('#birth-banner').hidden=false;
    message('Quattro piccoli sono arrivati nel vivaio. Apri la loro vasca o passa un mese per farli crescere.');
  }else message(appStore.breedingStatus().reason);
});
function advanceMonth(){act(()=>{
  const result=appStore.advance();
  message('Mese '+state.month+'. '+(result.matured?result.matured+' pesci sono diventati adulti. ':'')+(result.young?result.young+' piccoli stanno crescendo.':'Tutti gli esemplari sono adulti.'));
});}
$('#advance').onclick=advanceMonth;
$('#room-advance').onclick=advanceMonth;
$('#reset').onclick=()=>{
  if(confirm('Ricominciare con una coppia per ogni tipologia? La vasca attuale sarà sostituita.')) act(()=>{clearBrood();$('#birth-banner').hidden=true;appStore.reset();});
};
$('#open-notes').onclick=()=>$('#notes').showModal();
$('#export-tank').onclick=()=>act(()=>download(appStore.export(),'betta-vasca.json','application/json'));
$('#export-original').onclick=()=>act(()=>download(appStore.original()||'','betta-originale.txt','text/plain'));
$('#import-tank').onclick=()=>$('#import-file').click();
$('#import-file').onchange=async event=>{
  const file=event.target.files[0]; event.target.value='';
  if(!file) return;
  try {
    if(file.size>5*1024*1024) throw Error('Il file supera il limite di 5 MB.');
    const text=await file.text();
    const candidate=BettaStore.migrate(JSON.parse(text));
    if(!confirm('Importare '+candidate.fish.length+' pesci e sostituire la vasca attuale? Esporta prima una copia se vuoi conservarla.')) return;
    clearBrood();$('#birth-banner').hidden=true;appStore.import(text);
  } catch(error) { message('Importazione annullata: '+error.message); }
};
$('#export-fish').onclick=()=>act(()=>{
  const data=window.betta3d?.snapshot();
  if(!data) throw Error('Attendi che la vista 3D sia pronta.');
  const link=document.createElement('a'); link.href=data; link.download='betta-'+selected().id+'.png'; link.click();
});
render();
