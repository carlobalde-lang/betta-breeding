'use strict';
window.BettaAppearance = (() => {
  const cache = new Map();
  const has = (genes,locus) => genes[locus].includes(locus);
  function key(fish) {
    return JSON.stringify([
      BettaTypes.colorLoci.map(k => fish.genes[k]),
      Object.keys(BettaTypes.labels).map(k => fish.form[k]),
      fish.seed, fish.phase || 0, fish.sex, fish.age, BettaSpecies.weights(fish)
    ]);
  }
  function params(fish) {
    const signature=key(fish);
    if(cache.has(signature)) return cache.get(signature);
    const g=fish.genes;
    const result=Object.freeze({
      white:[...(g.T||'tt')].filter(a=>a==='T').length/2,orange:[...(g.N||'nn')].filter(a=>a==='N').length/2,purple:[...(g.P||'pp')].filter(a=>a==='P').length/2,gold:[...(g.J||'jj')].filter(a=>a==='J').length/2,speckle:[...(g.Q||'qq')].filter(a=>a==='Q').length/2,samurai:[...(g.U||'uu')].filter(a=>a==='U').length/2,rim:[...(g.Z||'zz')].filter(a=>a==='Z').length/2,bicolor:[...(g.X||'xx')].filter(a=>a==='X').length/2,green:[...(g.G||'gg')].filter(a=>a==='G').length/2,
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
      seed:fish.seed, phase:fish.phase||0,
      maturity:BettaTypes.development(fish).pigment,
      female:BettaTypes.development(fish).female
    });
    cache.set(signature,result);
    if(cache.size>256) cache.delete(cache.keys().next().value);
    return result;
  }
  function describe(fish) {
    if(!BettaSpecies.ornamental(fish)) return BettaSpecies.description(fish);
    const p=params(fish),parts=[];
    if(p.black<.9&&p.red<.9&&p.copper<.9&&p.white<1&&p.orange<1&&p.purple<1&&p.gold<1&&p.green<1)parts.push(['steel blue','royal blue','turchese'][p.blue]);
    if(p.black) parts.unshift('nero (linea non determinata)');
    for(const [key,label] of [["white","bianco"],["orange","arancio"],["purple","lavanda"],["gold","giallo corpo"],["speckle","puntinato"],["samurai","samurai"],["rim","bordo blu"],["bicolor","bicolore"],["green","verde"],['red','rosso'],['marble','marble'],['butterfly','butterfly'],['copper','rame'],['dragon','dragon'],['yellow','pinne gialle']]) {
      if(p[key]) parts.push(label);
    }
    return parts.join(' · ');
  }
  return {params,describe,key};
})();
