(function(){
  // --- 🎄 Lights (static, only brightness cycles by color) ---
  const lights = document.getElementById('xmasLights');
  if(lights){
    let active = 0;
    let tick = null;

    function build(){
      // rebuild bulbs to match viewport width
      const w = Math.max(320, window.innerWidth || 0);
      const approxSpacing = 24; // px per bulb incl. gaps
      const BULBS = Math.max(24, Math.min(120, Math.ceil(w / approxSpacing)));

      lights.innerHTML = '';
      // IMPORTANT: do not override CSS positioning here.
      // It must stay `position: fixed` so the strip spans the full viewport,
      // not the header's `.wrap` width.

      const wire = document.createElement('div');
      wire.className = 'wire';
      lights.appendChild(wire);

      for(let i=0;i<BULBS;i++){
        const b=document.createElement('div');
        b.className='bulb c'+(i%4);
        lights.appendChild(b);
      }
    }

    function pickNext(){
      let n = Math.floor(Math.random()*4);
      if(n===active) n = (n+1+Math.floor(Math.random()*3))%4;
      active = n;
      lights.setAttribute('data-active', String(active));
    }

    build();
    pickNext();

    if(tick) clearInterval(tick);
    tick = setInterval(pickNext, 650);

    let rT = null;
    window.addEventListener('resize', ()=>{
      if(rT) cancelAnimationFrame(rT);
      rT = requestAnimationFrame(build);
    }, {passive:true});
  }

// --- ❄️ Snow (white by default, prism on LIMITED banner) ---
  const canvas = document.getElementById('snowCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d', { alpha:true });

  // ensure overlay canvas sits above UI
  canvas.style.position='fixed';
  canvas.style.left='0';
  canvas.style.top='0';
  canvas.style.pointerEvents='none';
  canvas.style.zIndex='9999';


  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(prefersReduced) return;

  let W=0,H=0,dpr=Math.max(1,Math.min(2,window.devicePixelRatio||1));
  function resize(){
    W=Math.floor(window.innerWidth);
    H=Math.floor(window.innerHeight);
    canvas.width = Math.floor(W*dpr);
    canvas.height = Math.floor(H*dpr);
    canvas.style.width = W+'px';
    canvas.style.height = H+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  window.addEventListener('resize', resize, {passive:true});
  resize();

  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const rand=(a,b)=>a+Math.random()*(b-a);

  const flakes=[];
  function makeFlake(resetY){
    return {
      x: rand(0,W),
      y: resetY ? rand(-H,0) : rand(0,H),
      r: rand(0.9, 2.8),
      vx: rand(-0.3,0.3),
      vy: rand(0.7,1.6),
      wob: rand(0, Math.PI*2),
      wobSp: rand(0.008,0.02),
      seed: rand(0,360)
    };
  }
  function targetCount(){
    return Math.round(clamp((W*H)/12000, 90, 190));
  }
  let mode='white'; // 'white' | 'prism'
  function resetFlakes(){
    flakes.length=0;
    const n=targetCount();
    for(let i=0;i<n;i++) flakes.push(makeFlake(false));
  }
  resetFlakes();

  const api = {
    setMode(m){ mode = (m==='prism') ? 'prism' : 'white'; },
    getMode(){ return mode; }
  };
  window.__snow = api;

  let last=performance.now();
  function frame(now){
    const dt = Math.min(33, now-last);
    last = now;
    ctx.clearRect(0,0,W,H);

    const wind = Math.sin(now/2400)*0.35;

    for(let i=0;i<flakes.length;i++){
      const f=flakes[i];
      f.wob += f.wobSp * dt;
      f.x += (f.vx + wind) * dt * 0.06 + Math.sin(f.wob)*0.25;
      f.y += f.vy * dt * 0.06;

      if(f.x < -10) f.x = W + 10;
      if(f.x > W + 10) f.x = -10;

      if(f.y > H + 10){
        flakes[i] = makeFlake(true);
      }

      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI*2);

      if(mode==='prism'){
        const hue = (f.seed + now/18) % 360;
        ctx.fillStyle = `hsla(${hue}, 95%, 70%, 0.85)`;
      }else{
        ctx.fillStyle = "rgba(255,255,255,0.85)";
      }
      ctx.fill();
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

})();
