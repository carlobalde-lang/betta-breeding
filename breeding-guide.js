'use strict';
window.BettaBreedingGuide=(()=>{
 const maskLoci=new Set(['K','R','T','N','J','C']);
 const targetCache=new Map();
 function target(id){if(!targetCache.has(id)){if(!BettaCareer.byId(id))throw Error('Livrea non valida.');targetCache.set(id,BettaTypes.specimen('halfmoon',id,'M'));}return targetCache.get(id);}
 function outcomes(a,b){const list=[];for(const x of a)for(const y of b)list.push([x,y].sort().join(''));return list;}
 // Exact probability of the album's visible phenotype, including hidden blue.
 function probability(m,d,id){
  if(!BettaSpecies.ornamental(m)||!BettaSpecies.ornamental(d))return 0;
  const goal=target(id),masked=[...maskLoci].some(k=>goal.genes[k]===k+k);let total=1,clear=1;
  for(const k of BettaTypes.colorLoci){if(k==='B')continue;const active=goal.genes[k].includes(k),choices=outcomes(m.genes[k],d.genes[k]);const allowed=choices.filter(g=>g.includes(k)===active);total*=allowed.length/4;clear*=allowed.filter(g=>!maskLoci.has(k)||g!==k+k).length/4;if(!total)return 0;}
  return masked?Math.max(0,total-clear):clear*outcomes(m.genes.B,d.genes.B).filter(g=>g===goal.genes.B).length/4;
 }
 function distance(f,id){const g=target(id).genes;return BettaTypes.colorLoci.reduce((sum,k)=>sum+(k==='B'?(f.genes.B===g.B?0:1):f.genes[k].includes(k)===g[k].includes(k)?0:1),0);}
 function plan(state,id,intermediates=true){
  const goal=target(id),fish=state.fish.filter(BettaSpecies.ornamental),groups={F:new Map(),M:new Map()};
  for(const f of fish){const key=JSON.stringify(f.genes),old=groups[f.sex].get(key),ready=BettaStore.parentStatus(state,f).allowed;if(!old||ready&&!BettaStore.parentStatus(state,old).allowed||ready===BettaStore.parentStatus(state,old).allowed&&f.age>old.age)groups[f.sex].set(key,f);}
  const profiles=sex=>[...groups[sex].values()].sort((a,b)=>distance(a,id)-distance(b,id)||a.id-b.id).slice(0,128),pairs=[];
  for(const m of profiles('F'))for(const d of profiles('M')){const p=probability(m,d,id);if(!p)continue;const status=BettaStore.pairingStatus(state,m,d);pairs.push({mother:m.id,father:d.id,probability:p,brood:1-(1-p)**4,ready:status.allowed,reason:status.reason||''});}
  pairs.sort((a,b)=>Number(b.ready)-Number(a.ready)||b.probability-a.probability||a.mother-b.mother||a.father-b.father);
  const missing=BettaTypes.colorLoci.filter(k=>goal.genes[k].includes(k)&&!fish.some(f=>f.genes[k].includes(k)));
  const donors=BettaTypes.colors.filter(c=>c.id!==id).map(c=>({id:c.id,supplies:missing.filter(k=>target(c.id).genes[k].includes(k))})).filter(c=>c.supplies.length).sort((a,b)=>b.supplies.length-a.supplies.length||distance(target(a.id),id)-distance(target(b.id),id)).slice(0,3);
  const steps=[];
  if(!pairs.length&&intermediates){for(const c of BettaTypes.colors){if(c.id===id||state.career.discoveries[c.id])continue;const next=plan(state,c.id,false);if(next.pairs[0]?.ready)steps.push({id:c.id,pair:next.pairs[0],distance:distance(target(c.id),id)});}steps.sort((a,b)=>a.distance-b.distance||b.pair.probability-a.pair.probability);}
  return {id,pairs:pairs.slice(0,3),missing,donors,steps:steps.slice(0,2),limited:groups.F.size>128||groups.M.size>128};
 }
 return {probability,plan};
})();
