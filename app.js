'use strict';
const $ = selector => document.querySelector(selector);
const appStore = BettaStore.create({
  getItem: key => localStorage.getItem(key),
  setItem: (key,value) => localStorage.setItem(key,value)
});
let state = appStore.getState();
const labels = {B:'Blu',M:'Marble',F:'Butterfly',I:'Iridescenza',K:'Nero',R:'Rosso',C:'Rame',O:'Dragon (sim.)',Y:'Giallo pinne (sim.)'};
const rosterCards = new Map();
const selected = () => state.fish.find(f => f.id === state.selected) || state.fish[0];
const parents = () => [state.fish.find(f => f.id === state.mother),state.fish.find(f => f.id === state.father)];
const genotypeParams = BettaAppearance.params;
const phenotype = BettaAppearance.describe;

function message(text) {
  $('#app-status').textContent = text;
  $('#app-status').hidden = !text;
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
  $('#color-genome-title').textContent = ornamental ? 'EREDITÀ DEL COLORE' : 'SPECIE / ORIGINE';
  $('#form-genome-title').hidden = !ornamental;
  $('#form-genes').hidden = !ornamental;
  $('#shader-data').hidden = !ornamental;
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
    if(fish) slot.append(fish.name);
    slot.append(detail);
  }
}
function renderForecast() {
  const [mom,dad] = parents();
  const compatibility = BettaSpecies.compatibility(mom,dad);
  $('#breed').disabled = !(compatibility.allowed && mom.sex==='F' && dad.sex==='M' && mom.id!==dad.id && mom.age>=2 && dad.age>=2);
  $('#breed-hint').textContent = compatibility.message;
  $('#relationship').textContent = BettaStore.relationship(mom,dad);
  const box = $('#cross-forecast');
  box.replaceChildren();
  if (!compatibility.ornamental) { box.textContent = compatibility.message; return; }
  const heading = document.createElement('strong');
  heading.textContent = 'Probabilità della forma delle pinne';
  box.append(heading);
  for (const [label,value] of BettaTypes.forecast(mom,dad)) {
    const row=document.createElement('div'),name=document.createElement('span'),number=document.createElement('b');
    name.textContent=label; number.textContent=value+'%'; row.append(name,number); box.append(row);
  }
  const note=document.createElement('small');
  note.textContent='Percentuali del modello del gioco, solo per le pinne. I colori vengono ereditati, ma non mostriamo probabilità scientifiche per la livrea. Quattro nascite non garantiscono queste proporzioni.';
  box.append(note);
}
function createCard(fish) {
  const card=document.createElement('div'); card.className='fish-card'; card.dataset.fishId=fish.id;
  const image=document.createElement('img'); image.className='fish-thumbnail';
  const info=document.createElement('div'); info.className='card-info';
  const name=document.createElement('strong'),detail=document.createElement('small');
  info.append(name,detail);
  const actions=document.createElement('div'); actions.className='card-actions';
  const study=document.createElement('button'); study.className='pick'; study.textContent='Osserva';
  study.onclick=()=>act(()=>appStore.select(fish.id));
  const pick=document.createElement('button'); pick.className='pick';
  pick.onclick=()=>act(()=>appStore.pick(fish.id));
  actions.append(study,pick); card.append(image,info,actions);
  return {card,image,name,detail,pick};
}
function renderRoster() {
  const ids=new Set(state.fish.map(f=>f.id));
  for(const [id,item] of rosterCards) if(!ids.has(id)) { item.card.remove(); rosterCards.delete(id); }
  const roster=$('#roster');
  state.fish.forEach((fish,index)=>{
    let item=rosterCards.get(fish.id);
    if(!item) { item=createCard(fish); rosterCards.set(fish.id,item); }
    item.card.classList.toggle('active',fish.id===state.selected);
    item.name.textContent=(fish.sex==='F'?'♀ ':'♂ ')+fish.name;
    item.detail.textContent=(fish.age<2?'Avannotto · '+fish.age+' mesi':'Gen. '+fish.gen)+' · '+BettaTypes.name(fish);
    item.detail.className=fish.age<2?'juvenile':'';
    item.pick.textContent=fish.sex==='F'?'Seleziona ♀':'Seleziona ♂';
    item.pick.disabled=fish.age<2;
    item.pick.classList.toggle('chosen',state[fish.sex==='F'?'mother':'father']===fish.id);
    if(roster.children[index]!==item.card) roster.insertBefore(item.card,roster.children[index]||null);
    drawPreview(item.image,fish);
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
}
appStore.subscribe(render);
// Small read-only bridge for the separately bundled 3D view and morph controls.
window.bettaParents=parents;
window.bettaParams=genotypeParams;
window.bettaSelected=selected;
window.bettaApp={store:appStore,render,drawPreview,message};
$('#breed').onclick=()=>act(()=>appStore.breed());
$('#advance').onclick=()=>act(()=>appStore.advance());
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
