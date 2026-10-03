'use strict';
const $ = selector => document.querySelector(selector);
const appStore = BettaStore.create({
  getItem: key => localStorage.getItem(key),
  setItem: (key,value) => localStorage.setItem(key,value)
},{mode:window.bettaMode||'creative'});
let state = appStore.getState();
const labels = {V:'Reticolo Alien (sim.)',T:'bianco (sim.)',N:'arancio (sim.)',P:'lavanda (sim.)',J:'giallo corpo (sim.)',Q:'puntinato (sim.)',U:'samurai (sim.)',Z:'bordo blu (sim.)',X:'bicolore (sim.)',G:'verde (sim.)',B:'Blu',M:'Marble',F:'Butterfly',I:'Iridescenza',K:'Nero',R:'Rosso',C:'Rame',O:'Dragon (sim.)',Y:'Giallo pinne (sim.)'};
const rosterCards = new Map();
const rosterView={query:'',filter:'all',coat:'all',sort:'recent',brood:null,broodName:''};
const selected = () => state.fish.find(f => f.id === state.selected) || state.fish[0];
const parents = () => [state.fish.find(f => f.id === state.mother),state.fish.find(f => f.id === state.father)];
const genotypeParams = BettaAppearance.params;
const phenotype = BettaAppearance.describe;
const fishLabel = fish => state.mode==='career' ? BettaCareer.displayName(fish) : fish.name;
const coatLabel = fish => !BettaSpecies.coatEnabled(fish)
  ? fish.species==='hybrid'?'Ibrida simulata':'Naturale · '+BettaSpecies.label(fish)
  : state.mode==='career' ? BettaCareer.coatName(fish) : BettaTypes.colorName(fish)||'Combinazione ereditata';
const colorLabel = fish => {
  const description=phenotype(fish),catalog=BettaTypes.colorName(fish);
  return catalog&&description.startsWith(catalog+' · ')?description.slice(catalog.length+3):description;
};

