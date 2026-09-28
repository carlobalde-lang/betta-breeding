'use strict';
document.getElementById('color-model-note').textContent=`${BettaTypes.colors.length} livree incrociabili, di cui sette originali di fantasia. Le regole cromatiche e i loro limiti sono descritti in «Modello genetico e fonti».`;
const colorResearchNote=document.createElement('p');
colorResearchNote.innerHTML='Il modello è ispirato alla ricerca, distinguendo gli effetti documentati da quelli ancora ipotetici. La distribuzione del blu sul corpo segue la direzione osservata per <i>alkal2l</i>; l’associazione con <i>bco1l</i> suggerisce una variazione della tonalità rossa. Nel gioco sono ipotetici l’intensità degli effetti, le interazioni fra rame, verde e oro e i motivi delle sette livree originali. Le sigle I, R e N sono fattori inventati, non geni reali. La resa dipende anche da seed, età e angolo di osservazione. <a href="https://www.frontiersin.org/journals/genome-editing/articles/10.3389/fgeed.2023.1167093/full" target="_blank" rel="noreferrer">Studio sperimentale ↗</a> · <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC8906746/" target="_blank" rel="noreferrer">Studio genomico ↗</a>';
document.getElementById('notes').querySelector('.sources').before(colorResearchNote);
const catalog=$('#catalog'),grid=$('#type-grid'),controls=$('.catalog-controls');
const colorSelect=$('#catalog-color'),sexSelect=$('#catalog-sex'),dumboInput=$('#catalog-dumbo');
const isDiscus=!!window.FishCollection?.discus;
const randomOption=document.createElement('option');randomOption.value='random';randomOption.textContent='Casuale · ogni esemplare';colorSelect.append(randomOption);
for(const color of BettaTypes.colors){const option=document.createElement('option');option.value=color.id;option.textContent=color.name+(color.fantasy?' · Fantasia':'');colorSelect.append(option)}
let catalogForm=null,catalogColor=null,catalogRandomColor=BettaTypes.randomColor();
let catalogSeed=Math.floor(Math.random()*899999)+100000,seedRefresh,step='forms';
const seedLabel=document.createElement('label');seedLabel.className='catalog-seed';seedLabel.textContent='Seed del pesce';
const seedControls=document.createElement('span');seedControls.className='catalog-seed-controls';
const seedInput=document.createElement('input');seedInput.id='catalog-seed';seedInput.type='number';seedInput.min='0';seedInput.max='9999999';seedInput.step='1';seedInput.value=String(catalogSeed);seedInput.setAttribute('aria-label','Seed del pesce');
const rerollSeed=document.createElement('button');rerollSeed.type='button';rerollSeed.className='secondary';rerollSeed.textContent='↻';rerollSeed.title='Nuovo seed';rerollSeed.setAttribute('aria-label','Genera un nuovo seed');
seedControls.append(seedInput,rerollSeed);seedLabel.append(seedControls);
if(window.bettaMode==='creative')controls.append(seedLabel);
const back=document.createElement('button');back.type='button';back.className='secondary catalog-back';back.textContent='← Cambia tipologia';back.hidden=true;controls.before(back);
const title=$('#catalog-title'),intro=title.nextElementSibling,note=$('#color-model-note'),selection=$('#catalog-selection'),add=$('#add-specimen');
if(!isDiscus){colorSelect.closest('label').remove();$('#catalog-species').closest('label').remove();}
const speciesChoices=[
 {id:'imbellis',name:'Betta imbellis',description:'Sagoma Imbellis e tutte le livree del gioco.'},
 {id:'hendra',name:'Betta hendra',description:'Sagoma Hendra e tutte le livree del gioco.'}
];
const catalogChoices=[...BettaTypes.forms,...(isDiscus?[]:speciesChoices)];

