'use strict';
window.BettaSpecies=(()=>{
 const ids=['splendens','imbellis','hendra'];
 const names={splendens:'Betta splendens',imbellis:'Betta imbellis',hendra:'Betta hendra'};
 function ancestry(f){
  if(f?.ancestry){const a=Object.fromEntries(ids.map(k=>[k,Number.isFinite(f.ancestry[k])?Math.max(0,f.ancestry[k]):0]));const sum=Object.values(a).reduce((x,y)=>x+y,0);if(sum>0)return Object.fromEntries(ids.map(k=>[k,a[k]/sum]));}
  const species=ids.includes(f?.species)?f.species:'splendens';return Object.fromEntries(ids.map(k=>[k,k===species?1:0]));
 }
 function classify(a){return ids.find(k=>a[k]>1-1e-9)||'hybrid';}
 function normalize(f){f.ancestry=ancestry(f);f.species=classify(f.ancestry);delete f.modelId;return f;}
 function ornamental(f){return ancestry(f).splendens>1-1e-9;}
 function label(f){const a=ancestry(f),id=classify(a);return id==='hybrid'?'Ibrido · splendens × imbellis':names[id];}
 function weights(f){const a=ancestry(f);return {imbellis:a.imbellis,hendra:a.hendra};}
 function offspring(m,d){if(!compatibility(m,d).allowed)throw new Error('Incrocio non documentato o genitori mancanti');const a=ancestry(m),b=ancestry(d),next=Object.fromEntries(ids.map(k=>[k,(a[k]+b[k])/2]));return {species:classify(next),ancestry:next};}
 function compatibility(m,d){
  if(!m||!d)return {allowed:false,message:'Seleziona una femmina e un maschio.'};
  const a=ancestry(m),b=ancestry(d),h=a.hendra+b.hendra;
  if(classify(a)==='hybrid'||classify(b)==='hybrid')return {allowed:false,message:'Riproduzione degli ibridi disabilitata: nessuna prova specifica verificata per questa generazione o reincrocio.'};
  if(h>1e-9&&!(a.hendra>1-1e-9&&b.hendra>1-1e-9))return {allowed:false,message:'Incrocio non disponibile: non abbiamo evidenze sufficienti per Hendra × splendens/imbellis.'};
  if(ornamental(m)&&ornamental(d))return {allowed:true,ornamental:true,message:'Quattro piccoli con tratti ereditati nel modello del gioco.'};
  if(classify(a)===classify(b)&&classify(a)!=='hybrid')return {allowed:true,message:'Riproduzione della stessa specie. Quattro nascite nel gioco; livrea adulta illustrativa.'};
  return {allowed:true,hybrid:true,message:'Ibridazione splendens × imbellis documentata. Consentita soltanto la prima generazione; i figli ibridi non sono riproduttori nel gioco.'};
 }
 function specimen(id,sex){
  const f=window.BettaTypes.specimen('plakat','turquoise',sex);f.name=names[id];f.species=id;f.ancestry=Object.fromEntries(ids.map(k=>[k,k===id?1:0]));return f;
 }
 function description(f){const a=ancestry(f);if(classify(a)==='hybrid')return 'Aspetto ibrido simulato · quote genealogiche attese: '+Math.round(a.splendens*100)+'% splendens / '+Math.round(a.imbellis*100)+'% imbellis';return a.hendra>.99?'Livrea naturale illustrativa · verde-blu con barre opercolari rosso-oro':'Livrea naturale illustrativa · iridescenza verde-blu e mezzaluna caudale rossa';}
 return {ids,names,ancestry,normalize,ornamental,label,weights,offspring,compatibility,specimen,description};
})();
