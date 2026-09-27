'use strict';
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
  let saved;try{saved=sessionStorage.getItem('betta-mode');}catch{}
  if(['career','creative'].includes(saved))return saved;
  const picker=document.getElementById('mode-picker');picker.hidden=false;document.getElementById('loading').hidden=true;
  return new Promise(resolve=>{for(const mode of ['career','creative'])document.getElementById('mode-'+mode).onclick=()=>{
    try{sessionStorage.setItem('betta-mode',mode);}catch{}
    picker.hidden=true;document.getElementById('loading').hidden=false;resolve(mode);
  };});
}
// Choose a separate save before any store is created.
chooseMode().then(mode=>{window.bettaMode=mode;requestAnimationFrame(() => requestAnimationFrame(async () => {
  try {
    window.bettaLoading.update(2,'Caricamento delle regole…');
    await loadScript('./species.js');
    await loadScript('./varieties.js');
    await loadScript('./appearance.js');
    await loadScript('./career.js');
    await loadScript('./store.js');
    await loadScript('./breeding-guide.js');
    window.bettaLoading.update(8,'Lettura dell’allevamento…');
    await loadScript('./app.js');
    await loadScript('./types-ui.js');
    await loadScript('./career-ui.js');
    window.bettaLoading.update(12,'Preparazione del modello 3D…');
    await loadScript('./three-scene.js');
  } catch (error) { window.bettaLoading.fail(error.message); }
}));});
