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
  // Artistic phenotype from inherited pigment loci, not an established eye-color locus.
  // Seed fixes individual asymmetry; age and marble phase do not reroll the eyes.
  function eyes(fish) {
    const g=fish.genes,seed=Number(fish.seed)||0;
    const rand=n=>{const v=Math.sin(seed*.173+n*127.1)*43758.5453;return v-Math.floor(v);};
    const present=k=>(g[k]||'').includes(k);
    const marble=present('M')&&BettaSpecies.ornamental(fish);
    function color(n){
      if(!BettaSpecies.ornamental(fish))return rand(n)<.72?0:1;
      const r=rand(n);
      if((present('R')||present('N'))&&r<.18)return present('N')?5:4;
      if((present('T')||present('I')||present('V'))&&r<.58)return present('G')?3:2;
      return r<.80?0:1;
    }
    const left=color(1);let right=left;
    if(marble&&rand(2)<.62){const options=[0,1,2,3,6].filter(v=>v!==left);right=options[Math.floor(rand(3)*options.length)];}
    const accent=base=>base===2?6:2;
    return Object.freeze({eyeLeft:left,eyeRight:right,
      eyeAccentLeft:accent(left),eyeAccentRight:accent(right),
      eyeSectorLeft:marble&&rand(4)<.48?.22+rand(5)*.35:0,
      eyeSectorRight:marble&&rand(6)<.48?.22+rand(7)*.35:0});
  }
  function params(fish) {
    const signature=key(fish);
    if(cache.has(signature)) return cache.get(signature);
    const g=fish.genes;
    const result=Object.freeze({
      ...eyes(fish),
      alien:[...(g.V||'vv')].filter(a=>a==='V').length/2,
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
    if(window.FishCollection?.discus){const p=params(fish);return BettaTypes.colorName(fish)||['Discus · combinazione ereditata',p.red?'rosso':'blu/turchese',p.black?'pigmento scuro':'',p.marble?'disegno variabile':''].filter(Boolean).join(' · ');}
    if(!BettaSpecies.ornamental(fish)) return BettaSpecies.description(fish);
    const p=params(fish),parts=[];
    if(p.black<.9&&p.red<.9&&p.copper<.9&&p.white<1&&p.orange<1&&p.purple<1&&p.gold<1&&p.green<1)parts.push(['steel blue','royal blue','turchese'][p.blue]);
    if(p.black) parts.unshift('nero');
    for(const [key,label] of [["alien","reticolo Alien"],["white","bianco"],["orange","arancio"],["purple","lavanda"],["gold","giallo corpo"],["speckle","puntinato"],["samurai","samurai"],["rim","bordo blu"],["bicolor","bicolore"],["green","verde"],['red','rosso'],['marble','marble'],['butterfly','butterfly'],['copper','rame'],['dragon','dragon'],['yellow','pinne gialle']]) {
      if(p[key]) parts.push(label);
    }
    const catalogName=BettaTypes.colorName(fish);
    if(catalogName)parts.unshift(catalogName);
    const eyeNames=['neri','marroni','blu','verdi','rossi','arancio','argentei'];
    parts.push(p.eyeLeft===p.eyeRight?'occhi '+eyeNames[p.eyeLeft]:'occhi '+eyeNames[p.eyeLeft]+' / '+eyeNames[p.eyeRight]);
    if(p.eyeSectorLeft||p.eyeSectorRight)parts.push('iride multicolore');
    return parts.join(' · ');
  }
  return {params,describe,key,eyes};
})();
