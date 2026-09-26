'use strict';
// Simulation symbols, not names of molecular genes. See RESEARCH.md.
window.BettaTypes = (() => {
  const base = {L:'LL',W:'WW',D:'DD',A:'AA',H:'Hh',V:'vv',S:'ss',E:'EE'};
  const forms = [
    {id:'halfmoon',name:'Halfmoon',description:'Coda a ventaglio: apertura illustrata di 180°.',genes:{}},
    {id:'overhalfmoon',name:'Over Halfmoon',description:'Ventaglio oltre i 180° nel modello del gioco.',genes:{H:'HH'}},
    {id:'plakat',name:'Plakat',description:'Pinne corte e coda compatta.',genes:{L:'ll',A:'aa',H:'hh'}},
    {id:'hmpk',name:'Halfmoon Plakat',description:'Pinne corte con coda ad ampio ventaglio.',genes:{L:'ll'}},
    {id:'crowntail',name:'Crowntail',description:'Raggi sporgenti e membrana ridotta: una coda a corona.',genes:{W:'ww'}},
    {id:'doubletail',name:'Doubletail',description:'Coda divisa in due lobi; il tratto può restare nascosto nei portatori.',genes:{D:'dd'}},
    {id:'veiltail',name:'Veiltail',description:'Coda lunga, asimmetrica e ricadente.',genes:{V:'VV',A:'aa',H:'hh'}},
    {id:'delta',name:'Delta',description:'Ventaglio triangolare meno aperto dell’Halfmoon.',genes:{A:'Aa',H:'hh'}},
    {id:'spade',name:'Spadetail',description:'Coda compatta con una punta centrale, resa stilizzata.',genes:{L:'ll',S:'SS',A:'aa',H:'hh'}}
  ];
  const colors = [
    {id:'royal',name:'Royal blue',genes:{B:'Bb'}},
    {id:'steel',name:'Steel blue',genes:{B:'BB'}},
    {id:'turquoise',name:'Turchese',genes:{B:'bb'}},
    {id:'red',name:'Rosso',genes:{R:'RR',I:'ii'}},
    {id:'black',name:'Nero',genes:{K:'KK',I:'ii'}},
    {id:'copper',name:'Copper',genes:{C:'CC',I:'II'}},
    {id:'marble',name:'Marble',genes:{M:'MM'}},
    {id:'koi',name:'Koi',genes:{M:'MM',R:'RR',I:'ii'}},
    {id:'galaxy',name:'Koi Galaxy',genes:{M:'MM',R:'Rr',I:'II',C:'Cc'}},
    {id:'butterfly',name:'Butterfly',genes:{F:'FF'}},
    {id:'dragon',name:'Dragon',genes:{O:'OO',R:'RR',I:'ii'}},
    {id:'mustard',name:'Mustard Gas',genes:{Y:'YY',B:'Bb',I:'II'}}
  ];
  // Commercial varieties combine simulation factors; these are not molecular genotypes.
  const guideColors=[
  {
    "id": "avatar",
    "name": "Blue Black Star Avatar",
    "guide": true,
    "genes": {
      "K": "KK",
      "I": "II",
      "Q": "QQ"
    }
  },
  {
    "id": "gold-dragon",
    "name": "Gold Dragon",
    "guide": true,
    "genes": {
      "O": "OO",
      "Y": "YY",
      "C": "Cc"
    }
  },
  {
    "id": "royal-lavender",
    "name": "Metallic Purple / Royal Lavender",
    "guide": true,
    "genes": {
      "P": "PP",
      "I": "II",
      "C": "Cc"
    }
  },
  {
    "id": "blue-mustard",
    "name": "Blue Mustard Gas",
    "guide": true,
    "genes": {
      "Y": "YY",
      "I": "II",
      "X": "XX"
    }
  },
  {
    "id": "red-copper",
    "name": "Red Copper",
    "guide": true,
    "genes": {
      "C": "CC",
      "R": "RR",
      "X": "XX"
    }
  },
  {
    "id": "black-copper",
    "name": "Black Copper Dragon",
    "guide": true,
    "genes": {
      "C": "CC",
      "K": "KK",
      "O": "Oo",
      "X": "XX"
    }
  },
  {
    "id": "copper-mustard",
    "name": "Copper Mustard / Copper Yellow",
    "guide": true,
    "genes": {
      "C": "CC",
      "Y": "YY",
      "X": "XX"
    }
  },
  {
    "id": "super-red",
    "name": "Super Red",
    "guide": true,
    "genes": {
      "R": "RR",
      "I": "ii"
    }
  },
  {
    "id": "guide-turquoise",
    "name": "Turquoise",
    "guide": true,
    "genes": {
      "B": "bb",
      "I": "II"
    }
  },
  {
    "id": "white-opaque",
    "name": "White Opaque",
    "guide": true,
    "genes": {
      "T": "TT",
      "I": "ii"
    }
  },
  {
    "id": "shadow-samurai",
    "name": "Shadow Black Star Samurai",
    "guide": true,
    "genes": {
      "K": "KK",
      "U": "Uu",
      "Q": "QQ",
      "I": "II"
    }
  },
  {
    "id": "super-gold",
    "name": "Super Gold",
    "guide": true,
    "genes": {
      "J": "JJ",
      "Y": "YY",
      "C": "Cc",
      "I": "II"
    }
  },
  {
    "id": "dark-armageddon",
    "name": "Dark Armageddon Meteor",
    "guide": true,
    "genes": {
      "K": "KK",
      "N": "NN",
      "Q": "QQ",
      "X": "XX"
    }
  },
  {
    "id": "super-yellow",
    "name": "Super Yellow",
    "guide": true,
    "genes": {
      "J": "JJ",
      "Y": "YY",
      "I": "ii"
    }
  },
  {
    "id": "armageddon",
    "name": "Armageddon / Meteor / Vanda",
    "guide": true,
    "genes": {
      "N": "NN",
      "Q": "QQ",
      "I": "ii"
    }
  },
  {
    "id": "black-samurai",
    "name": "Black Samurai",
    "guide": true,
    "genes": {
      "K": "KK",
      "U": "UU",
      "I": "ii"
    }
  },
  {
    "id": "blue-rim",
    "name": "Blue Rim",
    "guide": true,
    "genes": {
      "T": "TT",
      "Z": "ZZ",
      "M": "Mm",
      "I": "ii"
    }
  },
  {
    "id": "fancy-macaw",
    "name": "Fancy Macaw",
    "guide": true,
    "genes": {
      "B": "bb",
      "J": "Jj",
      "Y": "Yy",
      "M": "MM",
      "G": "GG",
      "I": "II"
    }
  },
  {
    "id": "candy-phoenix",
    "name": "Candy Phoenix",
    "guide": true,
    "genes": {
      "N": "NN",
      "P": "Pp",
      "M": "MM",
      "Q": "QQ"
    }
  },
  {
    "id": "blue-dragon",
    "name": "Blue Dragon",
    "guide": true,
    "genes": {
      "O": "OO",
      "I": "II"
    }
  },
  {
    "id": "blue-fire",
    "name": "Blue on Fire",
    "guide": true,
    "genes": {
      "R": "RR",
      "X": "XX",
      "I": "II"
    }
  },
  {
    "id": "red-tiger",
    "name": "Red Tiger",
    "guide": true,
    "genes": {
      "R": "RR",
      "K": "Kk",
      "M": "MM",
      "I": "ii"
    }
  },
  {
    "id": "copper-gold",
    "name": "Copper Gold",
    "guide": true,
    "genes": {
      "C": "CC",
      "I": "II"
    }
  },
  {
    "id": "pink-snow",
    "name": "Pink Lavender Snow",
    "guide": true,
    "genes": {
      "P": "PP",
      "T": "Tt",
      "O": "OO",
      "I": "ii"
    }
  },
  {
    "id": "hell-boy",
    "name": "Hell Boy",
    "guide": true,
    "genes": {
      "K": "KK",
      "R": "RR",
      "X": "XX",
      "I": "ii"
    }
  },
  {
    "id": "guide-steel",
    "name": "Steel blue",
    "guide": true,
    "genes": {
      "B": "BB",
      "I": "II"
    }
  },
  {
    "id": "gordon-koi",
    "name": "Gordon Avatar Koi",
    "guide": true,
    "genes": {
      "K": "KK",
      "R": "Rr",
      "M": "MM",
      "Q": "QQ",
      "I": "II"
    }
  },
  {
    "id": "alien-mustard",
    "name": "Green Alien Mustard Gas",
    "guide": true,
    "genes": {
      "G": "GG",
      "Y": "YY",
      "I": "II",
      "X": "XX"
    }
  },
  {
    "id": "alien-warrior",
    "name": "Green Alien Mustard Warrior",
    "guide": true,
    "genes": {
      "G": "GG",
      "K": "Kk",
      "Y": "YY",
      "Q": "Qq",
      "I": "II",
      "X": "XX"
    }
  },
  {
    "id": "devil-candy",
    "name": "Multicolor Devil Candy",
    "guide": true,
    "genes": {
      "K": "Kk",
      "N": "NN",
      "R": "Rr",
      "M": "MM",
      "P": "Pp",
      "I": "II"
    }
  },
  {
    "id": "green-peacock",
    "name": "Green Peacock",
    "guide": true,
    "genes": {
      "K": "KK",
      "G": "GG",
      "Q": "QQ",
      "I": "II"
    }
  },
  {
    "id": "sky-goose",
    "name": "Green White sky Goose",
    "guide": true,
    "genes": {
      "T": "TT",
      "G": "GG",
      "M": "MM",
      "I": "II"
    }
  },
  {
    "id": "magical-pink",
    "name": "Magical pink blue series",
    "guide": true,
    "genes": {
      "P": "PP",
      "M": "MM",
      "O": "Oo",
      "I": "ii"
    }
  },
  {
    "id": "frozen",
    "name": "The Frozen",
    "guide": true,
    "genes": {
      "T": "TT",
      "G": "GG",
      "Q": "QQ",
      "I": "ii"
    }
  },
  {
    "id": "red-phoenix",
    "name": "Red Phoenix",
    "guide": true,
    "genes": {
      "R": "RR",
      "T": "Tt",
      "M": "MM",
      "I": "ii"
    }
  },
  {
    "id": "yin-yang",
    "name": "Yin Yang Dragon",
    "guide": true,
    "genes": {
      "K": "KK",
      "O": "OO",
      "I": "II"
    }
  }
];
  colors.push(...guideColors);
  const colorBase={B:'Bb',M:'mm',F:'ff',I:'Ii',K:'kk',R:'rr',C:'cc',O:'oo',Y:'yy',T:'tt',N:'nn',P:'pp',J:'jj',Q:'qq',U:'uu',Z:'zz',X:'xx',G:'gg'};
  const colorLoci=Object.keys(colorBase);
  const randomColor=(rng=Math.random)=>colors[Math.floor(rng()*colors.length)].id;
  function inheritColors(m,d,rng=Math.random){return Object.fromEntries(colorLoci.map(k=>[k,pair(m.genes[k][Math.floor(rng()*2)],d.genes[k][Math.floor(rng()*2)])]));}
  const labels={L:'Lunghezza',W:'Membrana',D:'Doppia coda',A:'Apertura A',H:'Apertura B',V:'Velo',S:'Punta',E:'Pettorali'};
  const dose=(pair,letter)=>[...pair].filter(x=>x===letter).length;
  const pair=(a,b)=>[a,b].sort().join('');
  // Game months, not a calibrated biological growth curve. No new saved fields.
  function development(f) {
    const age=Math.max(0,Number.isFinite(f.age)?f.age:4);
    const progress=Math.min(1,age/4),smooth=progress*progress*(3-2*progress);
    const female=f.sex==='F'?smooth:0;
    return {progress:smooth,juvenile:1-smooth,female,
      size:.28+.72*Math.pow(progress,.65),
      finScale:(.26+.74*smooth)*(1-.40*female),
      pigment:.20+.80*smooth,
      stage:age<1?'Avannotto':age<2?'Giovane':age<4?'Adulto in crescita':'Adulto',
      label:(f.sex==='F'?'Femmina':'Maschio')+(age<2?' · sesso assegnato dal gioco':'')};
  }
  function normalize(f) {
    window.BettaSpecies?.normalize(f);
    f.form={...base,...f.form};
    f.genes={...colorBase,...f.genes};
    return f;
  }
  function traits(f) {
    const g={...base,...f.form};
    const spread=dose(g.A,'A')+dose(g.H,'H');
    return {...(window.BettaSpecies?.weights(f)||{}),short:g.L==='ll',crown:g.W==='ww'?1:g.W==='Ww'?.35:0,
      split:g.D==='dd',carrier:g.D==='Dd',spread,angle:120+spread*20,
      veil:dose(g.V,'V')/2,spade:dose(g.S,'S')/2,dumbo:g.E==='ee',development:development(f)};
  }
  function name(f) {
    if(window.BettaSpecies&&!window.BettaSpecies.ornamental(f))return window.BettaSpecies.label(f);
    const t=traits(f);const parts=[];
    if(t.split)parts.push('Doubletail');
    if(t.crown)parts.push(t.crown===1?'Crowntail':'Combtail');
    if(t.spade>=.5)parts.push('Spadetail');
    else if(t.veil>=.5)parts.push('Veiltail');
    else if(t.spread>=3)parts.push(t.spread===4?'Over Halfmoon':'Halfmoon');
    else if(!t.crown&&!t.split)parts.push(t.spread===2?'Super Delta':t.spread===1?'Delta':t.short?'':'Roundtail');
    if(t.short)parts.push('Plakat');
    if(t.dumbo)parts.push('Dumbo');
    return parts.filter(Boolean).join(' · ');
  }
  function inherit(m,d,rng=Math.random) {
    return Object.fromEntries(Object.keys(base).map(k=>[k,pair(m.form[k][Math.floor(rng()*2)],d.form[k][Math.floor(rng()*2)])]));
  }
  function probability(a,b,test) {
    let hits=0;for(const x of a)for(const y of b)if(test(pair(x,y)))hits++;
    return hits*25;
  }
  function forecast(m,d) {
    return [
      ['Pinne lunghe',probability(m.form.L,d.form.L,g=>g!=='ll')],
      ['Pinne corte',probability(m.form.L,d.form.L,g=>g==='ll')],
      ['Coda a corona',probability(m.form.W,d.form.W,g=>g==='ww')],
      ['Coda a pettine',probability(m.form.W,d.form.W,g=>g==='Ww')],
      ['Doppia coda',probability(m.form.D,d.form.D,g=>g==='dd')],
      ['Pettorali Dumbo',probability(m.form.E,d.form.E,g=>g==='ee')]
    ];
  }
  // Exact weighted enumeration, using the same allele pairs as inherit().
  function distribution(a,b) {
    const result=new Map();
    for(const x of a)for(const y of b){const g=pair(x,y);result.set(g,(result.get(g)||0)+.25);}
    return [...result];
  }
  const forecastCache=new Map();
  function predict(m,d) {
    const signature=JSON.stringify([m.form,d.form,m.genes,d.genes]);
    if(forecastCache.has(signature))return forecastCache.get(signature);
    const formLoci=Object.keys(base),outcomes=new Map(),apertures=new Map();
    function visit(index,form,weight){
      if(index<formLoci.length){
        const k=formLoci[index];
        for(const [g,p] of distribution(m.form[k],d.form[k]))visit(index+1,{...form,[k]:g},weight*p);
        return;
      }
      const fish={form},label=name(fish),t=traits(fish);
      outcomes.set(label,(outcomes.get(label)||0)+weight*100);
      apertures.set(t.angle,(apertures.get(t.angle)||0)+weight*100);
    }
    visit(0,{},1);
    const factors=colorLoci.filter(k=>k!=='B').map(k=>({locus:k,
      active:probability(m.genes[k],d.genes[k],g=>g.includes(k)),
      double:probability(m.genes[k],d.genes[k],g=>g===k+k)}));
    const blue=distribution(m.genes.B,d.genes.B).map(([g,p])=>[
      g==='BB'?'Steel blue':g==='Bb'?'Royal blue':'Turchese',p*100]);
    // Same masking threshold as Appearance.describe: RR, KK or CC suppress the blue label.
    const blueVisible=['R','K','C','T','N','P','J','G'].reduce((p,k)=>p*(1-probability(m.genes[k],d.genes[k],g=>g===k+k)/100),1);
    const result={forms:[...outcomes].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])),
      apertures:[...apertures].sort((a,b)=>a[0]-b[0]),factors,blue,
      visibleBlue:blue.map(([label,p])=>[label,p*blueVisible]),
      maskedBlue:100*(1-blueVisible),
      modifiers:[['Velo',probability(m.form.V,d.form.V,g=>g.includes('V'))],
        ['Punta',probability(m.form.S,d.form.S,g=>g.includes('S'))]],
      carrier:probability(m.form.D,d.form.D,g=>g==='Dd')};
    // Callers receive immutable cached data; no fish or saved state is mutated.
    const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
    freeze(result);forecastCache.set(signature,result);
    if(forecastCache.size>32)forecastCache.delete(forecastCache.keys().next().value);
    return result;
  }
  function specimen(formId,colorId,sex,dumbo=false) {
    const form=forms.find(x=>x.id===formId)||forms[0];
    const color=colors.find(x=>x.id===(colorId==='random'?randomColor():colorId))||colors[0];
    return {name:color.name,sex,form:{...base,...form.genes,...(dumbo?{E:'ee'}:{})},
      genes:{...colorBase,...color.genes},
      seed:Math.floor(Math.random()*899999)+100000,age:4,gen:0,parents:null,phase:0};
  }
  return {forms,colors,guideColors,colorLoci,randomColor,inheritColors,labels,normalize,traits,name,inherit,forecast,predict,distribution,development,specimen};
})();
