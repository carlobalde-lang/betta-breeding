'use strict';
if(window.FishCollection?.discus){
 document.title='Discus Lab · Genetica e livree';
 document.querySelector('.room-brand span').innerHTML='DISCUS / LAB<small>LA CASA DEI DISCUS</small>';
 document.querySelector('.brand strong').textContent='DISCUS / LAB';
 document.querySelector('#catalog .eyebrow').textContent='ATLANTE / DISCUS';
 document.querySelector('#catalog h2').textContent='Le livree dei discus.';
 document.querySelector('#catalog h2+p').textContent='Scegli livrea e sesso: creazione, osservazione e incroci funzionano come nell’allevamento Betta.';
 document.querySelector('#catalog .color-audit').hidden=true;
 document.querySelector('#catalog .sources').hidden=true;
 document.getElementById('color-model-note').textContent='Sei livree iniziali e combinazioni ereditarie. Ogni figlio riceve alleli da entrambi i genitori: modello creativo semplificato, non una previsione della genetica reale dei discus.';
 const species=document.getElementById('catalog-species');species.replaceChildren(new Option('Discus','splendens'));species.closest('label').hidden=true;
 document.querySelector('.dumbo-option').hidden=true;
 document.getElementById('form-genes').hidden=true;document.getElementById('form-genome-title').parentElement.hidden=true;
 document.querySelector('#form-genes + .view-note').hidden=true;
 const notes=document.getElementById('notes');notes.innerHTML='<form method="dialog"><button class="close" aria-label="Chiudi">×</button></form><span class="eyebrow">DISCUS / LAB</span><h2>Regole condivise, pesci diversi.</h2><p>La modalità Discus usa laboratorio, genealogia, incroci, album, guida agli sblocchi, mercato, ordini e negozio dello stesso gioco Betta. Salvataggi e collezioni sono indipendenti.</p><p>Colori e disegni si combinano tramite alleli del modello di gioco. Le sigle non identificano geni molecolari dei discus e i risultati non sono previsioni biologiche. Una covata contiene quattro piccoli; crescita e riposo seguono gli stessi mesi di gioco dei Betta.</p><p>Il modello 3D, le livree e le proporzioni delle vasche sono illustrativi. Le capacità delle vasche sono regole di gioco.</p>';
}
