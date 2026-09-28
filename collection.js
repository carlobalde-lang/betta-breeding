'use strict';
// Collection-specific data; both collections use the same store, career and UI.
window.FishCollection={id:window.fishCollection||'betta',discus:window.fishCollection==='discus',tanks:window.fishCollection==='discus'?8:24};
if(FishCollection.discus){
 const types=window.BettaTypes;
 const catalog=[['royal','Blue Diamond',{B:'Bb',I:'II'}],['turquoise','Turchese rosso',{B:'bb'}],['red','Rosso',{R:'RR',I:'ii'}],['black','Bruno striato',{K:'KK',I:'ii'}],['marble','Pigeon Blood',{M:'MM'}],['koi','Leopard',{M:'MM',R:'RR',K:'Kk',I:'ii'}]];
 types.colors.splice(0,types.colors.length,...catalog.map(([id,name,genes])=>({id,name,genes})).sort((a,b)=>a.name.localeCompare(b.name,'it')));
 types.forms.splice(0,types.forms.length,{id:'halfmoon',name:'Discus',description:'Corpo alto e discoidale, pinne raccolte.',genes:{L:'ll',A:'aa',H:'hh'}});
 types.name=()=> 'Discus';
 const ancestry=()=>({discus:1});
 window.BettaSpecies={ids:['discus'],names:{discus:'Discus'},ancestry,normalize:f=>{f.species='discus';f.ancestry=ancestry();return f;},ornamental:()=>true,label:()=> 'Discus',weights:()=>({imbellis:0,hendra:0}),offspring:()=>({species:'discus',ancestry:ancestry()}),compatibility:(m,d)=>({allowed:!!(m&&d),ornamental:!!(m&&d),message:'Quattro piccoli con alleli ereditati da entrambi i genitori nel modello del gioco.'}),description:()=> 'Discus · modello illustrativo',specimen:(id,sex)=>types.specimen('halfmoon','random',sex)};
 FishCollection.convertLegacy=(old,mode)=>{
  if(old?.collection!=='discus'||old.mode!==mode||old.version!==1||!Array.isArray(old.fish)||!old.fish.length)throw Error('Salvataggio Discus precedente non valido.');
  const coats={blue:'royal',turquoise:'turquoise',red:'red',wild:'black',pigeon:'marble',leopard:'koi'};
  const fish=old.fish.map(f=>{if(!coats[f.coat]||!Number.isInteger(f.tank)||f.tank<0||f.tank>=8)throw Error('Vasca precedente non valida.');return {...types.specimen('halfmoon',coats[f.coat],f.sex),id:f.id,name:f.name,seed:f.seed,age:f.age,parents:f.parents?.length?f.parents:null,gen:f.parents?.length?1:0,species:'discus',ancestry:ancestry()};});
  const career=mode==='career'?BettaCareer.initial():null;if(career)career.cash=old.balance;
  return {schemaVersion:2,collection:'discus',mode,fish,month:old.month,nextFishId:old.nextId,selected:fish[0].id,mother:null,father:null,tankNames:Object.fromEntries(Object.entries(old.names||{}).filter(([,v])=>v.trim()).map(([i,v])=>['discus-'+i,v])),tankAssignments:Object.fromEntries(old.fish.map(f=>[f.id,'discus-'+f.tank])),...(career?{career}:{}),log:['Allevamento Discus trasferito nel sistema completo.']};
 };
}
