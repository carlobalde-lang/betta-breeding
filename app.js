'use strict';
const $ = selector => document.querySelector(selector);
const appStore = BettaStore.create({
  getItem: key => localStorage.getItem(key),
  setItem: (key,value) => localStorage.setItem(key,value)
});
let state = appStore.getState();
const labels = {B:'Blu',M:'Marble',F:'Butterfly',I:'Iridescenza',K:'Nero',R:'Rosso',C:'Rame',O:'Dragon (sim.)',Y:'Giallo pinne (sim.)'};
const rosterCards = new Map();
const rosterView={query:'',filter:'all',sort:'recent'};
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
  $('#fish-age').textContent = fish.age < 2 ? 'AVANNOTTO · ' + fish.age + ' MESI' : 'ADULTO · ' + fish.age + ' MESI';
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
  box.replaceChildren();
  if (!compatibility.ornamental) { box.textContent = compatibility.message; return; }
  const heading = document.createElement('strong');
  heading.textContent = 'Eredità supportata · stime del gioco';
  box.append(heading);
  for (const [label,value] of BettaTypes.forecast(mom,dad).filter(([label])=>['Pinne lunghe','Pinne corte','Doppia coda'].includes(label))) {
    const row=document.createElement('div'),name=document.createElement('span'),number=document.createElement('b');
    name.textContent=label; number.textContent=value+'%'; row.append(name,number); box.append(row);
  }
  const note=document.createElement('small');
  note.textContent='Dominanza delle pinne lunghe e recessività della doppia coda sono documentate. Le percentuali dipendono dagli alleli assegnati dal gioco, non da analisi del DNA. Corona, apertura, Dumbo e colori restano illustrativi: nessuna percentuale biologica affidabile da questi dati.';
  box.append(note);
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
    const anchor=selected(),candidate=state.fish.find(f=>f.id===fish.id);
    if(anchor.id===candidate.id)appStore.pick(candidate.id);
    else if(BettaStore.pairingStatus(state,anchor,candidate).allowed)
      appStore.choosePair(anchor.sex==='F'?anchor.id:candidate.id,anchor.sex==='M'?anchor.id:candidate.id);
    else return;
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
    const group=rosterView.filter;
    const filter=group==='all'||(group==='young'&&fish.age<2)||(group==='adult'&&fish.age>=2)
      ||(['F','M'].includes(group)&&fish.sex===group&&fish.age>=2)
      ||(group==='parents'&&[state.mother,state.father].includes(fish.id));
    return filter&&(!query||(fish.name+' '+BettaTypes.name(fish)+' #'+fish.id).toLocaleLowerCase('it').includes(query));
  };
  const ordered=[...state.fish].sort((a,b)=>rosterView.sort==='name'?a.name.localeCompare(b.name,'it')||a.id-b.id:rosterView.sort==='age'?a.age-b.age||b.id-a.id:b.id-a.id);
  const count=ordered.filter(matches).length;
  $('#roster-summary').textContent=count+' di '+state.fish.length+' esemplari';
  $('#roster-empty').hidden=count>0;
  ordered.forEach((fish,index)=>{
    let item=rosterCards.get(fish.id);
    if(!item) { item=createCard(fish); rosterCards.set(fish.id,item); }
    item.card.hidden=!matches(fish);
    item.card.classList.toggle('active',fish.id===state.selected);
    item.name.textContent=(fish.sex==='F'?'♀ ':'♂ ')+fish.name;
    item.detail.textContent=(fish.age<2?'Avannotto · '+fish.age+' mesi':'Gen. '+fish.gen)+' · '+BettaTypes.name(fish);
    item.detail.className=fish.age<2?'juvenile':'';
    const chosen=state[fish.sex==='F'?'mother':'father']===fish.id;
    item.pick.textContent=chosen?'✓ Genitore':fish.age<2?'Adulto tra '+(2-fish.age)+' mesi':fish.sex==='F'?'Scegli ♀':'Scegli ♂';
    item.pick.setAttribute('aria-pressed',String(chosen));
    const availability=BettaStore.pairingStatus(state,selected(),fish);
    const incompatible=fish.id!==state.selected&&!availability.allowed;
    item.card.classList.toggle('incompatible',incompatible);
    item.reason.textContent=incompatible?availability.reason:'';
    item.reason.hidden=!incompatible;
    item.pick.disabled=fish.age<2||incompatible;
    item.pick.title=incompatible?availability.reason:'';
    if(incompatible)item.pick.textContent='Non disponibile';
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
  renderStage(); renderGenome(); renderParents(); renderForecast(); renderRoster(); renderLog();
  const status=appStore.getStatus();
  message(status.notice);
  $('#export-original').hidden=!status.blocked;
  if(status.blocked)$('.backup-menu').open=true;
}
appStore.subscribe(render);
// Small read-only bridge for the separately bundled 3D view and morph controls.
window.bettaParents=parents;
window.bettaParams=genotypeParams;
window.bettaSelected=selected;
window.bettaApp={store:appStore,render,drawPreview,message};
function setRosterFilter(filter){
  rosterView.filter=filter;rosterView.query='';$('#fish-filter').value=filter;$('#fish-search').value='';renderRoster();
}
$('#fish-search').oninput=event=>{rosterView.query=event.target.value;renderRoster();};
$('#fish-filter').onchange=event=>{rosterView.filter=event.target.value;renderRoster();};
$('#fish-sort').onchange=event=>{rosterView.sort=event.target.value;renderRoster();};
$('#clear-filters').onclick=()=>setRosterFilter('all');
$('#clear-mother').onclick=()=>act(()=>appStore.clearParent('F'));
$('#clear-father').onclick=()=>act(()=>appStore.clearParent('M'));
$('#breed').onclick=()=>act(()=>{
  if(appStore.breed()){
    setRosterFilter('young');
    message('Nidiata nata: quattro piccoli. Li trovi nella vasca filtrata su Piccoli; saranno adulti tra due mesi di gioco.');
  }else message(appStore.breedingStatus().reason);
});
$('#advance').onclick=()=>act(()=>{
  const result=appStore.advance();
  message('Mese '+state.month+'. '+(result.matured?result.matured+' pesci sono diventati adulti. ':'')+(result.young?result.young+' piccoli stanno crescendo.':'Tutti gli esemplari sono adulti.'));
});
$('#reset').onclick=()=>{
  if(confirm('Ricominciare con una coppia per ogni tipologia? La vasca attuale sarà sostituita.')) act(()=>appStore.reset());
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
    appStore.import(text);
  } catch(error) { message('Importazione annullata: '+error.message); }
};
$('#export-fish').onclick=()=>act(()=>{
  const data=window.betta3d?.snapshot();
  if(!data) throw Error('Attendi che la vista 3D sia pronta.');
  const link=document.createElement('a'); link.href=data; link.download='betta-'+selected().id+'.png'; link.click();
});
render();
