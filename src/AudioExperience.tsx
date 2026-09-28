import { useEffect, useRef, useState } from 'react';
import { Headphones, Play, Square, Volume2, RotateCcw } from 'lucide-react';

const channels=[{name:'Frontal esquerdo',short:'E',x:-2,z:-2,left:25,top:18},{name:'Central',short:'C',x:0,z:-2.5,left:50,top:10},{name:'Frontal direito',short:'D',x:2,z:-2,left:75,top:18},{name:'Lateral direito',short:'LD',x:2.5,z:0,left:88,top:50},{name:'Traseiro direito',short:'TD',x:1.7,z:2,left:73,top:82},{name:'Traseiro esquerdo',short:'TE',x:-1.7,z:2,left:27,top:82},{name:'Lateral esquerdo',short:'LE',x:-2.5,z:0,left:12,top:50}];
const duration=31;

export default function AudioExperience({onQuote}:{onQuote:()=>void}){
  const [playing,setPlaying]=useState(false),[volume,setVolume]=useState(28),[elapsed,setElapsed]=useState(0),[error,setError]=useState('');
  const engine=useRef<{context:AudioContext,gain:GainNode,timer:number,start:number}|null>(null);
  function stop(){const e=engine.current;engine.current=null;if(e){window.clearInterval(e.timer);void e.context.close()}setPlaying(false)}
  useEffect(()=>()=>{const e=engine.current;if(e){clearInterval(e.timer);void e.context.close()}},[]);
  useEffect(()=>{const hide=()=>{if(document.hidden)stop()};document.addEventListener('visibilitychange',hide);return()=>document.removeEventListener('visibilitychange',hide)},[]);
  useEffect(()=>{const e=engine.current;if(e)e.gain.gain.setTargetAtTime(volume/100*.6,e.context.currentTime,.08)},[volume]);
  async function start(){
    stop();setError('');setElapsed(0);
    let ctx:AudioContext|undefined;
    try{
      ctx=new AudioContext();await ctx.resume();
      const context=ctx,master=context.createGain(),compressor=context.createDynamicsCompressor();master.gain.value=volume/100*.6;master.connect(compressor);compressor.connect(context.destination);
      compressor.threshold.value=-16;compressor.ratio.value=5;compressor.attack.value=.01;compressor.release.value=.3;
      const now=context.currentTime+.12;
      const noise=context.createBuffer(1,context.sampleRate*3,context.sampleRate);const samples=noise.getChannelData(0);let last=0;
      for(let i=0;i<samples.length;i++){last=(last+Math.random()*.04-.02)/1.02;samples[i]=last*4}
      function pan(x:number,z:number){const p=context.createPanner();p.panningModel='HRTF';p.distanceModel='inverse';p.refDistance=3;p.rolloffFactor=.35;p.positionX.value=x;p.positionY.value=.2;p.positionZ.value=z;p.connect(master);return p}
      // Soft textured sweeps plus harmonic pulses articulate each physical direction.
      channels.forEach((channel,i)=>{
        const t=now+i*2.7,p=pan(channel.x,channel.z),envelope=context.createGain();envelope.connect(p);envelope.gain.setValueAtTime(0,t);envelope.gain.linearRampToValueAtTime(.45,t+.35);envelope.gain.exponentialRampToValueAtTime(.001,t+2.45);
        const air=context.createBufferSource(),filter=context.createBiquadFilter();air.buffer=noise;filter.type='bandpass';filter.frequency.setValueAtTime(550,t);filter.frequency.exponentialRampToValueAtTime(2800,t+1);filter.frequency.exponentialRampToValueAtTime(650,t+2.4);filter.Q.value=.8;air.connect(filter);filter.connect(envelope);air.start(t);air.stop(t+2.5);
        [196,293.66,392].forEach((frequency,k)=>{const tone=context.createOscillator(),g=context.createGain();tone.type='sine';tone.frequency.value=frequency*(i%2?1.122:1);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.10/(k+1),t+.2);g.gain.exponentialRampToValueAtTime(.001,t+2.3);tone.connect(g);g.connect(envelope);tone.start(t);tone.stop(t+2.5)});
      });
      // Continuous orbit demonstrates movement between channels, with native HRTF cues.
      const orbitStart=now+19,p=pan(-2,-2),air=context.createBufferSource(),filter=context.createBiquadFilter(),g=context.createGain();air.buffer=noise;air.loop=true;filter.type='lowpass';filter.frequency.value=2600;g.gain.setValueAtTime(0,orbitStart);g.gain.linearRampToValueAtTime(.65,orbitStart+1);g.gain.setValueAtTime(.65,orbitStart+8);g.gain.linearRampToValueAtTime(0,orbitStart+11);air.connect(filter);filter.connect(g);g.connect(p);
      for(let j=0;j<=100;j++){const angle=j/100*Math.PI*4-Math.PI/4,t=orbitStart+j/100*11;p.positionX.linearRampToValueAtTime(Math.sin(angle)*2.7,t);p.positionZ.linearRampToValueAtTime(-Math.cos(angle)*2.7,t)}air.start(orbitStart);air.stop(orbitStart+11);
      // LFE is deliberately subtle and centered; headphones cannot reproduce a room subwoofer.
      const bass=context.createOscillator(),bassGain=context.createGain();bass.frequency.value=55;bassGain.gain.setValueAtTime(0,now);bassGain.gain.linearRampToValueAtTime(.10,now+2);bassGain.gain.setValueAtTime(.10,now+27);bassGain.gain.linearRampToValueAtTime(0,now+30);bass.connect(bassGain);bassGain.connect(master);bass.start(now);bass.stop(now+30);
      const timer=window.setInterval(()=>{const value=Math.max(0,context.currentTime-now);setElapsed(Math.min(duration,value));if(value>=duration)stop()},100);
      engine.current={context,gain:master,timer,start:now};setPlaying(true);
    }catch{if(ctx&&ctx.state!=='closed')void ctx.close();setError('Não foi possível iniciar o áudio. Tente novamente em um navegador atualizado.');setPlaying(false)}
  }
  const active=playing&&elapsed<18.9?Math.min(6,Math.floor(elapsed/2.7)):-1;
  return <div className="sound-experience"><div className="sound-map" aria-label="Posicionamento das sete caixas de som"><span className="sound-screen">TELA</span><div className={`sound-listener ${playing?'is-playing':''}`}><Headphones/><span>VOCÊ</span></div><div className="sound-orbit"/>{channels.map((c,i)=><div key={c.short} className={`sound-point ${i===active?'active':''}`} style={{left:`${c.left}%`,top:`${c.top}%`}}><span/>{c.short}</div>)}<span className="sound-sub">+ SUBWOOFER</span></div><div className="sound-controls"><span className="overline">OUÇA A DIFERENÇA</span><h3>Não é só ouvir.<br/>É estar no meio.</h3><p>Coloque seus fones, ajuste o volume e feche os olhos. Uma paisagem sonora percorre sete posições ao seu redor.</p><div className="headphone-note"><Headphones size={20}/><span>Use fones nos dois ouvidos.<br/><small>Comece com um volume confortável.</small></span></div><div className="sound-status" aria-live="polite">{playing?(active>=0?channels[active].name:'Movimento contínuo ao seu redor'):elapsed>=duration?'Experiência concluída. Vamos levar essa sensação para sua sala?':'31 segundos para mudar seu jeito de ouvir.'}</div><div className="sound-progress"><span style={{width:`${elapsed/duration*100}%`}}/></div><div className="audio-action-row"><button className="btn btn-cream" onClick={playing?stop:start}>{playing?<Square size={17}/>:elapsed>0?<RotateCcw size={17}/>:<Play size={17} fill="currentColor"/>}{playing?'Parar experiência':elapsed>0?'Ouvir novamente':'Iniciar experiência'}</button><span>{Math.floor(elapsed).toString().padStart(2,'0')} / 31s</span></div><label className="volume-control"><Volume2 size={18}/><span className="sr-only">Volume da experiência</span><input type="range" min="0" max="100" value={volume} onChange={e=>setVolume(+e.target.value)}/><span>{volume}%</span></label>{error&&<p role="alert">{error}</p>}<button className="inline-link audio-quote" onClick={()=>{stop();onQuote()}}>Planejar meu home theater ↗</button><p className="sound-disclaimer">Demonstração binaural com espacialização HRTF e áudio sintetizado. Simula a direção de um sistema 7.1 em fones estéreo; não substitui a acústica e os graves de um home theater real.</p></div></div>
}
