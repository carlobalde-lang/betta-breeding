'use strict';
for(const selector of ['#morph-from','#morph-to'])for(const form of BettaTypes.forms){
 const option=document.createElement('option');option.value=form.id;option.textContent=form.name;$(selector).append(option);
}
$('#morph-to').value='crowntail';
let morphParents=null;
function previewMorph(){
 if(!window.betta3d)return;
 const from=morphParents?.[0]||BettaTypes.specimen($('#morph-from').value,'royal','F');
 const to=morphParents?.[1]||BettaTypes.specimen($('#morph-to').value,'royal','M');
 const amount=Number($('#morph-slider').value)/100;
 $('#morph-value').textContent=Math.round(amount*100)+'%';
 $('#morph-status').textContent=`Anteprima visiva: ${BettaTypes.name(from)} → ${BettaTypes.name(to)}. I geni del pesce non cambiano.`;
 window.betta3d.previewMorph(from,to,amount);
}
for(const selector of ['#morph-from','#morph-to'])$(selector).onchange=()=>{morphParents=null;previewMorph()};
$('#morph-slider').oninput=previewMorph;
$('#morph-parents').onclick=()=>{
 const parents=window.bettaParents();
 if(!parents.every(Boolean)){$('#morph-status').textContent='Seleziona una femmina e un maschio dalla vasca per confrontare le loro forme.';return;}
 morphParents=parents;previewMorph();
};
window.bettaMorphResetUI=()=>{morphParents=null;$('#morph-slider').value='50';$('#morph-value').textContent='—';$('#morph-status').textContent='La forma visualizzata segue i geni del pesce selezionato.';};
$('#morph-reset').onclick=()=>window.betta3d?.resetMorph();
