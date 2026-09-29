'use strict';
window.FishAudio=(()=>{
  const control=document.createElement('button');control.id='fish-audio-toggle';control.type='button';control.title='Music and sound / Musica e suoni';
  let enabled=true;try{enabled=localStorage.getItem('fishchromia-audio')!=='off';}catch{}
  let context,master,music,voice=[],cycle,melody,step=0,note=0,lastEffect=0;
  const chords=[[196,246.94,293.66],[174.61,220,261.63],[146.83,196,246.94],[164.81,220,293.66]];
  function label(){control.textContent=enabled?'♪':'♪̸';control.setAttribute('aria-label',enabled?'Mute music and sounds / Disattiva musica e suoni':'Enable music and sounds / Attiva musica e suoni');control.setAttribute('aria-pressed',String(enabled));}
  function start(){
    if(!enabled||context)return;const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
    context=new Audio();master=context.createGain();master.gain.value=.24;master.connect(context.destination);
    music=context.createGain();music.gain.value=.035;music.connect(master);
    for(let i=0;i<3;i++){const oscillator=context.createOscillator(),gain=context.createGain();oscillator.type='sine';oscillator.frequency.value=chords[0][i];gain.gain.value=i===0?.5:.3;oscillator.connect(gain).connect(music);oscillator.start();voice.push(oscillator);}
    cycle=setInterval(()=>{if(!context||context.state==='closed')return;step=(step+1)%chords.length;voice.forEach((oscillator,i)=>oscillator.frequency.setTargetAtTime(chords[step][i],context.currentTime,1.5));},7000);
    melody=setInterval(()=>{if(context.state!=='running'||!enabled)return;const now=context.currentTime,tones=[0,2,1,2,0,1,2,1],frequency=chords[step][tones[note++%tones.length]]*2;
      const oscillator=context.createOscillator(),envelope=context.createGain();oscillator.type='triangle';oscillator.frequency.value=frequency;
      envelope.gain.setValueAtTime(.0001,now);envelope.gain.exponentialRampToValueAtTime(.009,now+.025);envelope.gain.exponentialRampToValueAtTime(.0001,now+1.25);
      oscillator.connect(envelope).connect(master);oscillator.start(now);oscillator.stop(now+1.3);
    },1750);
  }
  function effect(kind='tap'){
    if(!enabled)return;start();if(!context||context.state!=='running')return;
    const now=context.currentTime;if(kind==='tap'&&now-lastEffect<.07)return;lastEffect=now;
    const oscillator=context.createOscillator(),gain=context.createGain();oscillator.type='sine';
    const base=kind==='brood'?392:kind==='month'?330:523.25;
    oscillator.frequency.setValueAtTime(base,now);oscillator.frequency.exponentialRampToValueAtTime(base*(kind==='brood'?1.5:1.13),now+.16);
    gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(kind==='brood'?.035:.014,now+.02);
    gain.gain.exponentialRampToValueAtTime(.0001,now+(kind==='brood'?.48:.17));
    oscillator.connect(gain).connect(master);oscillator.start(now);oscillator.stop(now+(kind==='brood'?.5:.18));
  }
  control.onclick=()=>{enabled=!enabled;try{localStorage.setItem('fishchromia-audio',enabled?'on':'off');}catch{}label();if(enabled){start();context?.resume();}else context?.suspend();};
  document.body.append(control);label();
  document.addEventListener('pointerdown',event=>{if(event.target===control)return;if(enabled){start();context?.resume();}},{once:true});
  document.addEventListener('click',event=>{const button=event.target.closest('button');if(!button||button===control)return;effect(button.id==='breed'?'brood':button.id==='advance'||button.id==='room-advance'?'month':'tap');});
  document.addEventListener('visibilitychange',()=>{if(!context)return;if(document.hidden)context.suspend();else if(enabled)context.resume();});
  return {effect};
})();