const roomStatus=document.createElement('p');roomStatus.id='room-action-status';roomStatus.className='room-toast';roomStatus.hidden=true;roomStatus.setAttribute('role','status');document.getElementById('room').append(roomStatus);let roomStatusTimer;
function message(text) {
  const notice=appStore.getStatus().notice;
  const content=notice&&text!==notice?[notice,text].filter(Boolean).join(' '):text;
  $('#app-status').textContent = content;
  $('#app-status').hidden = !content;roomStatus.textContent=content;roomStatus.hidden=!content;clearTimeout(roomStatusTimer);if(content)roomStatusTimer=setTimeout(()=>{roomStatus.hidden=true;},6000);
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
function observeFish(id){
  act(()=>{if(!state.fish.some(f=>f.id===id))return;appStore.select(id);if($('#laboratory').hidden)window.betta3d?.openLaboratory();const panel=$('#observation');if(innerWidth<=720||panel.getBoundingClientRect().top<0||panel.getBoundingClientRect().top>innerHeight*.6)panel.scrollIntoView({block:'start',behavior:'smooth'});});
}
const moveDialog=document.createElement('dialog');moveDialog.className='shelf-label-editor';moveDialog.id='fish-move-dialog';
moveDialog.innerHTML='<form><h2>Sposta pesce</h2><p class="move-current"></p><label for="fish-move-target">Destinazione</label><select id="fish-move-target"></select><p>Massimo 4 pesci per acquario. In carriera puoi esporre un adulto in negozio al prezzo standard.</p><p class="move-error" role="status"></p><button type="submit">Sposta qui</button><button type="button" class="move-cancel">Annulla</button></form>';
document.body.append(moveDialog);let movingId;
moveDialog.querySelector('.move-cancel').onclick=()=>moveDialog.close();
function openMoveFish(id){
 const current=appStore.getState(),fish=current.fish.find(f=>f.id===id);if(!fish)return;movingId=id;
 const housing=BettaStore.housing(current),target=$('#fish-move-target'),listed=current.career?.listings.some(l=>l.fishId===id),home=housing.assignments[id];target.replaceChildren();
 moveDialog.querySelector('h2').textContent='Sposta '+fishLabel(fish)+' · #'+id;
 moveDialog.querySelector('.move-current').textContent=listed?'Pesce in vendita: ritiralo prima dal negozio.':'Attualmente nell’acquario #'+BettaStore.tankNumber(home);
 for(const [title,slots] of [['Stanza 1 · Allevamento',housing.breeders],['Stanza 2 · Crescita',[...housing.nursery,...Array.from({length:window.FishCollection?.tanks||24},(_,i)=>({key:'nursery-'+(housing.nursery.length+i),name:'Vasca '+(housing.nursery.length+i+1),fish:[]}))]]]){
  const group=document.createElement('optgroup');group.label=title;for(const slot of slots){const option=document.createElement('option');option.value=slot.key;option.textContent='#'+BettaStore.tankNumber(slot.key)+' · '+(current.tankNames?.[slot.key]||slot.name)+' · '+slot.fish.length+'/4';option.disabled=slot.fish.length>=4&&slot.key!==home;group.append(option);}target.append(group);
 }
 if(current.mode==='career'){const shop=document.createElement('optgroup');shop.label='Stanza 3 · Negozio';const option=document.createElement('option');option.value='shop';option.textContent='In vendita · prezzo standard '+BettaCareer.value(fish,current.month)+' ◈';option.disabled=fish.age<4||current.career.listings.length>=current.career.shopSlots*4;shop.append(option);target.append(shop);}
 if(home)target.value=home;target.disabled=!!listed;moveDialog.querySelector('[type="submit"]').disabled=!!listed;moveDialog.querySelector('.move-error').textContent='';moveDialog.showModal();target.focus();
}
moveDialog.querySelector('form').onsubmit=event=>{event.preventDefault();try{const key=$('#fish-move-target').value;if(key==='shop'){const current=appStore.getState(),fish=current.fish.find(f=>f.id===movingId);appStore.career('list',{fishId:movingId,price:BettaCareer.value(fish,current.month)});}else appStore.moveFish(movingId,key);clearBrood();render();moveDialog.close();message(key==='shop'?'Pesce esposto in negozio al prezzo standard.':'Pesce spostato nell’acquario #'+BettaStore.tankNumber(key)+'.');}catch(e){moveDialog.querySelector('.move-error').textContent=e.message;}};
const moveSelected=document.createElement('button');moveSelected.id='move-selected-fish';moveSelected.className='secondary';moveSelected.textContent='Sposta in un acquario';moveSelected.onclick=()=>openMoveFish(selected().id);$('#export-fish').parentElement.append(moveSelected);
const renameDialog=document.createElement('dialog');renameDialog.className='shelf-label-editor';renameDialog.innerHTML='<form><h2>Rinomina esemplare</h2><label for="fish-rename-input">Nome</label><input id="fish-rename-input" maxlength="120" required><p class="rename-error" role="status"></p><button type="submit">Salva nome</button><button type="button" class="rename-cancel">Annulla</button></form>';document.body.append(renameDialog);
const deleteSelected=document.createElement('button');deleteSelected.id='delete-selected-fish';deleteSelected.type='button';deleteSelected.className='secondary';deleteSelected.textContent='Elimina pesce';moveSelected.after(deleteSelected);
deleteSelected.onclick=()=>{
  const fish=selected(),english=window.FishI18n?.language==='en';
  if(!confirm(english?'Delete '+fish.name+' (#'+fish.id+') from the breeding collection? This cannot be undone.':'Eliminare '+fish.name+' (#'+fish.id+') dall’allevamento? Questa azione non può essere annullata.'))return;
  act(()=>{appStore.removeFish(fish.id);message(english?'Fish deleted.':'Pesce eliminato.');});
};
const renameButton=document.createElement('button');renameButton.type='button';renameButton.className='text-button';renameButton.textContent='Modifica nome';renameButton.onclick=()=>{renameDialog.querySelector('input').value=selected().name;renameDialog.querySelector('.rename-error').textContent='';renameDialog.showModal();renameDialog.querySelector('input').select();};$('#fish-name').after(renameButton);
renameDialog.querySelector('.rename-cancel').onclick=()=>renameDialog.close();
renameDialog.querySelector('form').onsubmit=event=>{event.preventDefault();try{appStore.renameFish(selected().id,renameDialog.querySelector('input').value);renameDialog.close();}catch(error){renameDialog.querySelector('.rename-error').textContent=error.message;}};
const stage=$('#observation');stage.prepend(stage.querySelector('.fish-info'));stage.append($('#collection-panel'));
$('#open-genome').onclick=()=>$('#genome-dialog').showModal();
const heroFish=$('.hero-fish');
const fullscreenTools=document.createElement('div');fullscreenTools.className='observation-fullscreen-tools';
const fullscreenButton=document.createElement('button');fullscreenButton.type='button';fullscreenButton.id='observation-fullscreen';fullscreenButton.textContent='⛶';fullscreenButton.title='Apri a schermo intero';fullscreenButton.setAttribute('aria-label','Apri pesce a schermo intero');
const backdropLabel=document.createElement('label');backdropLabel.className='observation-backdrop';backdropLabel.textContent='Sfondo ';
const backdropSelect=document.createElement('select');backdropSelect.id='observation-backdrop';backdropSelect.setAttribute('aria-label','Sfondo della vista 3D');
for(const [value,label] of [['water','Acqua'],['night','Notte'],['light','Chiaro'],['black','Nero']]){const option=document.createElement('option');option.value=value;option.textContent=label;backdropSelect.append(option);}
backdropLabel.append(backdropSelect);fullscreenTools.append(backdropLabel,fullscreenButton);heroFish.append(fullscreenTools);
function fullscreenActive(){return document.fullscreenElement===heroFish||heroFish.classList.contains('fullscreen-fallback');}
function syncFullscreen(){const active=fullscreenActive();heroFish.classList.toggle('observation-expanded',active);fullscreenButton.title=active?'Esci dallo schermo intero':'Apri a schermo intero';fullscreenButton.setAttribute('aria-label',fullscreenButton.title);}
fullscreenButton.onclick=async()=>{if(fullscreenActive()){if(document.fullscreenElement===heroFish)await document.exitFullscreen();else heroFish.classList.remove('fullscreen-fallback');syncFullscreen();return;}
 try{if(heroFish.requestFullscreen)await heroFish.requestFullscreen();else heroFish.classList.add('fullscreen-fallback');}catch{heroFish.classList.add('fullscreen-fallback');}syncFullscreen();};
document.addEventListener('fullscreenchange',syncFullscreen);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&heroFish.classList.contains('fullscreen-fallback')){heroFish.classList.remove('fullscreen-fallback');syncFullscreen();}});
backdropSelect.onchange=()=>{heroFish.dataset.backdrop=backdropSelect.value;};heroFish.dataset.backdrop='water';
const observationNav=document.createElement('nav');observationNav.className='observation-nav';observationNav.setAttribute('aria-label','Scorri gli esemplari osservati');
const previousFish=document.createElement('button'),nextFish=document.createElement('button');
previousFish.id='observation-prev';nextFish.id='observation-next';
for(const [button,symbol,label] of [[previousFish,'←','Pesce precedente'],[nextFish,'→','Pesce successivo']]){
  button.type='button';button.className='observation-arrow';button.textContent=symbol;button.setAttribute('aria-label',label);observationNav.append(button);
}
$('.hero-fish').append(observationNav);
function observationIds(){return [...document.querySelectorAll('#roster .fish-card:not([hidden])')].map(card=>Number(card.dataset.fishId));}
function observationTarget(offset){
  const ids=observationIds(),index=ids.indexOf(state.selected);
  return ids.length<2?null:ids[index<0?(offset>0?0:ids.length-1):(index+offset+ids.length)%ids.length];
}
function updateObservationNav(){
  for(const [button,offset,label] of [[previousFish,-1,'Pesce precedente'],[nextFish,1,'Pesce successivo']]){
    const id=observationTarget(offset),fish=state.fish.find(item=>item.id===id);
    button.disabled=!fish;button.setAttribute('aria-label',fish?label+': '+fishLabel(fish):label);
  }
}
previousFish.onclick=()=>{const id=observationTarget(-1);if(id!==null)observeFish(id);};
nextFish.onclick=()=>{const id=observationTarget(1);if(id!==null)observeFish(id);};
const zoomControl=document.createElement('label');zoomControl.className='roster-zoom';zoomControl.innerHTML='<span>Dimensione schede <output for="roster-zoom-range"></output></span><input id="roster-zoom-range" type="range" min="180" max="520" step="20" value="260" aria-label="Dimensione delle schede e delle anteprime dei pesci">';
$('#roster').before(zoomControl);
const zoomRange=zoomControl.querySelector('input'),zoomOutput=zoomControl.querySelector('output');
function setRosterZoom(value){
 const size=Math.max(180,Math.min(520,Number(value)||260)),roster=$('#roster');
 const preview=Math.round(64+(size-180)*206/340);
 roster.style.setProperty('--fish-card-width',size+'px');
 roster.style.setProperty('--fish-preview-width',preview+'px');
 roster.style.setProperty('--fish-preview-height',Math.round(preview*.75)+'px');
 roster.classList.toggle('zoom-max',size===520);
 zoomRange.value=size;zoomOutput.value=Math.round((size-180)/340*100)+'%';
}
setRosterZoom(localStorage.getItem('fishchromia-roster-zoom'));
zoomRange.oninput=()=>{setRosterZoom(zoomRange.value);localStorage.setItem('fishchromia-roster-zoom',zoomRange.value);};
function renderStage() {
  const fish = selected();
  deleteSelected.disabled=state.fish.length<=1;
  deleteSelected.title=deleteSelected.disabled?'Conserva almeno un pesce nell’allevamento.':'';
  window.betta3d?.setFish(fish);
  $('#season').textContent = 'MESE ' + String(state.month).padStart(2,'0');
  $('#count').textContent = state.fish.length + ' ESEMPLARI';
  $('#generation').textContent = 'GEN. ' + Math.max(...state.fish.map(f => f.gen));
  $('#fish-number').textContent = '#' + fish.id + ' · ' + (fish.gen ? 'GENERAZIONE ' + fish.gen : 'FONDATORE');
  const dev=BettaTypes.development(fish);
  $('#fish-age').textContent = dev.stage.toUpperCase()+' · '+fish.age+' MESI DI GIOCO';
  $('#fish-development').textContent=dev.label+' · taglia '+Math.round(dev.size*100)+'%';
  $('#fish-name').textContent = fishLabel(fish);
  $('#fish-form').textContent = 'Livrea: '+coatLabel(fish);
  $('#fish-traits').textContent = 'Colori: '+colorLabel(fish);
  const family=$('#fish-family');family.replaceChildren();
  if(!fish.parents)family.textContent='Fondatore · nessun genitore registrato.';
  else{family.append('Genitori: ');fish.parents.forEach((id,i)=>{if(i)family.append(' × ');const parent=state.fish.find(f=>f.id===id),archived=state.career?.archive.find(f=>f.id===id),name=parent||archived;const label=name?name.name+' (#'+id+')':'#'+id;if(parent){const link=document.createElement('button');link.className='fish-name-link';link.textContent=label;link.onclick=()=>observeFish(id);family.append(link);}else family.append(label);});}
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
  const ornamental = BettaSpecies.coatEnabled(fish);
  $('#seed-label').textContent = 'SEED ' + fish.seed;
  $('#color-genome-title').textContent = ornamental ? 'FATTORI CROMATICI DEL GIOCO' : 'SPECIE / ORIGINE';
  $('#form-genome-title').hidden = !ornamental;
  $('#form-genes').hidden = !ornamental;
  $('#shader-data').hidden = true;
  if (!ornamental) {
    $('#genes').textContent = BettaSpecies.label(fish) + ' · ' + BettaSpecies.description(fish);
    return;
  }
  const relevant=Object.fromEntries(Object.entries(fish.genes).filter(([key,pair])=>key==='B'||pair.includes(key)));
  $('#color-genome-title').textContent='FATTORI CROMATICI DELL’ESEMPLARE';
  geneList($('#genes'), relevant, labels);
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
      const image=document.createElement('img');image.className='parent-preview';drawPreview(image,fish);const observe=document.createElement('button');observe.className='parent-observe';observe.type='button';observe.setAttribute('aria-label','Osserva '+fishLabel(fish)+' #'+fish.id);observe.setAttribute('aria-pressed',String(state.selected===fish.id));observe.onclick=()=>{observeFish(fish.id);$(selector+' .parent-observe')?.focus({preventScroll:true});};slot.append(observe);observe.append(image);
      const name=document.createElement('strong');name.textContent=fishLabel(fish);observe.append(name);
      detail.textContent=BettaTypes.name(fish)+' · #'+fish.id;
    }else{
      const choose=document.createElement('button');choose.className='pick';choose.textContent='Scegli dalla vasca';
      choose.onclick=()=>{setRosterFilter(selector==='#mother-slot'?'F':'M');$('#collection-panel').scrollIntoView({block:'start'});$('#fish-filter').focus();};
      slot.append(choose);
    }
    if(fish)slot.querySelector('.parent-observe').append(detail);else slot.append(detail);
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
  if(window.FishCollection?.discus){for(const color of BettaTypes.colors){const probability=BettaBreedingGuide.probability(mom,dad,color.id)*100;const row=document.createElement('p');row.textContent=color.name+': '+new Intl.NumberFormat('it',{maximumFractionDigits:2}).format(probability)+'%';box.append(row);}const note=document.createElement('small');note.textContent='Probabilità delle livree riconosciute dal gioco. I piccoli possono combinare altri tratti; modello genetico semplificato, non validato per i discus.';box.append(note);return;}
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
  const coat=document.createElement('div'); coat.className='coat-badge';
  const name=document.createElement('button'),detail=document.createElement('small'),reason=document.createElement('small');reason.className='pair-reason';
  name.className='fish-name-link';name.onclick=()=>observeFish(fish.id);
  info.append(name,detail,reason);
  const actions=document.createElement('div'); actions.className='card-actions';
  const study=document.createElement('button'); study.className='pick'; study.textContent='Osserva';
  study.onclick=()=>observeFish(fish.id);
  const pick=document.createElement('button'); pick.className='pick';
  pick.onclick=()=>act(()=>{
    const candidate=state.fish.find(f=>f.id===fish.id);
    if(!BettaStore.selectionStatus(state,candidate).allowed)return;
    appStore.pick(candidate.id);
    if(innerWidth<=720)$('#breeding-panel').scrollIntoView({block:'start'});
  });
  const preview=document.createElement('button');preview.className='fish-preview-control';preview.setAttribute('aria-label','Osserva '+fishLabel(fish)+' #'+fish.id);preview.onclick=()=>observeFish(fish.id);preview.append(image);
  const move=document.createElement('button');move.className='pick move-fish';move.textContent='Sposta';move.onclick=()=>openMoveFish(fish.id);
  actions.append(study,pick,move); card.append(preview,coat,info,actions);
  return {card,image,name,detail,coat,pick,reason};
}
function renderRoster() {
  const ids=new Set(state.fish.map(f=>f.id));
  for(const [id,item] of rosterCards) if(!ids.has(id)) { item.card.remove(); rosterCards.delete(id); }
  const roster=$('#roster');
  const coats=[...new Set(state.fish.map(coatLabel))].sort((a,b)=>a.localeCompare(b,'it'));
  const coatSelect=$('#coat-filter');
  coatSelect.replaceChildren(new Option('Tutte le livree','all'),...coats.map(coat=>new Option(coat,coat)));
  if(rosterView.coat!=='all'&&!coats.includes(rosterView.coat))rosterView.coat='all';
  coatSelect.value=rosterView.coat;
  const query=rosterView.query.trim().toLocaleLowerCase('it');
  const matches=fish=>{
    if(rosterView.brood&&!rosterView.brood.includes(fish.id))return false;
    const group=rosterView.filter;
    const filter=group==='all'||(group==='young'&&fish.age<2)||(group==='adult'&&fish.age>=2)
      ||(['F','M'].includes(group)&&fish.sex===group&&fish.age>=2)
      ||(group==='parents'&&[state.mother,state.father].includes(fish.id));
    return filter&&(rosterView.coat==='all'||coatLabel(fish)===rosterView.coat)&&(!query||(fishLabel(fish)+' '+BettaTypes.name(fish)+' #'+fish.id).toLocaleLowerCase('it').includes(query));
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
    item.name.textContent=(fish.sex==='F'?'♀ ':'♂ ')+fishLabel(fish);
    item.detail.textContent=BettaTypes.development(fish).stage+' · '+fish.age+' mesi · '+BettaTypes.name(fish);
    item.coat.textContent=coatLabel(fish);
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
  updateObservationNav();
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
window.bettaApp={observeFish,store:appStore,render,drawPreview,message,showBrood,clearBrood};
function setRosterFilter(filter,keepBrood=false){
  if(!keepBrood)clearBrood();
  rosterView.filter=filter;rosterView.coat='all';rosterView.query='';$('#fish-filter').value=filter;$('#fish-search').value='';renderRoster();
}
$('#fish-search').oninput=event=>{rosterView.query=event.target.value;renderRoster();};
$('#coat-filter').onchange=event=>{rosterView.coat=event.target.value;renderRoster();};
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
  const mode=state.mode==='career'?'carriera':'creativa';
  const question=window.FishI18n?.language==='en'?'Restart '+(state.mode==='career'?'career':'creative')+' mode? Only this save will be replaced.':'Ricominciare la modalità '+mode+'? Solo questo salvataggio sarà sostituito.';
  if(confirm(question)) act(()=>{clearBrood();$('#birth-banner').hidden=true;appStore.reset();});
};
$('#open-notes').onclick=()=>$('#notes').showModal();
$('#export-tank').onclick=()=>act(()=>download(appStore.export(),'betta-'+state.mode+'.json','application/json'));
$('#export-original').onclick=()=>act(()=>download(appStore.original()||'','betta-originale.txt','text/plain'));
$('#import-tank').onclick=()=>$('#import-file').click();
$('#import-file').onchange=async event=>{
  const file=event.target.files[0]; event.target.value='';
  if(!file) return;
  try {
    if(file.size>5*1024*1024) throw Error('Il file supera il limite di 5 MB.');
    const text=await file.text();
    const candidate=BettaStore.migrate(JSON.parse(text));
    const question=window.FishI18n?.language==='en'?'Import '+candidate.fish.length+' fish and replace the current tank? Export a copy first if you want to keep it.':'Importare '+candidate.fish.length+' pesci e sostituire la vasca attuale? Esporta prima una copia se vuoi conservarla.';
    if(!confirm(question)) return;
    clearBrood();$('#birth-banner').hidden=true;appStore.import(text);
  } catch(error) { message('Importazione annullata: '+error.message); }
};
$('#export-fish').onclick=()=>act(()=>{
  const data=window.betta3d?.snapshot();
  if(!data) throw Error('Attendi che la vista 3D sia pronta.');
  const link=document.createElement('a'); link.href=data; link.download='betta-'+selected().id+'.png'; link.click();
});
render();
