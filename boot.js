'use strict';
window.bettaLoading = {
  done() { document.getElementById('loading')?.remove(); },
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
// Let the browser paint the loader before parsing the embedded model.
requestAnimationFrame(() => requestAnimationFrame(async () => {
  try {
    await loadScript('./species.js');
    await loadScript('./varieties.js');
    await loadScript('./appearance.js');
    await loadScript('./store.js');
    await loadScript('./app.js');
    await loadScript('./types-ui.js');
    await loadScript('./morph-ui.js');
    document.getElementById('loading-message').textContent = 'Preparazione del modello 3D…';
    await loadScript('./three-scene.js');
  } catch (error) { window.bettaLoading.fail(error.message); }
}));
