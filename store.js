'use strict';
window.BettaStore = (() => {
  const VERSION = 2;
  const isDiscus=!!window.FishCollection?.discus, tanksPerRoom=isDiscus?8:24;
  const KEY = 'fishchromia-creative-v1';
  const clone = value => JSON.parse(JSON.stringify(value));
  const integer = (n, min = 0) => Number.isSafeInteger(n) && n >= min;
  const formBase = window.BettaTypes.specimen('halfmoon', 'royal', 'F').form;
  const colorBase = window.BettaTypes.specimen('halfmoon', 'royal', 'F').genes;
  const defaultFishName=f=>[window.BettaTypes.name(f)||'Betta',f.sex==='F'?'femmina':'maschio',f.id].join(' ');
  const tankKey=key=>typeof key==='string'&&((isDiscus&&/^discus-[0-7]$/.test(key))||[...window.BettaTypes.forms.map(f=>f.id),'dumbo','imbellis','hendra'].includes(key.replace(/-male$/,''))||/^(nursery|shop)-[0-9]{1,4}$/.test(key));
  function tankNames(value={}){
    if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length>3024)throw Error('Targhette non valide.');
    for(const [key,text] of Object.entries(value))if(!tankKey(key)||typeof text!=='string'||!text.trim()||text.length>48)throw Error('Nome acquario non valido (massimo 48 caratteri).');
    return Object.fromEntries(Object.entries(value).map(([key,text])=>[key,text.trim()]));
  }
  const roomTypes=['halfmoon','overhalfmoon','crowntail','doubletail','plakat','hmpk','veiltail','delta','spade','dumbo','imbellis','hendra'];
  const homeKeys=isDiscus?Array.from({length:8},(_,i)=>'discus-'+i):['F','M'].flatMap(sex=>roomTypes.map(type=>type+(sex==='M'?'-male':'')));
  const homeKey=key=>homeKeys.includes(key)||/^nursery-(0|[1-9][0-9]{0,3})$/.test(key)&&Number(key.slice(8))<3000;
  function preferredTank(f){
    if(isDiscus)return homeKeys[Math.floor((f.id-1)/2)%8];
    let type=f.species;
    if(window.BettaSpecies.ornamental(f)){const t=window.BettaTypes.traits(f);type=t.dumbo?'dumbo':t.split?'doubletail':t.crown>=.8?'crowntail':t.veil>=.5?'veiltail':t.spade>=.5?'spade':t.short?(t.spread>=3?'hmpk':'plakat'):t.spread>=4?'overhalfmoon':t.spread>=3?'halfmoon':'delta';}
    return type+(f.sex==='M'?'-male':'');
  }
  function assignTanks(state,strict=false){
    const saved=state.tankAssignments??{},result={},counts=new Map(),listed=new Set(state.career?.listings.map(l=>l.fishId)||[]),ids=new Set(state.fish.map(f=>f.id));
    if(!saved||typeof saved!=='object'||Array.isArray(saved)||Object.keys(saved).length>3000)throw Error('Assegnazioni acquari non valide.');
    for(const [id,key] of Object.entries(saved)){
      if(!/^[1-9][0-9]*$/.test(id)||!homeKey(key)||strict&&!ids.has(Number(id)))throw Error('Assegnazione acquario non valida.');
      if(!ids.has(Number(id))||listed.has(Number(id)))continue;
      result[id]=key;counts.set(key,(counts.get(key)||0)+1);if(counts.get(key)>4)throw Error('Massimo 4 pesci per acquario.');
    }
    const family=f=>f.parents?[...f.parents].sort((a,b)=>a-b).join('-')+':'+(state.month-f.age):null,homes=new Map();
    for(const f of state.fish){const key=result[f.id],kin=family(f);if(key?.startsWith('nursery-')&&kin)homes.set(kin,key);}
    for(const f of [...state.fish].sort((a,b)=>a.id-b.id)){
      if(result[f.id]||listed.has(f.id))continue;
      const founder=!f.parents&&f.gen===0&&f.age>=2&&!(state.mode==='career'&&f.id>8),kin=family(f);
      let key=founder?preferredTank(f):kin?homes.get(kin):null;
      if(!key||!homeKey(key)||(counts.get(key)||0)>=4){let n=0;while(counts.get('nursery-'+n))n++;key='nursery-'+n;}
      result[f.id]=key;counts.set(key,(counts.get(key)||0)+1);if(kin)homes.set(kin,key);
    }
    return result;
  }
  function tankNumber(key){const i=homeKeys.indexOf(key);if(i>=0)return '1.'+String(i+1).padStart(2,'0');return (key.startsWith('shop-')?'3.':'2.')+String(Number(key.split('-')[1])+1).padStart(2,'0');}
  function housing(state){
    const assignments=assignTanks(state),slots=new Map();
    const make=(key,name)=>({key,id:key,number:tankNumber(key),name,fish:[]});
    for(const key of homeKeys){const type=key.replace(/-male$/,''),name=window.BettaTypes.forms.find(f=>f.id===type)?.name||({dumbo:'Dumbo',imbellis:'Imbellis',hendra:'Hendra'})[type]||type;slots.set(key,make(key,isDiscus?'Discus '+(homeKeys.indexOf(key)+1):name+(key.endsWith('-male')?' · Maschio':' · Femmina')));}
    const last=Math.max(tanksPerRoom-1,...Object.values(assignments).filter(k=>k.startsWith('nursery-')).map(k=>Number(k.slice(8))));
    for(let i=0;i<Math.ceil((last+1)/tanksPerRoom)*tanksPerRoom;i++)slots.set('nursery-'+i,make('nursery-'+i,'Vasca '+(i+1)));
    for(const f of state.fish){const key=assignments[f.id];if(key)slots.get(key).fish.push(f);}
    return {assignments,breeders:[...slots.values()].slice(0,tanksPerRoom),nursery:[...slots.values()].slice(tanksPerRoom)};
  }
  function migrate(input) {
    if (!input || typeof input !== 'object') throw Error('Il file non contiene una vasca.');
    if((input.collection||'betta')!==(isDiscus?'discus':'betta'))throw Error('Questo backup appartiene a un altro allevamento.');
    const version = input.schemaVersion ?? 0;
    if (!integer(version) || version > VERSION) throw Error('Versione del salvataggio non supportata.');
    if (!Array.isArray(input.fish) || !input.fish.length || input.fish.length > 3000) throw Error('La vasca deve contenere da 1 a 3000 pesci.');
    const ids = new Set();
    const fish = input.fish.map(source => {
      if (!source || !integer(source.id, 1) || ids.has(source.id)) throw Error('Identificativo del pesce non valido o duplicato.');
      ids.add(source.id);
      if (!['F', 'M'].includes(source.sex)) throw Error('Sesso del pesce non valido.');
      const f = {};
      for (const key of ['id','name','sex','age','gen','parents','seed','phase','species','ancestry','genes','form','styledCoat']) {
        if (source[key] !== undefined) f[key] = clone(source[key]);
      }
      if (typeof f.name !== 'string' || !f.name.trim() || f.name.length > 120) throw Error('Nome del pesce non valido.');
      for (const key of ['age','gen','seed']) if (!integer(f[key])) throw Error('Età, generazione o seed non validi.');
      f.phase ??= 0;
      if (!Number.isFinite(f.phase)) throw Error('Fase della livrea non valida.');
      if(f.styledCoat!==undefined&&typeof f.styledCoat!=='boolean')throw Error('Livrea creativa non valida.');
      if (f.parents != null && (!Array.isArray(f.parents) || f.parents.length !== 2 || !f.parents.every(p => integer(p, 1) && p !== f.id))) throw Error('Genealogia non valida.');
      f.parents ??= null;
      for (const [field, defaults] of [['genes', colorBase], ['form', formBase]]) {
        if (f[field] != null && (typeof f[field] !== 'object' || Array.isArray(f[field]))) throw Error('Tratti del pesce non validi.');
        f[field] = Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => {
          const pair = f[field]?.[key] ?? fallback;
          if (typeof pair !== 'string' || !new RegExp('^[' + key + key.toLowerCase() + ']{2}$').test(pair)) throw Error('Alleli non validi: ' + key);
          return [key, [...pair].sort().join('')];
        }));
      }
      if (f.species !== undefined && ![...window.BettaSpecies.ids, 'hybrid'].includes(f.species)) throw Error('Specie non riconosciuta.');
      if (f.ancestry !== undefined) {
        if (!f.ancestry || typeof f.ancestry !== 'object' || Object.keys(f.ancestry).some(k => !window.BettaSpecies.ids.includes(k))) throw Error('Ascendenza non valida.');
        const values = window.BettaSpecies.ids.map(k => f.ancestry[k] ?? 0);
        if (values.some(v => !Number.isFinite(v) || v < 0) || values.reduce((a,b) => a+b,0) <= 0) throw Error('Quote genealogiche non valide.');
      } else if (f.species === 'hybrid') throw Error('Ascendenza dell’ibrido mancante.');
      window.BettaTypes.normalize(f);
      if(f.name==='Piccolo '+f.id||f.gen===0&&/ · (Femmina|Maschio)$/.test(f.name)&&[
        ...window.BettaTypes.colors.map(color=>color.name),...window.BettaTypes.forms.map(form=>form.name),'Dumbo','Imbellis','Hendra'
      ].includes(f.name.replace(/ · (Femmina|Maschio)$/,'')))f.name=defaultFishName(f);
      return f;
    });
    if (!integer(input.month, 1)) throw Error('Mese della vasca non valido.');
    const validSelection = id => ids.has(id) ? id : null;
    const mode=input.mode??'creative';
    if(!['creative','career'].includes(mode))throw Error('Modalità non valida.');
    const career=mode==='career'?window.BettaCareer.normalize(input.career,fish,input.month):undefined;
    const minimumNext=Math.max(...fish.map(f=>f.id),...(career?.archive||[]).map(f=>f.id))+1;
    if(input.nextFishId!==undefined&&(!integer(input.nextFishId,1)))throw Error('Contatore esemplari non valido.');
    const migrated={
      mode,collection:isDiscus?'discus':'betta',...(career?{career}:{}),nextFishId:Math.max(input.nextFishId??minimumNext,minimumNext),
      schemaVersion: VERSION, fish,tankNames:tankNames(input.tankNames),
      selected: validSelection(input.selected) ?? fish[0].id,
      mother: fish.some(f => f.id === input.mother && f.sex === 'F') ? input.mother : null,
      father: fish.some(f => f.id === input.father && f.sex === 'M') ? input.father : null,
      month: input.month,
      log: Array.isArray(input.log) ? input.log.filter(x => typeof x === 'string').slice(0,5).map(x => x.slice(0,300)) : []
    };
    migrated.tankAssignments=assignTanks({...migrated,tankAssignments:input.tankAssignments},true);return migrated;
  }
  function founders(mode='creative') {
    const fish = [];
    const pair = (make, name) => {
      for (const sex of ['F','M']) {
        const f = make(sex);
        Object.assign(f, {id:fish.length+1, phase:Math.random()*6.28});
        f.name=defaultFishName(f);
        fish.push(window.BettaTypes.normalize(f));
      }
    };
    if(isDiscus&&mode==='creative'){
      for(const color of window.BettaTypes.colors)pair(sex=>window.BettaTypes.specimen('halfmoon',color.id,sex),color.name);
      return {schemaVersion:VERSION,collection:'discus',mode,tankNames:{},nextFishId:fish.length+1,fish,selected:1,mother:null,father:null,month:1,log:['Benvenuto nel tuo allevamento Discus.']};
    }
    if(mode==='career'){
      for(const [i,color] of window.BettaCareer.starters.entries())pair(sex=>window.BettaTypes.specimen(['halfmoon','plakat','veiltail','delta'][i],color,sex),window.BettaCareer.byId(color).name);
      return {schemaVersion:VERSION,collection:isDiscus?'discus':'betta',mode,tankNames:{},nextFishId:fish.length+1,career:window.BettaCareer.initial(),fish,selected:1,mother:null,father:null,month:1,log:['Benvenuto: alleva nuove livree, allestisci il negozio e completa gli ordini.']};
    }
    for (const form of window.BettaTypes.forms) pair(sex => window.BettaTypes.specimen(form.id,'random',sex), form.name);
    pair(sex => window.BettaTypes.specimen('halfmoon','random',sex,true), 'Dumbo');
    for (const species of ['imbellis','hendra']) pair(sex => window.BettaSpecies.specimen(species,sex), window.BettaSpecies.names[species]);
    return {schemaVersion:VERSION,collection:isDiscus?'discus':'betta',mode,tankNames:{},nextFishId:fish.length+1, fish, selected:1, mother:null, father:null, month:1, log:['Una coppia per ogni tipologia è pronta per l’allevamento.']};
  }
  function relationship(m,d) {
    if (!m || !d) return '';
    if (m.parents?.includes(d.id) || d.parents?.includes(m.id)) return 'Parentela registrata: genitore e figlio.';
    const shared = m.parents?.filter(id => d.parents?.includes(id)) ?? [];
    if (shared.length) return shared.length === 2 ? 'Parentela registrata: fratelli.' : 'Parentela registrata: un genitore in comune.';
    return 'Nessuna parentela diretta rilevata nei dati disponibili; non esclude antenati comuni.';
  }
  // One readiness rule for both interface and direct actions.
  function parentStatus(state,fish) {
    if(!fish)return {allowed:false,reason:'Scegli un esemplare.'};
    if(state.career?.listings.some(l=>l.fishId===fish.id))return {allowed:false,reason:'In vendita nel negozio: ritiralo per riprodurlo.'};
    if(state.mode==='career'&&state.fish.length+4>state.career.capacity)return {allowed:false,reason:'Spazio insufficiente per quattro piccoli: vendi o amplia.'};
    if(fish.age<2)return {allowed:false,reason:'I piccoli diventano riproduttori a 2 mesi nel gioco.'};
    const species=window.BettaSpecies.compatibility(fish,fish);
    if(!species.allowed)return {allowed:false,reason:species.message};
    if(state.fish.some(f=>f.age===0&&f.parents?.includes(fish.id)))
      return {allowed:false,reason:'Un genitore ha già una nidiata questo mese. Passa al mese successivo.',resting:true};
    if(state.fish.length>2996)return {allowed:false,reason:'Spazio insufficiente: il limite è 3000 esemplari.'};
    return {allowed:true,reason:''};
  }
  function selectionStatus(state,fish) {
    const own=parentStatus(state,fish);
    if(!own.allowed)return own;
    const opposite=state.fish.find(f=>f.id===state[fish.sex==='F'?'father':'mother']);
    return opposite?pairingStatus(state,fish,opposite):own;
  }
  function pairingStatus(state,a,b) {
    if(!a||!b)return {allowed:false,reason:'Scegli una femmina e un maschio adulti.'};
    if(a.id===b.id)return {allowed:false,reason:'È lo stesso esemplare.'};
    if(a.sex===b.sex)return {allowed:false,reason:'Stesso sesso.'};
    const m=a.sex==='F'?a:b,d=a.sex==='M'?a:b;
    for(const parent of [m,d]){const status=parentStatus(state,parent);if(!status.allowed)return status;}
    const compatibility=window.BettaSpecies.compatibility(m,d);
    if(!compatibility.allowed)return {allowed:false,reason:compatibility.message};
    return {allowed:true,reason:compatibility.message};
  }
  function breedingStatus(state) {
    return pairingStatus(state,state.fish.find(f=>f.id===state.mother),state.fish.find(f=>f.id===state.father));
  }
  function create(storage,{mode='creative'}={}) {
    if(!['creative','career'].includes(mode))throw Error('Modalità non valida.');
    const saveKey=isDiscus?'discus-'+mode+'-v2':mode==='career'?'fishchromia-career-v1':KEY;
    let state, blocked = false, notice = '';
    const listeners = new Set();
    function persist() {
      if (blocked) return;
      try { storage.setItem(saveKey, JSON.stringify(state)); notice = ''; }
      catch { notice = 'Salvataggio automatico non riuscito. Esporta la vasca per conservare i progressi.'; }
    }
    try {
      const raw = storage.getItem(saveKey);
      const legacy=isDiscus&&!raw?storage.getItem('discus-'+mode+'-v1'):null;
      state = raw ? migrate(JSON.parse(raw)) : legacy?migrate(window.FishCollection.convertLegacy(JSON.parse(legacy),mode)):founders(mode);
      if(state.mode!==mode)throw Error('Modalità del salvataggio non corrispondente.');
      state.tankAssignments=assignTanks(state);persist();
    } catch {
      state = founders(mode); blocked = true;
      notice = 'Il salvataggio non è leggibile: l’originale è stato conservato. Questa vasca è temporanea. Puoi scaricare l’originale, importare un backup o ricominciare.';
    }
    function emit() { for (const listener of listeners) listener(); }
    function commit(next) { next.tankAssignments=assignTanks(next);state = next; persist(); emit(); }
    function parents() { return [state.fish.find(f=>f.id===state.mother),state.fish.find(f=>f.id===state.father)]; }
    function nextId() { return state.nextFishId??Math.max(0,...state.fish.map(f=>f.id))+1; }
    return {
      getState: () => clone(state),
      tickCustomers(seconds){
        if(mode!=='career'||blocked||!Number.isFinite(seconds)||seconds<=0)return;
        state.career.customerRemaining=Math.max(0,(state.career.customerRemaining??20)-Math.min(seconds,5));
        if(state.career.customerRemaining===0)commit(window.BettaCareer.customer(clone(state)));
        else persist();
      },
      moveFish(id,key){
        if(!state.fish.some(f=>f.id===id))throw Error('Esemplare non trovato.');
        if(!homeKey(key))throw Error('Scegli un acquario di allevamento o crescita. Le vetrine si gestiscono dal negozio.');
        if(state.career?.listings.some(l=>l.fishId===id))throw Error('Ritira prima il pesce dalla vendita.');
        const assignments=assignTanks(state);if(assignments[id]===key)return;
        if(Object.values(assignments).filter(k=>k===key).length>=4)throw Error('Acquario pieno: massimo 4 pesci.');
        commit({...state,tankAssignments:{...assignments,[id]:key}});
      },
      autoArrangeTanks(wing='breeders',page=0){
        if(!['breeders','nursery','shop'].includes(wing)||!Number.isSafeInteger(page)||page<0)throw Error('Stanza non valida.');
        const next=clone(state),assignments=assignTanks(state);
        const keys=wing==='breeders'?homeKeys:Array.from({length:tanksPerRoom},(_,i)=>(wing==='shop'?'shop-':'nursery-')+(page*tanksPerRoom+i)).filter(k=>wing!=='shop'||Number(k.slice(5))<state.career?.shopSlots);
        const residents=wing==='shop'?state.fish.filter(f=>state.career?.listings.some(l=>l.fishId===f.id&&keys.includes('shop-'+l.tank))):state.fish.filter(f=>keys.includes(assignments[f.id]));
        const groups=new Map();
        for(const f of residents.sort((a,b)=>a.id-b.id)){const coat=f.species+':'+window.BettaCareer.signature(f);if(!groups.has(coat))groups.set(coat,[]);groups.get(coat).push(f);}
        if([...groups.values()].reduce((n,g)=>n+Math.ceil(g.length/4),0)>keys.length)throw Error('Acquari insufficienti per separare le livree in questa stanza.');
        let index=0;
        for(const group of groups.values()){
          for(let i=0;i<group.length;i++){const key=keys[index+Math.floor(i/4)],fish=group[i];if(wing==='shop')next.career.listings.find(l=>l.fishId===fish.id).tank=Number(key.slice(5));else assignments[fish.id]=key;}
          index+=Math.ceil(group.length/4);
        }
        next.tankAssignments=assignments;commit(next);return groups.size;
      },
      renameTank(key,text){
        if(!tankKey(key)||typeof text!=='string'||text.length>48)throw Error('Nome acquario non valido (massimo 48 caratteri).');
        const names={...state.tankNames};if(text.trim())names[key]=text.trim();else delete names[key];
        commit({...state,tankNames:tankNames(names)});
      },
      renameFish(id,text){
        if(typeof text!=='string'||!text.trim()||text.trim().length>120)throw Error('Il nome deve contenere da 1 a 120 caratteri.');
        const fish=state.fish.find(f=>f.id===id);if(!fish)throw Error('Esemplare non trovato.');
        commit({...state,fish:state.fish.map(f=>f.id===id?{...f,name:text.trim()}:f)});
      },
      removeFish(id){
        const fish=state.fish.find(f=>f.id===id);
        if(!fish)throw Error('Esemplare non trovato.');
        if(state.fish.length===1)throw Error('Conserva almeno un pesce nell’allevamento.');
        const next=clone(state),index=next.fish.findIndex(f=>f.id===id);
        next.fish.splice(index,1);
        if(next.selected===id)next.selected=next.fish[Math.min(index,next.fish.length-1)].id;
        if(next.mother===id)next.mother=null;
        if(next.father===id)next.father=null;
        delete next.tankAssignments[id];
        if(next.career){
          next.career.listings=next.career.listings.filter(l=>l.fishId!==id);
          next.career.archive.push({id:fish.id,name:fish.name,month:next.month,parents:fish.parents,reason:'eliminazione'});
          next.career.archive=next.career.archive.slice(-3000);
        }
        next.log=[fish.name+' eliminato dall’allevamento.',...next.log].slice(0,5);
        commit(next);
      },
      career(action,data){const next=window.BettaCareer.transact(clone(state),action,data);commit(next);},
      getStatus: () => ({notice, blocked}),
      breedingStatus: () => breedingStatus(state),
      clearParent(sex) { if(['F','M'].includes(sex))commit({...state,[sex==='F'?'mother':'father']:null}); },
      subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
      export: () => JSON.stringify(state,null,2),
      original: () => storage.getItem(saveKey)||(isDiscus?storage.getItem('discus-'+mode+'-v1'):null),
      import(text) {
        const parsed=JSON.parse(text);
        const next = migrate(isDiscus&&parsed.version===1?window.FishCollection.convertLegacy(parsed,mode):parsed); // Validate before touching state or storage.
        if(next.mode!==mode)throw Error('Questo backup appartiene alla modalità '+(next.mode==='career'?'carriera':'creativa')+'. Cambia modalità per importarlo.');
        blocked = false; commit(next);
      },
      reset() { blocked = false; commit(founders(mode)); },
      select(id) { if(state.fish.some(f=>f.id===id)) commit({...state,selected:id}); },
      choosePair(femaleId,maleId) {
        const mother=state.fish.find(f=>f.id===femaleId&&f.sex==='F'&&f.age>=2);
        const father=state.fish.find(f=>f.id===maleId&&f.sex==='M'&&f.age>=2);
        commit({...state,mother:mother?.id??null,father:father?.id??null,selected:mother?.id??father?.id??state.selected});
      },
      pick(id) {
        const f=state.fish.find(f=>f.id===id);
        if(selectionStatus(state,f).allowed) commit({...state,selected:id,[f.sex==='F'?'mother':'father']:id});
      },
      add(specimen) {
        return this.addMany([specimen]);
      },
      addMany(specimens) {
        if(mode==='career')throw Error('In carriera acquista riproduttori dal mercato.');
        if(!Array.isArray(specimens)||!specimens.length)throw Error('Seleziona almeno una livrea.');
        if(state.fish.length+specimens.length>3000)throw Error('Vasca piena: esporta una copia prima di iniziare un nuovo allevamento.');
        const start=nextId(),created=specimens.map((specimen,index)=>{
          const fish=window.BettaTypes.normalize({...clone(specimen),id:start+index});
          fish.name=defaultFishName(fish);return fish;
        });
        const first=created[0];
        const next=migrate({...state,fish:[...created,...state.fish],nextFishId:start+created.length,selected:first.id,[first.sex==='F'?'mother':'father']:first.id});
        next.log=[created.length===1?first.name+' aggiunto alla vasca.':created.length+' pesci aggiunti alla vasca.',...state.log].slice(0,5);commit(next);
      },
      breed() {
        const [m,d]=parents();
        if(!breedingStatus(state).allowed) return false;
        if(state.fish.length>2996) throw Error('Spazio insufficiente nella vasca.');
        const start=nextId();
        const batch=Array.from({length:4},(_,i)=>({
          ...window.BettaSpecies.offspring(m,d),styledCoat:!!(m.styledCoat||d.styledCoat),id:start+i,
          sex:Math.random()<.5?'F':'M',genes:window.BettaTypes.inheritColors(m,d),form:window.BettaTypes.inherit(m,d),
          seed:Math.floor(Math.random()*899999)+100000,phase:Math.random()*6.28,age:0,gen:Math.max(m.gen,d.gen)+1,parents:[m.id,d.id]
        })).map(f=>({...f,name:defaultFishName(f)}));
        const next={...clone(state),fish:[...batch,...state.fish],nextFishId:start+4,selected:batch[0].id,mother:null,father:null,log:[m.name+' × '+d.name+': quattro piccoli.',...state.log].slice(0,5)};
        if(mode==='career')window.BettaCareer.discover(next,batch);commit(next);
        return true;
      },
      advance() {
        const fish=state.fish.map(f=>({...f,age:f.age+1,phase:f.phase+(f.genes.M.includes('M')?.21+(f.seed%11)/80:0)}));
        const matured=state.fish.filter(f=>f.age===1).length;
        const next={...clone(state),fish,month:state.month+1,log:['Mese '+(state.month+1)+': '+(matured?matured+' giovani diventano adulti.':'i pesci crescono.'),...state.log].slice(0,5)};
        if(mode==='career')window.BettaCareer.advance(next);commit(next);
        return {matured,young:fish.filter(f=>f.age<2).length};
      }
    };
  }
  return {housing,tankNumber,VERSION,KEY,migrate,founders,relationship,parentStatus,selectionStatus,pairingStatus,breedingStatus,create};
})();
