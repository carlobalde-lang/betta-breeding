'use strict';
window.BettaAppearance = (() => {
  const cache = new Map();
  const has = (genes,locus) => genes[locus].includes(locus);
  function key(fish) {
    return JSON.stringify([
      BettaTypes.colorLoci.map(k => fish.genes[k]),
      Object.keys(BettaTypes.labels).map(k => fish.form[k]),
      fish.seed, fish.phase || 0, BettaSpecies.weights(fish)
    ]);
  }
  function params(fish) {
    const signature=key(fish);
    if(cache.has(signature)) return cache.get(signature);
    const g=fish.genes;
    const result=Object.freeze({
      blue:g.B==='BB'?0:g.B==='Bb'?1:2,
      dragon:has(g,'O')?1:0, yellow:has(g,'Y')?1:0,
      marble:has(g,'M')?(g.M==='MM'?1:.72):0,
      butterfly:has(g,'F')?(g.F==='FF'?1:.76):0,
      iridescence:has(g,'I')?(g.I==='II'?1:.72):.24,
      black:has(g,'K')?(g.K==='KK'?1:.62):0,
      red:has(g,'R')?(g.R==='RR'?1:.68):0,
      copper:has(g,'C')?(g.C==='CC'?1:.66):0,
      spots:has(g,'M')?.53+.16*(fish.seed%7)/7:.12,
      contrast:has(g,'M')?.75:.31,
      frequency:has(g,'M')?2.6+(fish.seed%5)*.28:1.5,
      seed:fish.seed, phase:fish.phase||0
    });
    cache.set(signature,result);
    if(cache.size>256) cache.delete(cache.keys().next().value);
    return result;
  }
  function describe(fish) {
    if(!BettaSpecies.ornamental(fish)) return BettaSpecies.description(fish);
    const p=params(fish),parts=[];
    if(p.black<.9&&p.red<.9&&p.copper<.9)parts.push(['steel blue','royal blue','turchese'][p.blue]);
    if(p.black) parts.unshift('nero (linea non determinata)');
    for(const [key,label] of [['red','rosso'],['marble','marble'],['butterfly','butterfly'],['copper','rame'],['dragon','dragon'],['yellow','pinne gialle']]) {
      if(p[key]) parts.push(label);
    }
    return parts.join(' · ');
  }
  return {params,describe,key};
})();
