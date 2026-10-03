'use strict';
document.addEventListener('click',event=>{
  const dialog=event.target;
  if(!(dialog instanceof HTMLDialogElement)||!dialog.open)return;
  const bounds=dialog.getBoundingClientRect();
  if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)dialog.close();
});
window.bettaLoading = {
  value:0,
  update(value,message){
    this.value=Math.max(this.value,Math.min(100,Math.round(value)));
    const bar=document.getElementById('loading-progress');if(bar)bar.value=this.value;
    const label=document.getElementById('loading-percent');if(label)label.textContent=this.value+'%';
    const status=document.getElementById('loading-message');if(message&&status)status.textContent=message;
  },
  done() { this.update(100,'Pronto');document.getElementById('loading')?.remove(); },
  fail(message) {
    const overlay = document.getElementById('loading');
    if (!overlay) return;
    overlay.classList.add('loading-error');
    document.getElementById('loading-message').textContent = message;
    document.getElementById('loading-retry').hidden = false;
  }
};
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Caricamento non riuscito. Controlla che tutti i file siano nella cartella dist.'));
    document.body.appendChild(script);
  });
}
async function chooseMode(){
  let saved;try{saved=sessionStorage.getItem('fishchromia-mode');}catch{}
  if(['career','creative'].includes(saved))return saved;
  const picker=document.getElementById('mode-picker');picker.hidden=false;document.getElementById('loading').hidden=true;
  return new Promise(resolve=>{for(const mode of ['career','creative'])document.getElementById('mode-'+mode).onclick=()=>{
    try{sessionStorage.setItem('fishchromia-mode',mode);}catch{}
    picker.hidden=true;document.getElementById('loading').hidden=false;resolve(mode);
  };});
}
async function chooseCollection(){
 let saved;try{saved=sessionStorage.getItem('fishchromia-collection');}catch{}
 if(saved==='betta')return saved;
 const picker=document.createElement('section');picker.id='species-picker';picker.className='mode-picker';picker.innerHTML='<div class="mode-intro"><span class="eyebrow">LA TUA CASA / ALLEVAMENTI</span><h1>Quali pesci<br>vuoi allevare?</h1><p>Betta e Discus hanno stanze e salvataggi indipendenti.</p><button id="species-back" class="secondary">← Cambia modalità</button></div><div class="mode-options"><button id="species-betta"><span>01 / BETTA</span><h2>Pinne e iridescenze.</h2><p>Entra nel tuo allevamento Betta. Tutti i progressi esistenti sono conservati.</p><strong>Entra nei Betta →</strong></button><button id="species-discus"><span>02 / DISCUS</span><h2>Un nuovo mondo, più spazio.</h2><p>Una stanza dedicata, vasche grandi e una nuova collezione di discus.</p><strong>Entra nei Discus →</strong></button></div>';
 document.body.append(picker);document.getElementById('loading').hidden=true;
 const discusChoice=document.getElementById('species-discus');discusChoice.disabled=true;
 discusChoice.setAttribute('aria-disabled','true');discusChoice.querySelector('strong').textContent='Disponibile prossimamente';
 document.getElementById('species-back').onclick=()=>{sessionStorage.removeItem('fishchromia-mode');sessionStorage.removeItem('fishchromia-collection');location.reload();};
 return new Promise(resolve=>{document.getElementById('species-betta').onclick=()=>{try{sessionStorage.setItem('fishchromia-collection','betta');}catch{}picker.remove();document.getElementById('loading').hidden=false;resolve('betta');};});
}
// Choose a separate save before any store is created.
chooseMode().then(async mode=>{window.bettaMode=mode;window.fishCollection=await chooseCollection();requestAnimationFrame(() => requestAnimationFrame(async () => {
  try {
    window.bettaLoading.update(2,'Caricamento delle regole…');
    await loadScript('./species.js');
    await loadScript('./varieties.js');
    await loadScript('./collection.js');
    await loadScript('./appearance.js');
    await loadScript('./career.js');
    await loadScript('./store.js');
    await loadScript('./breeding-guide.js');
    window.bettaLoading.update(8,'Lettura dell’allevamento…');
    await loadScript('./app.js');
    await loadScript('./types-ui.js');
    await loadScript('./career-ui.js');
    await loadScript('./collection-ui.js');
    window.bettaLoading.update(12,'Preparazione del modello 3D…');
    await loadScript('./three-scene.js');
  } catch (error) { window.bettaLoading.fail(error.message); }
}));});
