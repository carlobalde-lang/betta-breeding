'use strict';
window.BettaStore = (() => {
  const VERSION = 2;
  const KEY = 'betta-lab-v1'; // Keep the old key so existing aquariums migrate.
  const clone = value => JSON.parse(JSON.stringify(value));
  const integer = (n, min = 0) => Number.isSafeInteger(n) && n >= min;
  const formBase = window.BettaTypes.specimen('halfmoon', 'royal', 'F').form;
  const colorBase = window.BettaTypes.specimen('halfmoon', 'royal', 'F').genes;
  function migrate(input) {
    if (!input || typeof input !== 'object') throw Error('Il file non contiene una vasca.');
    const version = input.schemaVersion ?? 0;
    if (!integer(version) || version > VERSION) throw Error('Versione del salvataggio non supportata.');
    if (!Array.isArray(input.fish) || !input.fish.length || input.fish.length > 3000) throw Error('La vasca deve contenere da 1 a 3000 pesci.');
    const ids = new Set();
    const fish = input.fish.map(source => {
      if (!source || !integer(source.id, 1) || ids.has(source.id)) throw Error('Identificativo del pesce non valido o duplicato.');
      ids.add(source.id);
      if (!['F', 'M'].includes(source.sex)) throw Error('Sesso del pesce non valido.');
      const f = {};
      for (const key of ['id','name','sex','age','gen','parents','seed','phase','species','ancestry','genes','form']) {
        if (source[key] !== undefined) f[key] = clone(source[key]);
      }
      if (typeof f.name !== 'string' || !f.name.trim() || f.name.length > 120) throw Error('Nome del pesce non valido.');
      for (const key of ['age','gen','seed']) if (!integer(f[key])) throw Error('Età, generazione o seed non validi.');
      f.phase ??= 0;
      if (!Number.isFinite(f.phase)) throw Error('Fase della livrea non valida.');
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
      return f;
    });
    if (!integer(input.month, 1)) throw Error('Mese della vasca non valido.');
    const validSelection = id => ids.has(id) ? id : null;
    return {
      schemaVersion: VERSION, fish,
      selected: validSelection(input.selected) ?? fish[0].id,
      mother: fish.some(f => f.id === input.mother && f.sex === 'F') ? input.mother : null,
      father: fish.some(f => f.id === input.father && f.sex === 'M') ? input.father : null,
      month: input.month,
      log: Array.isArray(input.log) ? input.log.filter(x => typeof x === 'string').slice(0,5).map(x => x.slice(0,300)) : []
    };
  }
  function founders() {
    const fish = [];
    const pair = (make, name) => {
      for (const sex of ['F','M']) {
        const f = make(sex);
        Object.assign(f, {id:fish.length+1, name:name+' · '+(sex==='F'?'Femmina':'Maschio'), phase:Math.random()*6.28});
        fish.push(window.BettaTypes.normalize(f));
      }
    };
    for (const form of window.BettaTypes.forms) pair(sex => window.BettaTypes.specimen(form.id,'random',sex), form.name);
    pair(sex => window.BettaTypes.specimen('halfmoon','random',sex,true), 'Dumbo');
    for (const species of ['imbellis','hendra']) pair(sex => window.BettaSpecies.specimen(species,sex), window.BettaSpecies.names[species]);
    return {schemaVersion:VERSION, fish, selected:1, mother:null, father:null, month:1, log:['Una coppia per ogni tipologia è pronta per l’allevamento.']};
  }
  function relationship(m,d) {
    if (!m || !d) return '';
    if (m.parents?.includes(d.id) || d.parents?.includes(m.id)) return 'Parentela registrata: genitore e figlio.';
    const shared = m.parents?.filter(id => d.parents?.includes(id)) ?? [];
    if (shared.length) return shared.length === 2 ? 'Parentela registrata: fratelli.' : 'Parentela registrata: un genitore in comune.';
    return 'Nessuna parentela diretta rilevata nei dati disponibili; non esclude antenati comuni.';
  }
  function create(storage) {
    let state, blocked = false, notice = '';
    const listeners = new Set();
    function persist() {
      if (blocked) return;
      try { storage.setItem(KEY, JSON.stringify(state)); notice = ''; }
      catch { notice = 'Salvataggio automatico non riuscito. Esporta la vasca per conservare i progressi.'; }
    }
    try {
      const raw = storage.getItem(KEY);
      state = raw ? migrate(JSON.parse(raw)) : founders();
      persist();
    } catch {
      state = founders(); blocked = true;
      notice = 'Il salvataggio non è leggibile: l’originale è stato conservato. Questa vasca è temporanea. Puoi scaricare l’originale, importare un backup o ricominciare.';
    }
    function emit() { for (const listener of listeners) listener(); }
    function commit(next) { state = next; persist(); emit(); }
    function parents() { return [state.fish.find(f=>f.id===state.mother),state.fish.find(f=>f.id===state.father)]; }
    function nextId() { return Math.max(0,...state.fish.map(f=>f.id))+1; }
    return {
      getState: () => clone(state),
      getStatus: () => ({notice, blocked}),
      subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
      export: () => JSON.stringify(state,null,2),
      original: () => storage.getItem(KEY),
      import(text) {
        const next = migrate(JSON.parse(text)); // Validate before touching state or storage.
        blocked = false; commit(next);
      },
      reset() { blocked = false; commit(founders()); },
      select(id) { if(state.fish.some(f=>f.id===id)) commit({...state,selected:id}); },
      pick(id) {
        const f=state.fish.find(f=>f.id===id);
        if(f && f.age>=2) commit({...state,selected:id,[f.sex==='F'?'mother':'father']:id});
      },
      add(specimen) {
        if(state.fish.length>=3000) throw Error('Vasca piena: esporta una copia prima di iniziare un nuovo allevamento.');
        const f=window.BettaTypes.normalize({...clone(specimen),id:nextId()});
        const next=migrate({...state,fish:[f,...state.fish],selected:f.id,[f.sex==='F'?'mother':'father']:f.id});
        next.log=[f.name+' aggiunto alla vasca.',...state.log].slice(0,5);commit(next);
      },
      breed() {
        const [m,d]=parents();
        if(!m||!d||m.id===d.id||m.age<2||d.age<2||!window.BettaSpecies.compatibility(m,d).allowed) return false;
        if(state.fish.length>2996) throw Error('Spazio insufficiente nella vasca.');
        const start=nextId();
        const batch=Array.from({length:4},(_,i)=>({
          ...window.BettaSpecies.offspring(m,d),id:start+i,name:'Piccolo '+(start+i),
          sex:Math.random()<.5?'F':'M',genes:window.BettaTypes.inheritColors(m,d),form:window.BettaTypes.inherit(m,d),
          seed:Math.floor(Math.random()*899999)+100000,phase:Math.random()*6.28,age:0,gen:Math.max(m.gen,d.gen)+1,parents:[m.id,d.id]
        }));
        commit({...state,fish:[...batch,...state.fish],selected:batch[0].id,log:[m.name+' × '+d.name+': quattro piccoli.',...state.log].slice(0,5)});
        return true;
      },
      advance() {
        const fish=state.fish.map(f=>({...f,age:f.age+1,phase:f.phase+(f.genes.M.includes('M')?.21+(f.seed%11)/80:0)}));
        commit({...state,fish,month:state.month+1,log:['Mese '+(state.month+1)+': i pesci crescono.',...state.log].slice(0,5)});
      }
    };
  }
  return {VERSION,KEY,migrate,founders,relationship,create};
})();

