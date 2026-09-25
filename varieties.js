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
  const colorBase={B:'Bb',M:'mm',F:'ff',I:'Ii',K:'kk',R:'rr',C:'cc',O:'oo',Y:'yy'};
  const colorLoci=Object.keys(colorBase);
  const randomColor=(rng=Math.random)=>colors[Math.floor(rng()*colors.length)].id;
  function inheritColors(m,d,rng=Math.random){return Object.fromEntries(colorLoci.map(k=>[k,pair(m.genes[k][Math.floor(rng()*2)],d.genes[k][Math.floor(rng()*2)])]));}
  const labels={L:'Lunghezza',W:'Membrana',D:'Doppia coda',A:'Apertura A',H:'Apertura B',V:'Velo',S:'Punta',E:'Pettorali'};
  const dose=(pair,letter)=>[...pair].filter(x=>x===letter).length;
  const pair=(a,b)=>[a,b].sort().join('');
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
      veil:dose(g.V,'V')/2,spade:dose(g.S,'S')/2,dumbo:g.E==='ee'};
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
  function specimen(formId,colorId,sex,dumbo=false) {
    const form=forms.find(x=>x.id===formId)||forms[0];
    const color=colors.find(x=>x.id===(colorId==='random'?randomColor():colorId))||colors[0];
    return {name:color.name,sex,form:{...base,...form.genes,...(dumbo?{E:'ee'}:{})},
      genes:{...colorBase,...color.genes},
      seed:Math.floor(Math.random()*899999)+100000,age:4,gen:0,parents:null,phase:0};
  }
  return {forms,colors,colorLoci,randomColor,inheritColors,labels,normalize,traits,name,inherit,forecast,specimen};
})();