function seedIsValid(){return seedInput.value!==''&&Number.isSafeInteger(Number(seedInput.value))&&Number(seedInput.value)>=0&&Number(seedInput.value)<=9999999;}
function updateSelection(){
 add.disabled=!seedIsValid()||(!isDiscus&&(step!=='colors'||!catalogColor));
 if(isDiscus)return;
 if(step==='forms'){selection.textContent='Scegli una tipologia per continuare.';return;}
 const form=catalogChoices.find(item=>item.id===catalogForm);
 selection.textContent=catalogColor?`${form.name} · ${BettaTypes.colors.find(item=>item.id===catalogColor).name} · ${sexSelect.value==='F'?'Femmina':'Maschio'}`:`${form.name} · scegli una livrea.`;
}
function previewFish(formId,colorId,sex=sexSelect.value,dumbo=dumboInput.checked){
 const species=speciesChoices.find(item=>item.id===formId);
 const fish=BettaTypes.specimen(species?'plakat':formId,colorId,sex,dumbo);
 if(species){fish.species=species.id;fish.ancestry=Object.fromEntries(BettaSpecies.ids.map(id=>[id,id===species.id?1:0]));fish.styledCoat=true;}
 fish.seed=catalogSeed;return fish;
}
function makeCard(fish,label,caption,attribute,value,pressed,onClick){
 const card=document.createElement('button');card.type='button';card.className='type-card'+(attribute==='coatId'?' coat-card':'');card.dataset[attribute]=value;card.setAttribute('aria-pressed',String(pressed));
 const image=document.createElement('img');image.className='fish-thumbnail';
 const heading=document.createElement('strong');heading.textContent=label;
 const description=document.createElement('small');description.textContent=caption;
 card.append(image,heading,description);grid.append(card);drawPreview(image,fish);card.onclick=onClick;
}
function renderCatalog(){
 grid.replaceChildren();
 if(isDiscus){
  const colorId=colorSelect.value==='random'?catalogRandomColor:colorSelect.value;
  for(const form of BettaTypes.forms)makeCard(previewFish(form.id,colorId),form.name,form.description,'formId',form.id,form.id===catalogForm,()=>{catalogForm=form.id;renderCatalog()});
  catalogForm||=BettaTypes.forms[0].id;
  selection.textContent=`Discus · ${BettaTypes.colors.find(item=>item.id===colorId)?.name||'Livrea casuale'} · ${sexSelect.value==='F'?'Femmina':'Maschio'}`;
  add.disabled=!seedIsValid();return;
 }
 const colorsStep=step==='colors';back.hidden=!colorsStep;controls.hidden=!colorsStep;note.hidden=!colorsStep;
 title.textContent=colorsStep?'02 / Scegli la livrea.':'01 / Scegli la tipologia.';
 intro.textContent=colorsStep?(speciesChoices.some(item=>item.id===catalogForm)?'Imbellis e Hendra possono indossare tutte le livree: interpretazione creativa del gioco. Tocca una scheda per scegliere.':'La forma scelta appare in tutte le livree. Tocca una scheda per scegliere il colore del nuovo pesce.'):'Scegli una forma delle pinne oppure Imbellis o Hendra. Nel passaggio successivo vedrai tutte le livree disponibili.';
 if(!colorsStep){
  for(const form of catalogChoices){
   const fish=previewFish(form.id,speciesChoices.some(item=>item.id===form.id)?'turquoise':'royal','M',false);
   makeCard(fish,form.name,form.description,'formId',form.id,false,()=>{catalogForm=form.id;catalogColor=null;step='colors';renderCatalog();catalog.scrollTop=0});
  }
 }else{
  for(const color of BettaTypes.colors){
   makeCard(previewFish(catalogForm,color.id),color.name,color.fantasy?'Livrea originale Fishchromia · fantasia':'Livrea ereditabile','coatId',color.id,color.id===catalogColor,()=>{
    catalogColor=color.id;
    for(const card of grid.children)card.setAttribute('aria-pressed',String(card.dataset.coatId===catalogColor));
    updateSelection();
   });
  }
 }
 updateSelection();
}
function setCatalogSeed(value,immediate=false){
 const valid=Number.isSafeInteger(value)&&value>=0&&value<=9999999;
 seedInput.setCustomValidity(valid?'':'Inserisci un seed intero tra 0 e 9999999.');
 clearTimeout(seedRefresh);
 if(valid){catalogSeed=value;if(immediate)renderCatalog();else seedRefresh=setTimeout(()=>{if(catalog.open)renderCatalog();},180);}
 updateSelection();
}
seedInput.oninput=()=>setCatalogSeed(seedInput.value===''?NaN:Number(seedInput.value));
rerollSeed.onclick=()=>{const value=Math.floor(Math.random()*899999)+100000;seedInput.value=String(value);setCatalogSeed(value,true)};
back.onclick=()=>{step='forms';catalogColor=null;renderCatalog();catalog.scrollTop=0};
$('#open-catalog').onclick=()=>{
 clearTimeout(seedRefresh);catalogRandomColor=BettaTypes.randomColor();
 seedInput.value=String(catalogSeed);seedInput.setCustomValidity('');catalogForm=isDiscus?BettaTypes.forms[0].id:null;catalogColor=null;step='forms';
 catalog.showModal();renderCatalog();catalog.scrollTop=0;
};
for(const control of [colorSelect,sexSelect,dumboInput])control.onchange=()=>renderCatalog();
add.onclick=()=>{
 if(add.disabled)return;
 const colorId=isDiscus?(colorSelect.value==='random'?catalogRandomColor:colorSelect.value):catalogColor;
 const fish=previewFish(catalogForm,colorId);BettaTypes.normalize(fish);
 act(()=>{appStore.add(fish);catalog.close()});
};
