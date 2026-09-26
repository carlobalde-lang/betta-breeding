'use strict';
let catalogForm='halfmoon';
const colorSelect=$('#catalog-color');
const randomOption=document.createElement('option');randomOption.value='random';randomOption.textContent='Casuale · ogni esemplare';colorSelect.append(randomOption);
let catalogRandomColor=BettaTypes.randomColor();
let catalogSeed=Math.floor(Math.random()*899999)+100000;
const previewColor=()=>colorSelect.value==='random'?catalogRandomColor:colorSelect.value;
const classic=document.createElement('optgroup'),guide=document.createElement('optgroup');classic.label='Palette classiche';guide.label='Guida Nice Betta · 36 varianti';colorSelect.append(classic,guide);
for(const color of BettaTypes.colors){const option=document.createElement('option');option.value=color.id;option.textContent=color.name;(color.guide?guide:classic).append(option)}
function updateCatalog(){
 const grid=$('#type-grid');grid.replaceChildren();
 const natural=$('#catalog-species').value!=='splendens';grid.hidden=natural;colorSelect.disabled=natural;$('#catalog-dumbo').disabled=natural;
 if(natural){$('#catalog-selection').textContent=BettaSpecies.names[$('#catalog-species').value]+' · livrea naturale illustrativa';return;}
 for(const form of BettaTypes.forms){
  const card=document.createElement('button');card.type='button';card.className='type-card';card.setAttribute('aria-pressed',String(form.id===catalogForm));
  const canvas=document.createElement('img');canvas.className='fish-thumbnail';
  const title=document.createElement('strong');title.textContent=form.name;
  const caption=document.createElement('small');caption.textContent=form.description;
  card.append(canvas,title,caption);grid.append(card);
  const fish=BettaTypes.specimen(form.id,previewColor(),$('#catalog-sex').value,$('#catalog-dumbo').checked);fish.seed=catalogSeed;
  drawPreview(canvas,fish);
  card.onclick=()=>{catalogForm=form.id;updateCatalog()};
 }
 const fish=BettaTypes.specimen(catalogForm,previewColor(),$('#catalog-sex').value,$('#catalog-dumbo').checked);
 $('#catalog-selection').textContent=`${BettaTypes.name(fish)} · ${fish.name} · ${fish.sex==='F'?'Femmina':'Maschio'}`;
}
$('#open-catalog').onclick=()=>{catalogRandomColor=BettaTypes.randomColor();catalogSeed=Math.floor(Math.random()*899999)+100000;$('#catalog').showModal();updateCatalog()};
for(const selector of ['#catalog-color','#catalog-sex','#catalog-dumbo','#catalog-species'])$(selector).onchange=updateCatalog;
$('#add-specimen').onclick=()=>{
 const species=$('#catalog-species').value;
 const fish=species==='splendens'?BettaTypes.specimen(catalogForm,previewColor(),$('#catalog-sex').value,$('#catalog-dumbo').checked):BettaSpecies.specimen(species,$('#catalog-sex').value);
 fish.seed=catalogSeed;
 BettaTypes.normalize(fish);
 act(()=>{appStore.add(fish);$('#catalog').close();});
};
