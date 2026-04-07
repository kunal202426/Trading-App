import { useEffect, useRef } from "react";

export default function OmniAnimation({ onProgress }) {
  const canvasRef   = useRef(null);
  const scrollerRef = useRef(null);
  const trackRef    = useRef(null);
  const hintRef     = useRef(null);
  const phaseTagRef = useRef(null);

  useEffect(() => {
    const cv       = canvasRef.current;
    const scroller = scrollerRef.current;
    const track    = trackRef.current;
    const sh       = hintRef.current;
    const pt       = phaseTagRef.current;
    if (!cv || !scroller || !track || !sh || !pt) return;

    const ctx = cv.getContext("2d", { alpha: false, desynchronized: true });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    const W = 900, H = 520;
    const PI2 = Math.PI * 2;
    const TILT = 25 * Math.PI / 180;

    let SP = 0;
    function onScroll() {
      const scrollTop    = scroller.scrollTop;
      const scrollHeight = track.offsetHeight - scroller.offsetHeight;
      SP = scrollHeight > 0 ? Math.max(0, Math.min(1, scrollTop / scrollHeight)) : 0;
      sh.classList.toggle('hidden', SP > 0.02);
      onProgress?.(SP);
    }
    scroller.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    let isVisible = false;
    function c01(v)       { return Math.max(0, Math.min(1, v)); }
    function ph(t,a,b)    { return c01((t-a)/(b-a)); }
    function eio(t)       { return t<.5?2*t*t:-1+(4-2*t)*t; }
    function eOut3(t)     { return 1-Math.pow(1-t,3); }
    function eOut5(t)     { return 1-Math.pow(1-t,5); }
    function lerp(a,b,t)  { return a+(b-a)*t; }
    function finite(...v) { return v.every(x=>Number.isFinite(x)&&!isNaN(x)); }
    function lerpHex(c1,c2,t) {
      const p=h=>parseInt(h,16);
      const [r1,g1,b1]=[p(c1.slice(1,3)),p(c1.slice(3,5)),p(c1.slice(5,7))];
      const [r2,g2,b2]=[p(c2.slice(1,3)),p(c2.slice(3,5)),p(c2.slice(5,7))];
      return `#${Math.round(lerp(r1,r2,t)).toString(16).padStart(2,'0')}${Math.round(lerp(g1,g2,t)).toString(16).padStart(2,'0')}${Math.round(lerp(b1,b2,t)).toString(16).padStart(2,'0')}`;
    }
    function rrect(x,y,w,h,r) {
      ctx.beginPath();
      ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
      ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
      ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
      ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r);
      ctx.closePath();
    }
    function catmullRom(pts) {
      if (pts.length < 2) return;
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i=0; i<pts.length-1; i++) {
        const p0=pts[Math.max(i-1,0)], p1=pts[i], p2=pts[i+1], p3=pts[Math.min(i+2,pts.length-1)];
        ctx.bezierCurveTo(
          p1.x+(p2.x-p0.x)/6, p1.y+(p2.y-p0.y)/6,
          p2.x-(p3.x-p1.x)/6, p2.y-(p3.y-p1.y)/6,
          p2.x, p2.y
        );
      }
    }


    const TICKER_SEGS = [
      {t:'NIFTY 50 ',c:'#1A3A5C'},{t:'▲ 8.2% ',c:'#16A34A'},{t:'  ·  ',c:'#94B8D0'},
      {t:'SENSEX ',c:'#1A3A5C'},{t:'▲ 6.1% ',c:'#16A34A'},{t:'  ·  ',c:'#94B8D0'},
      {t:'HDFC ',c:'#1A3A5C'},{t:'▼ 1.4% ',c:'#DC2626'},{t:'  ·  ',c:'#94B8D0'},
      {t:'RELIANCE ',c:'#1A3A5C'},{t:'▲ 2.9% ',c:'#16A34A'},{t:'  ·  ',c:'#94B8D0'},
      {t:'TCS ',c:'#1A3A5C'},{t:'▲ 7.1% ',c:'#16A34A'},{t:'  ·  ',c:'#94B8D0'},
      {t:'INFY ',c:'#1A3A5C'},{t:'▼ 0.8% ',c:'#DC2626'},{t:'  ·  ',c:'#94B8D0'},
      {t:'SBI ',c:'#1A3A5C'},{t:'▲ 4.3% ',c:'#16A34A'},{t:'  ·  ',c:'#94B8D0'},
      {t:'BAJFIN ',c:'#1A3A5C'},{t:'▼ 2.1% ',c:'#DC2626'},{t:'  ·  ',c:'#94B8D0'},
      {t:'WIPRO ',c:'#1A3A5C'},{t:'▲ 3.8% ',c:'#16A34A'},{t:'  ·  ',c:'#94B8D0'},
      {t:'MARUTI ',c:'#1A3A5C'},{t:'▲ 5.7% ',c:'#16A34A'},{t:'  ·  ',c:'#94B8D0'},
      {t:'ITC ',c:'#1A3A5C'},{t:'▲ 1.9% ',c:'#16A34A'},{t:'  ·  ',c:'#94B8D0'},
      {t:'HCLTECH ',c:'#1A3A5C'},{t:'▲ 5.2% ',c:'#16A34A'},{t:'  ·  ',c:'#94B8D0'},
      {t:'AXISBANK ',c:'#1A3A5C'},{t:'▼ 0.6% ',c:'#DC2626'},{t:'  ·  ',c:'#94B8D0'},
    ];


    const RAW = [
      0.00,0.04,0.09,0.05,0.14,0.10,0.19,0.15,
      0.24,0.20,0.30,0.26,0.36,0.32,0.43,0.39,
      0.49,0.44,0.56,0.51,0.62,0.57,0.69,0.64,
      0.74,0.70,0.80,0.75,0.86,0.81,0.92,0.87,0.95,0.91,1.00
    ];
    const BENCH = RAW.map(v => v * 0.71 + 0.015);


    const PARTICLES = Array.from({length:34},(_,i)=>({
      ang:  Math.random()*PI2,
      dist: 1.10+Math.random()*0.55,
      spd:  (Math.random()<.5?-1:1)*(0.0018+Math.random()*0.005),
      r:    0.7+Math.random()*2.4,
      a:    0.07+Math.random()*0.26,
      color: i%6===0?'#22C55E':i%9===0?'#F59E0B':i%11===0?'#C084FC':'#5BB8F5',
    }));

    const PACKETS = Array.from({length:7},(_,i)=>({
      phase: i/7,
      speed: 0.0038 + i*0.0007,
    }));

    const EXCHANGES = [
      { label:'NSE',  val:'+8.2%',  ang:-0.68, dR:1.74, color:'#5BB8F5' },
      { label:'BSE',  val:'+6.1%',  ang:-0.34, dR:1.92, color:'#22C55E' },
      { label:'NYSE', val:'+0.8%',  ang: 0.40, dR:1.77, color:'#F59E0B' },
      { label:'LSE',  val:'+1.2%',  ang: 0.16, dR:1.62, color:'#C084FC' },
    ];


    const BG_NODES = Array.from({length:28},()=>({
      x:  Math.random()*W,
      y:  Math.random()*H,
      r:  0.5+Math.random()*1.5,
      a:  0.04+Math.random()*0.11,
      dx: (Math.random()-.5)*0.10,
      dy: (Math.random()-.5)*0.07,
      twk: Math.random()*PI2,
      color: Math.random()<.7?'#5BB8F5':Math.random()<.5?'#22C55E':'#C084FC',
    }));

    let globeRot  = 0;
    let tickerOff = 0;
    let time      = 0;
    let orbitTrail = [];

    const TICKER_CHARS = [];
    TICKER_SEGS.forEach(seg => { [...seg.t].forEach(ch => TICKER_CHARS.push({ch, c:seg.c})); });
    const TC = TICKER_CHARS.length;

    ctx.font = '500 9px "DM Sans",sans-serif';
    const CHAR_W = TICKER_CHARS.map(c => ctx.measureText(c.ch).width);
    const TOTAL_CHAR_W = CHAR_W.reduce((a,b)=>a+b,0);


    const cachedCenterGlow = ctx.createRadialGradient(W*.5, H*.3, 0, W*.5, H*.5, W*.6);
    cachedCenterGlow.addColorStop(0, 'rgba(210,238,255,0.42)');
    cachedCenterGlow.addColorStop(1, 'rgba(237,245,251,0)');

    const cachedVignette = ctx.createRadialGradient(W*.5, H*.5, H*.28, W*.5, H*.5, W*.72);
    cachedVignette.addColorStop(0, 'rgba(237,245,251,0)');
    cachedVignette.addColorStop(1, 'rgba(210,228,244,0.18)');


    const CELL = 110; // slightly larger than proximity threshold of 105
    const cols = Math.ceil(W / CELL);
    const rows = Math.ceil(H / CELL);
    const PROX_SQ = 105 * 105; // squared threshold for fast comparison


    let _arcCache = { gr:-1, table:null, total:0 };
    function getArcTable(gr) {
      if (Math.abs(_arcCache.gr - gr) < 0.5) return _arcCache;
      const RX=gr*1.46, RY=gr*0.28, N=720;
      const table = [{s:0, theta:0}];
      let total = 0;
      for (let i=1; i<=N; i++) {
        const tmid = (i-.5)*PI2/N;
        const ds = Math.sqrt(Math.pow(RX*Math.sin(tmid),2)+Math.pow(RY*Math.cos(tmid),2)) * (PI2/N);
        total += ds;
        table.push({s:total, theta:i*PI2/N});
      }
      _arcCache = {gr, table, total};
      return _arcCache;
    }
    function arcToTheta(ac, s) {
      const sn = ((s % ac.total)+ac.total)%ac.total;
      let lo=0, hi=ac.table.length-1;
      while(lo<hi-1){ const m=(lo+hi)>>1; if(ac.table[m].s<=sn) lo=m; else hi=m; }
      const t=(sn-ac.table[lo].s)/(ac.table[hi].s-ac.table[lo].s||1);
      return lerp(ac.table[lo].theta, ac.table[hi].theta, t);
    }
    function thetaToArc(ac, theta) {
      const tn = ((theta % PI2)+PI2)%PI2;
      let lo=0, hi=ac.table.length-1;
      while(lo<hi-1){ const m=(lo+hi)>>1; if(ac.table[m].theta<=tn) lo=m; else hi=m; }
      return ac.table[lo].s;
    }


    // The chart smoothly expands from globe-attached small → full-canvas large.
    // expandP goes 0→1 over scroll range 0.48..0.74
    function getChartDims(gx, gy, gr, s) {
      const expandP = eOut5(ph(s, 0.48, 0.74));
      const attachX = gx + gr * Math.cos(TILT);
      const attachY = gy + gr * Math.sin(TILT);
      const tgtOX  = 58;
      const tgtOY  = H * 0.495;
      const tgtCHW = 562;
      const ox   = lerp(attachX, tgtOX,  expandP);
      const oy   = lerp(attachY, tgtOY,  expandP);
      const chw  = lerp(295,     tgtCHW, expandP);
      const yBot = oy + lerp(55,  222, expandP);
      const yTop = oy - lerp(188, 183, expandP);
      return { ox, oy, chw, yBot, yTop, expandP };
    }


    function drawBackground() {
      ctx.save();
      // Layer 1: solid base
      ctx.fillStyle = '#EDF5FB';
      ctx.fillRect(0, 0, W, H);

      // Layer 2: aurora blobs — large animated radial glows
      [
        { gx:W*.26, gy:H*.17+Math.sin(time*.14    )*H*.068, r:270, rgb:'91,184,245',  a:.092 },
        { gx:W*.78, gy:H*.73+Math.sin(time*.11+1.5)*H*.054, r:215, rgb:'34,197,94',   a:.060 },
        { gx:W*.54, gy:H*.46+Math.sin(time*.09+3.0)*H*.075, r:310, rgb:'160,120,240', a:.040 },
        { gx:W*.10, gy:H*.60+Math.sin(time*.07+5.0)*H*.060, r:165, rgb:'245,158,11',  a:.028 },
      ].forEach(b => {
        const g = ctx.createRadialGradient(b.gx, b.gy, 0, b.gx, b.gy, b.r);
        g.addColorStop(0,    `rgba(${b.rgb},${b.a.toFixed(3)})`);
        g.addColorStop(0.50, `rgba(${b.rgb},${(b.a*.22).toFixed(3)})`);
        g.addColorStop(1,    `rgba(${b.rgb},0)`);
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      });

      // Layer 3: perspective radial grid
      const VPX = W*.50, VPY = H*.50;
      const gridPulse = 0.032 + 0.010 * Math.sin(time*.18);
      ctx.lineWidth = .45;
      for (let i=0; i<14; i++) {
        const a = (i/14)*PI2;
        const ex = VPX+Math.cos(a)*W, ey = VPY+Math.sin(a)*H;
        ctx.globalAlpha = gridPulse * (0.5 + 0.5*Math.abs(Math.cos(a + time*.04)));
        ctx.strokeStyle = '#5BB8F5';
        ctx.beginPath(); ctx.moveTo(VPX,VPY); ctx.lineTo(ex,ey); ctx.stroke();
      }
      for (let i=1; i<=6; i++) {
        const t = i/6;
        const breathe = 1 + 0.018*Math.sin(time*.15 + i*.7);
        ctx.globalAlpha = (0.050 - t*.003) * (1 - t*.55) * breathe;
        ctx.strokeStyle = '#5BB8F5'; ctx.lineWidth = .35;
        ctx.beginPath();
        ctx.ellipse(VPX, VPY, t*W*.46*breathe, t*H*.34*breathe, 0, 0, PI2);
        ctx.stroke();
      }

      // Layer 4: drifting constellation nodes + proximity edges (spatially bucketed)
      // Update node positions and draw dots
      BG_NODES.forEach(n => {
        n.x = (n.x + n.dx + W) % W;
        n.y = (n.y + n.dy + H) % H;
        n.twk += .013;
        ctx.globalAlpha = n.a * (0.5 + 0.5*Math.sin(n.twk));
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, PI2);
        ctx.fillStyle = n.color; ctx.fill();
      });

      // Build spatial buckets for edge detection (replaces O(n²) with ~O(n))
      const buckets = new Array(cols * rows);
      for (let k = 0; k < buckets.length; k++) buckets[k] = [];
      BG_NODES.forEach((n, idx) => {
        const col = Math.min(Math.floor(n.x / CELL), cols - 1);
        const row = Math.min(Math.floor(n.y / CELL), rows - 1);
        buckets[row * cols + col].push(idx);
      });

      // Only check nodes in same or adjacent cells
      ctx.lineWidth = .38;
      for (let i = 0; i < BG_NODES.length; i++) {
        const ni = BG_NODES[i];
        const col = Math.min(Math.floor(ni.x / CELL), cols - 1);
        const row = Math.min(Math.floor(ni.y / CELL), rows - 1);
        for (let dr = 0; dr <= 1; dr++) {
          for (let dc = (dr === 0 ? 1 : -1); dc <= 1; dc++) {
            const nr = row + dr, nc = col + dc;
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
            const bucket = buckets[nr * cols + nc];
            for (let bi = 0; bi < bucket.length; bi++) {
              const j = bucket[bi];
              if (j <= i) continue;
              const nj = BG_NODES[j];
              const dx = nj.x - ni.x, dy = nj.y - ni.y;
              const d2 = dx*dx + dy*dy;
              if (d2 < PROX_SQ) {
                const d = Math.sqrt(d2); // sqrt only for pairs that pass
                ctx.globalAlpha = (1-d/105)*0.065*(0.5+0.5*Math.sin(ni.twk+nj.twk));
                ctx.strokeStyle = ni.color;
                ctx.beginPath(); ctx.moveTo(ni.x, ni.y); ctx.lineTo(nj.x, nj.y); ctx.stroke();
              }
            }
          }
        }
      }

      // Layer 5: center radial glow (cached gradient) - removed for better background match
      // ctx.globalAlpha = 1;
      // ctx.fillStyle = cachedCenterGlow; ctx.fillRect(0,0,W,H);

      // Layer 6: vignette corners (cached gradient) - removed for better background match
      // ctx.fillStyle = cachedVignette; ctx.fillRect(0,0,W,H);
      ctx.restore();
    }


    function drawGlobe(gx,gy,gr,alpha) {
      if (alpha<.005||!finite(gx,gy,gr)||gr<=0) return;
      ctx.save(); ctx.globalAlpha=alpha;
      const pulse=0.5+0.5*Math.sin(time*0.75);

      // Outer halo — vivid sky blue, brighter than before
      const halo=ctx.createRadialGradient(gx,gy,gr*.76,gx,gy,gr*(1.38+pulse*0.06));
      halo.addColorStop(0,`rgba(56,168,245,${(0.22+pulse*0.12).toFixed(3)})`);
      halo.addColorStop(.50,'rgba(56,168,245,0.06)');
      halo.addColorStop(1,'rgba(56,168,245,0)');
      ctx.beginPath(); ctx.arc(gx,gy,gr*1.48,0,PI2); ctx.fillStyle=halo; ctx.fill();
      const halo2=ctx.createRadialGradient(gx,gy,gr*1.24,gx,gy,gr*1.70);
      halo2.addColorStop(0,'rgba(100,180,255,0.08)'); halo2.addColorStop(1,'rgba(100,180,255,0)');
      ctx.beginPath(); ctx.arc(gx,gy,gr*1.70,0,PI2); ctx.fillStyle=halo2; ctx.fill();

      // Ocean — vivid saturated blue (not washed out pale)
      const ocean=ctx.createRadialGradient(gx-gr*.30,gy-gr*.26,gr*.04,gx,gy,gr);
      ocean.addColorStop(0,'rgba(42,130,220,0.97)');
      ocean.addColorStop(.36,'rgba(28,100,195,0.95)');
      ocean.addColorStop(.70,'rgba(16,68,158,0.92)');
      ocean.addColorStop(1,'rgba(8,40,110,0.88)');
      ctx.beginPath(); ctx.arc(gx,gy,gr,0,PI2); ctx.fillStyle=ocean; ctx.fill();

      ctx.save(); ctx.beginPath(); ctx.arc(gx,gy,gr-.5,0,PI2); ctx.clip();
      ctx.translate(gx,gy); ctx.rotate(TILT); ctx.translate(-gx,-gy);

      // Ice caps — bright white
      ctx.beginPath(); ctx.arc(gx,gy-gr*.96,4.5,0,PI2); ctx.fillStyle='rgba(230,245,255,0.90)'; ctx.fill();
      ctx.beginPath(); ctx.ellipse(gx,gy-gr*.88,gr*.26,gr*.09,0,0,PI2); ctx.fillStyle='rgba(215,238,255,0.55)'; ctx.fill();
      ctx.beginPath(); ctx.arc(gx,gy+gr*.96,3.2,0,PI2); ctx.fillStyle='rgba(215,238,255,0.55)'; ctx.fill();

      // Landmasses — rich saturated green, depth-shaded
      const blobs=[
        [ .08,-.29,.22,.14,.30],[ .24, .13,.15,.10,-.22],[-.31,-.09,.19,.13, .48],[-.12, .31,.17,.11,-.38],
        [ .36,-.16,.13,.09, .18],[-.26, .23,.11,.08, .10],[ .16,-.44,.10,.07, .20],[-.43, .16,.09,.06,-.18],
      ];
      blobs.forEach(([rx,ry,erx,ery,rot])=>{
        const ang=Math.atan2(ry,rx)+globeRot, dist=Math.sqrt(rx*rx+ry*ry);
        const bx=gx+Math.cos(ang)*dist*gr, by=gy+ry*gr, depA=c01(.5+Math.cos(ang)*.5);
        ctx.save(); ctx.globalAlpha=depA*.96; ctx.translate(bx,by); ctx.rotate(rot+globeRot*.35);
        ctx.beginPath(); ctx.ellipse(0,0,erx*gr,ery*gr,0,0,PI2);
        // Vivid grass green on lit side, deeper forest on shadow
        const lg=Math.round(lerp(60,158,depA)), lb=Math.round(lerp(30,60,depA));
        ctx.fillStyle=`rgba(38,${lg},${lb},0.94)`; ctx.fill();
        ctx.strokeStyle=`rgba(60,200,100,${(depA*0.40).toFixed(2)})`; ctx.lineWidth=.6; ctx.stroke();
        // Bright highlight inner
        ctx.globalAlpha=depA*.45; ctx.beginPath(); ctx.ellipse(0,0,erx*gr*.58,ery*gr*.58,0,0,PI2);
        ctx.fillStyle=`rgba(80,210,120,0.55)`; ctx.fill();
        ctx.restore();
      });

      // Latitude lines — vivid sky blue, clearly visible
      [-65,-42,-20,0,20,42,65].forEach(deg=>{
        const rad=deg*Math.PI/180, lr=gr*Math.cos(rad), ly=gy+gr*Math.sin(rad); if(lr<1) return;
        ctx.beginPath(); ctx.ellipse(gx,ly,lr,lr*.26,0,0,PI2);
        ctx.strokeStyle=deg===0
          ?`rgba(56,168,245,${(0.62+pulse*0.28).toFixed(3)})`
          :`rgba(80,170,240,${(0.18+Math.abs(Math.cos(rad))*.14).toFixed(3)})`;
        ctx.lineWidth=deg===0?1.4:.55; ctx.stroke();
      });

      // Longitude arcs — visible blue lines
      for(let i=0;i<14;i++){
        const a=i/14*Math.PI+globeRot, cosA=Math.cos(a), lrx=gr*Math.abs(cosA); if(lrx<2) continue;
        ctx.beginPath(); ctx.ellipse(gx,gy,lrx,gr,0,0,PI2);
        ctx.strokeStyle=`rgba(60,160,240,${(Math.abs(cosA)*.22).toFixed(3)})`; ctx.lineWidth=.5; ctx.stroke();
      }

      // City dots — distinct colors per city, properly saturated
      const cities=[
        {lon:0.520,lat:0.10,name:'MUMBAI',color:'#1A8FE3',active:true},
        {lon:0.525,lat:0.22,name:'DELHI', color:'#1A8FE3',active:false},
        {lon:0.002,lat:0.46,name:'LON',   color:'#9B59E8',active:false},
        {lon:-0.24,lat:0.39,name:'NYC',   color:'#E8A020',active:false},
        {lon:0.775,lat:0.33,name:'TOKYO', color:'#16A85A',active:false},
      ];
      cities.forEach(city=>{
        const ang=city.lon*PI2+globeRot, cosA=Math.cos(ang); if(cosA<0.08) return;
        const cx=gx+cosA*gr*0.94, cy=gy-city.lat*gr*0.94, depA=c01(cosA);
        ctx.save(); ctx.globalAlpha=depA*0.95;
        if(city.active){
          const p2=0.5+0.5*Math.sin(time*3.2+city.lon*10);
          ctx.beginPath();ctx.arc(cx,cy,5+p2*5,0,PI2);ctx.strokeStyle=city.color+'55';ctx.lineWidth=1;ctx.stroke();
          ctx.beginPath();ctx.arc(cx,cy,3+p2*2,0,PI2);ctx.strokeStyle=city.color+'33';ctx.lineWidth=1.5;ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(cx,cy,city.active?3.2:2,0,PI2); ctx.fillStyle=city.color; ctx.fill();
        ctx.font='500 6px "DM Sans",sans-serif'; ctx.fillStyle='rgba(8,30,60,0.85)';
        ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText(city.name,cx+5,cy);
        ctx.restore();
      });

      // Cloud patches — white, slightly more opaque
      [[-0.40,-0.34,.30,.044],[.15,-0.50,.24,.038],[-0.22,.41,.26,.040],[.31,.18,.20,.036]].forEach(([rcx,rcy,rw,rh])=>{
        const ang=Math.atan2(rcy,rcx)+globeRot*.5, dist=Math.sqrt(rcx*rcx+rcy*rcy);
        const cx=gx+Math.cos(ang)*dist*gr, cy=gy+rcy*gr, da=c01(.4+Math.cos(ang)*.6);
        ctx.save(); ctx.globalAlpha=da*.38; ctx.translate(cx,cy); ctx.rotate(ang);
        ctx.beginPath(); ctx.ellipse(0,0,rw*gr,rh*gr,0,0,PI2); ctx.fillStyle='rgba(255,255,255,0.92)'; ctx.fill(); ctx.restore();
      });

      // Atmospheric edge glow — subtle blue-white
      const atmo=ctx.createRadialGradient(gx-gr*.32,gy-gr*.28,gr*.60,gx-gr*.20,gy-gr*.16,gr*.98);
      atmo.addColorStop(0,'rgba(160,220,255,0.14)'); atmo.addColorStop(1,'rgba(160,220,255,0)');
      ctx.beginPath(); ctx.arc(gx,gy,gr,0,PI2); ctx.fillStyle=atmo; ctx.fill();

      // Specular highlight
      const spec=ctx.createRadialGradient(gx-gr*.40,gy-gr*.36,0,gx-gr*.26,gy-gr*.22,gr*.44);
      spec.addColorStop(0,'rgba(255,255,255,0.70)'); spec.addColorStop(.4,'rgba(255,255,255,0.16)'); spec.addColorStop(1,'rgba(255,255,255,0)');
      ctx.beginPath(); ctx.arc(gx,gy,gr,0,PI2); ctx.fillStyle=spec; ctx.fill();
      ctx.restore();

      // Axis tilt line
      ctx.save(); ctx.globalAlpha=alpha*.18; ctx.strokeStyle='#3AA8F0'; ctx.lineWidth=1; ctx.setLineDash([3,6]);
      ctx.beginPath(); ctx.moveTo(gx+gr*Math.sin(TILT),gy-gr*Math.cos(TILT)); ctx.lineTo(gx-gr*Math.sin(TILT),gy+gr*Math.cos(TILT));
      ctx.stroke(); ctx.setLineDash([]); ctx.restore();

      // Outer rim — vivid blue
      ctx.beginPath(); ctx.arc(gx,gy,gr,0,PI2); ctx.strokeStyle='rgba(56,168,245,0.55)'; ctx.lineWidth=1.4; ctx.stroke();
      ctx.beginPath(); ctx.arc(gx,gy,gr,Math.PI*.58,Math.PI*.96); ctx.strokeStyle='rgba(180,220,255,0.35)'; ctx.lineWidth=3.5; ctx.stroke();
      ctx.restore();
    }

    function drawParticles(gx,gy,gr,alpha) {
      if(alpha<.005) return;
      ctx.save();
      PARTICLES.forEach(p=>{
        p.ang+=p.spd;
        const px=gx+gr*p.dist*Math.cos(p.ang), py=gy+gr*p.dist*Math.sin(p.ang)*.50;
        ctx.globalAlpha=alpha*p.a; ctx.beginPath(); ctx.arc(px,py,p.r,0,PI2); ctx.fillStyle=p.color; ctx.fill();
      });
      ctx.restore();
    }

    function drawExchangeBadges(gx,gy,gr,alpha) {
      if(alpha<.005||!finite(gx,gy,gr)||gr<=0) return;
      ctx.save();
      EXCHANGES.forEach((ex,i)=>{
        const bx=gx+Math.cos(ex.ang)*ex.dR*gr, by=gy+Math.sin(ex.ang)*ex.dR*gr*0.44;
        const edgeX=gx+Math.cos(ex.ang)*gr*1.02, edgeY=gy+Math.sin(ex.ang)*gr*0.44;
        ctx.save(); ctx.globalAlpha=alpha*0.52; ctx.beginPath(); ctx.moveTo(edgeX,edgeY); ctx.lineTo(bx,by); ctx.strokeStyle=ex.color+'55'; ctx.lineWidth=0.8; ctx.setLineDash([2,4]); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
        const dotT=((time*0.55+i*0.26)%1), dotA=4*dotT*(1-dotT);
        ctx.save(); ctx.globalAlpha=alpha*dotA*0.9; ctx.beginPath(); ctx.arc(lerp(edgeX,bx,dotT),lerp(edgeY,by,dotT),2.5,0,PI2); ctx.fillStyle=ex.color; ctx.fill(); ctx.restore();
        ctx.save(); ctx.globalAlpha=alpha; const bw=66,bh=30;
        ctx.shadowColor=ex.color+'38'; ctx.shadowBlur=14; ctx.shadowOffsetY=3; rrect(bx-bw/2,by-bh/2,bw,bh,9);
        ctx.fillStyle='rgba(255,255,255,0.95)'; ctx.strokeStyle=ex.color+'50'; ctx.lineWidth=0.85; ctx.fill(); ctx.stroke(); ctx.shadowColor='transparent';
        const p3=0.5+0.5*Math.sin(time*2.8+i*1.3); ctx.beginPath(); ctx.arc(bx-bw/2+10,by,4+p3*2.5,0,PI2); ctx.fillStyle=ex.color+'28'; ctx.fill();
        ctx.beginPath(); ctx.arc(bx-bw/2+10,by,3.2,0,PI2); ctx.fillStyle=ex.color; ctx.fill();
        ctx.fillStyle='#0B2235'; ctx.font='600 9px "DM Sans",sans-serif'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText(ex.label,bx-bw/2+19,by-4.5);
        ctx.fillStyle=ex.color; ctx.font='500 8px "DM Sans",sans-serif'; ctx.fillText(ex.val,bx-bw/2+19,by+5.5); ctx.restore();
      });
      ctx.restore();
    }

    function drawMarketClock(gx,gy,gr,alpha,orbitP) {
      if(alpha<.005||!finite(gx,gy,gr)) return;
      ctx.save(); ctx.globalAlpha=alpha;
      const bx=Math.min(gx+gr*0.88,W-90), by=Math.max(gy-gr*0.82,46), bw=138,bh=34;
      const totalSecs=Math.round(orbitP*30*60), mm=Math.floor(totalSecs/60), ss2=totalSecs%60;
      const isOpen=orbitP>=0.98, timeStr=isOpen?'MARKET OPEN!':`09:${String(mm).padStart(2,'0')}:${String(ss2).padStart(2,'0')}`, dotColor=isOpen?'#22C55E':'#5BB8F5';
      ctx.shadowColor='rgba(91,184,245,0.18)'; ctx.shadowBlur=16; ctx.shadowOffsetY=3; rrect(bx-bw/2,by-bh/2,bw,bh,11);
      ctx.fillStyle='rgba(255,255,255,0.97)'; ctx.strokeStyle=isOpen?'rgba(34,197,94,0.42)':'rgba(91,184,245,0.28)'; ctx.lineWidth=1; ctx.fill(); ctx.stroke(); ctx.shadowColor='transparent';
      const dotP=0.5+0.5*Math.sin(time*4); ctx.beginPath(); ctx.arc(bx-bw/2+13,by,4+dotP*2.5,0,PI2); ctx.fillStyle=dotColor+'33'; ctx.fill();
      ctx.beginPath(); ctx.arc(bx-bw/2+13,by,3.5,0,PI2); ctx.fillStyle=dotColor; ctx.fill();
      ctx.fillStyle='#0B2235'; ctx.font='600 11.5px "DM Sans",monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(timeStr,bx+7,by-1);
      ctx.fillStyle='#94B8D0'; ctx.font='400 7px "DM Sans",sans-serif'; ctx.fillText(isOpen?'NSE / BSE LIVE':'UNTIL MARKET OPEN',bx+7,by+10);
      ctx.restore();
    }

    function drawTickerBand(gx,gy,gr,alpha,isFront) {
      if(alpha<.005||!finite(gx,gy,gr)||gr<=0) return;
      const RX=gr*1.46, RY=gr*0.28, cosT=Math.cos(TILT), sinT=Math.sin(TILT), BAND_H=20, ac=getArcTable(gr);
      const ep=theta=>({x:gx+RX*Math.cos(theta)*cosT-RY*Math.sin(theta)*sinT, y:gy+RX*Math.cos(theta)*sinT+RY*Math.sin(theta)*cosT});
      const tang=theta=>Math.atan2(-RX*Math.sin(theta)*sinT+RY*Math.cos(theta)*cosT,-RX*Math.sin(theta)*cosT-RY*Math.cos(theta)*sinT);
      ctx.save(); ctx.globalAlpha=alpha;
      const a0=isFront?Math.PI:0, a1=isFront?PI2:Math.PI;
      ctx.beginPath(); ctx.ellipse(gx,gy,RX,RY,TILT,a0,a1); ctx.strokeStyle=isFront?'rgba(91,184,245,0.18)':'rgba(91,184,245,0.04)'; ctx.lineWidth=BAND_H+4; ctx.lineCap='butt'; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(gx,gy,RX,RY,TILT,a0,a1); ctx.strokeStyle=isFront?'rgba(255,255,255,0.93)':'rgba(255,255,255,0.22)'; ctx.lineWidth=BAND_H; ctx.stroke();
      if(isFront){
        ctx.beginPath(); ctx.ellipse(gx,gy,RX-BAND_H*.30,RY-BAND_H*.10,TILT,a0,a1); ctx.strokeStyle='rgba(220,242,255,0.34)'; ctx.lineWidth=3.5; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(gx,gy,RX+BAND_H*.20,RY+BAND_H*.07,TILT,a0,a1); ctx.strokeStyle='rgba(91,184,245,0.07)'; ctx.lineWidth=2; ctx.stroke();
      }
      ctx.font='500 9px "DM Sans",sans-serif'; ctx.textBaseline='middle'; ctx.textAlign='center';
      const sHalf=thetaToArc(ac,Math.PI), sStart=isFront?sHalf:0, sEnd=isFront?ac.total:sHalf, REPS=Math.ceil((sEnd-sStart)/TOTAL_CHAR_W)+2;
      for(let rep=-1;rep<REPS;rep++){
        let cumW=0;
        for(let ci=0;ci<TC;ci++){
          const cw=CHAR_W[ci], sMid=sStart+rep*TOTAL_CHAR_W+cumW+cw/2-(tickerOff%TOTAL_CHAR_W); cumW+=cw;
          if(sMid<sStart-cw||sMid>sEnd+cw) continue;
          const theta=arcToTheta(ac,sMid), sinT_check=Math.sin(theta), isThisFront=sinT_check<=0;
          if(isThisFront!==isFront) continue;
          const depth=Math.abs(sinT_check), charA=isFront?lerp(0.56,1.0,depth):lerp(0.09,0.20,depth);
          const pt2=ep(theta), ang=tang(theta), chr=TICKER_CHARS[ci];
          ctx.save(); ctx.globalAlpha=alpha*charA; ctx.translate(pt2.x,pt2.y); ctx.rotate(ang); ctx.fillStyle=chr.c; ctx.fillText(chr.ch,0,0.5); ctx.restore();
        }
      }
      ctx.restore();
    }

    function drawOrbitalLine(gx,gy,gr,progress,alpha,color) {
      if(alpha<.005||progress<=0||!finite(gx,gy,gr)||gr<=0) return;
      const EQX=gr, EQY=gr*.25, sweep=progress*PI2, cosT=Math.cos(TILT), sinT=Math.sin(TILT);
      ctx.save(); ctx.globalAlpha=alpha;
      ctx.save(); ctx.beginPath(); ctx.ellipse(gx,gy,EQX,EQY,TILT,0,PI2); ctx.strokeStyle=color+'1E'; ctx.lineWidth=1; ctx.setLineDash([3,7]); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
      ctx.beginPath(); ctx.ellipse(gx,gy,EQX,EQY,TILT,0,sweep); ctx.shadowColor=color; ctx.shadowBlur=20; ctx.strokeStyle=color; ctx.lineWidth=2.8; ctx.lineCap='round'; ctx.stroke();
      ctx.save(); ctx.beginPath(); ctx.ellipse(gx,gy,EQX,EQY,TILT,0,sweep); ctx.strokeStyle='rgba(255,255,255,0.55)'; ctx.lineWidth=1.2; ctx.setLineDash([6,18]); ctx.lineDashOffset=-(time*22); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
      PACKETS.forEach(pkt=>{
        const progFrac=((pkt.phase+time*pkt.speed*2)%1); if(progFrac>progress) return;
        const pAng=progFrac*PI2, pcA=Math.cos(pAng), pcS=Math.sin(pAng);
        const px=gx+EQX*pcA*cosT-EQY*pcS*sinT, py=gy+EQX*pcA*sinT+EQY*pcS*cosT, depth=pcS>=0?0.45:1;
        ctx.save(); ctx.globalAlpha=alpha*depth*0.80; ctx.shadowColor=color; ctx.shadowBlur=6; rrect(px-2,py-2,4,4,1.2); ctx.fillStyle=color; ctx.fill(); ctx.restore();
      });
      const cosS=Math.cos(sweep), sinS=Math.sin(sweep);
      const dotX=gx+EQX*cosS*Math.cos(TILT)-EQY*sinS*Math.sin(TILT);
      const dotY=gy+EQX*cosS*Math.sin(TILT)+EQY*sinS*Math.cos(TILT);
      orbitTrail.push({x:dotX,y:dotY}); if(orbitTrail.length>24) orbitTrail.shift();
      for(let i=1;i<orbitTrail.length;i++){
        const ta=i/orbitTrail.length; ctx.save(); ctx.globalAlpha=alpha*ta*.52;
        ctx.strokeStyle=color; ctx.lineWidth=ta*5.5; ctx.lineCap='round';
        ctx.beginPath(); ctx.moveTo(orbitTrail[i-1].x,orbitTrail[i-1].y); ctx.lineTo(orbitTrail[i].x,orbitTrail[i].y); ctx.stroke(); ctx.restore();
      }
      ctx.shadowBlur=30; ctx.beginPath(); ctx.arc(dotX,dotY,7,0,PI2); ctx.fillStyle=color; ctx.fill(); ctx.shadowBlur=0;
      [14,20].forEach((r,ri)=>{const p=Math.sin(time*4+ri*1.2); ctx.beginPath(); ctx.arc(dotX,dotY,r+p*3,0,PI2); ctx.strokeStyle=color+(ri===0?'38':'1A'); ctx.lineWidth=1.5-ri*0.5; ctx.stroke();});
      ctx.beginPath(); ctx.arc(dotX,dotY,2.8,0,PI2); ctx.fillStyle='white'; ctx.fill();
      ctx.restore();
    }


    function drawChart(gx, gy, gr, progress, alpha, s) {
      if (alpha < .005 || progress <= 0 || !finite(gx,gy,gr) || gr <= 0) return;
      const { ox, chw, yBot, yTop, expandP } = getChartDims(gx, gy, gr, s);

      const pts  = RAW.map( (v,i) => ({ x: ox + (i/(RAW.length-1))*chw,  y: yBot - v*(yBot-yTop) }));
      const bPts = BENCH.map((v,i) => ({ x: ox + (i/(BENCH.length-1))*chw, y: yBot - v*(yBot-yTop) }));
      const N = pts.length;

      const raw_t  = c01(progress) * (N - 1);
      const nFull  = Math.min(N - 1, Math.floor(raw_t));
      const frac   = raw_t - nFull;
      let vis = pts.slice(0, nFull + 1);
      if (nFull < N - 1) {
        const a = pts[nFull], b = pts[nFull + 1];
        vis = [...vis, { x: lerp(a.x, b.x, frac), y: lerp(a.y, b.y, frac) }];
      }

      // Benchmark trails slightly behind for a nice staggered feel
      const braw_t = Math.max(0, raw_t - 1.2);
      const bnFull = Math.min(N - 1, Math.floor(braw_t));
      const bfrac  = braw_t - bnFull;
      let bVis = bPts.slice(0, bnFull + 1);
      if (bnFull < N - 1) {
        const a = bPts[bnFull], b = bPts[bnFull + 1];
        bVis = [...bVis, { x: lerp(a.x, b.x, bfrac), y: lerp(a.y, b.y, bfrac) }];
      }

      const tip = vis[vis.length - 1];
      ctx.save(); ctx.globalAlpha = alpha;

      if (expandP > 0.02) {
        const panelA = c01(expandP * 3.5) * 0.20;
        ctx.save(); ctx.globalAlpha = alpha * panelA;
        rrect(ox - 44, yTop - 30, chw + 88, (yBot - yTop) + 60, 22);
        const pg = ctx.createLinearGradient(ox, yTop, ox, yBot);
        pg.addColorStop(0, 'rgba(255,255,255,0.72)');
        pg.addColorStop(1, 'rgba(232,247,255,0.48)');
        ctx.fillStyle = pg;
        ctx.strokeStyle = 'rgba(91,184,245,0.22)';
        ctx.lineWidth = 1;
        ctx.fill(); ctx.stroke();
        ctx.restore();
      }


      ctx.font = '400 8px "DM Sans",sans-serif';
      ['₹0','₹25K','₹50K','₹75K','₹1L'].forEach((lbl, i) => {
        const gy2 = yBot - (i/4) * (yBot - yTop);
        // Each line reveals as the chart progress sweeps past it
        const lineReveal = c01((raw_t - i * (N/8)) / (N * 0.08));
        if (lineReveal <= 0) return;
        ctx.save(); ctx.globalAlpha = alpha * lineReveal;
        ctx.beginPath(); ctx.moveTo(ox, gy2); ctx.lineTo(ox + chw, gy2);
        ctx.strokeStyle = 'rgba(91,184,245,0.09)'; ctx.lineWidth = .5;
        ctx.setLineDash([3,8]); ctx.stroke(); ctx.setLineDash([]);
        ctx.globalAlpha = alpha * lineReveal * 0.44;
        ctx.fillStyle = '#7A9AB8'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.fillText(lbl, ox - 7, gy2);
        ctx.restore();
      });


      ctx.save();
      const bw2 = (chw / N) * 0.62;
      const volH = lerp(22, 40, expandP);
      RAW.forEach((v, i) => {
        const barReveal = c01((raw_t - i + 2.5) / 2.5);
        if (barReveal <= 0) return;
        const bx2 = ox + (i/(N-1)) * chw;
        const rising = v >= (RAW[Math.max(0,i-1)] || 0);
        const bh2 = Math.max(1, (0.25 + v * 0.75) * volH * barReveal);
        ctx.globalAlpha = alpha * 0.17 * barReveal;
        ctx.beginPath(); ctx.rect(bx2 - bw2/2, yBot - bh2, bw2, bh2);
        ctx.fillStyle = rising ? '#22C55E' : '#DC2626'; ctx.fill();
      });
      ctx.restore();


      if (bVis.length >= 2) {
        ctx.save(); ctx.globalAlpha = alpha * 0.38;
        ctx.beginPath(); catmullRom(bVis);
        ctx.strokeStyle = '#94B8D0'; ctx.lineWidth = 1.3; ctx.lineCap = 'round';
        ctx.setLineDash([4,7]); ctx.stroke(); ctx.setLineDash([]);
        const bTip = bVis[bVis.length - 1];
        ctx.globalAlpha = alpha * 0.52;
        ctx.fillStyle = '#94B8D0'; ctx.font = '400 7.5px "DM Sans",sans-serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText('BENCHMARK', bTip.x + 5, bTip.y);
        ctx.restore();
      }


      if (progress > 0.68) {
        const midIdx = Math.min(Math.floor(vis.length * 0.66), bVis.length - 1);
        if (midIdx >= 0 && midIdx < vis.length) {
          const ap = eOut3(c01((progress - 0.68) / 0.14));
          const mx = vis[midIdx].x + 22;
          const y1 = vis[midIdx].y;
          const y2 = bVis[Math.min(midIdx, bVis.length-1)].y;
          ctx.save(); ctx.globalAlpha = alpha * ap;
          ctx.beginPath(); ctx.moveTo(mx, y1+2); ctx.lineTo(mx, y2-2);
          ctx.strokeStyle = '#22C55E88'; ctx.lineWidth = 1; ctx.stroke();
          [[y1,1],[y2,-1]].forEach(([y,d])=>{
            ctx.beginPath(); ctx.moveTo(mx-3,y); ctx.lineTo(mx+3,y); ctx.lineTo(mx,y+d*5);
            ctx.closePath(); ctx.fillStyle = '#22C55E88'; ctx.fill();
          });
          const midY = (y1+y2)/2;
          rrect(mx+3, midY-9, 44, 18, 9);
          ctx.fillStyle = 'rgba(34,197,94,0.12)'; ctx.strokeStyle = 'rgba(34,197,94,0.38)';
          ctx.lineWidth = 0.8; ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#15803D'; ctx.font = '600 8px "DM Sans",sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('+340bps', mx+25, midY);
          ctx.restore();
        }
      }


      ctx.beginPath(); ctx.moveTo(vis[0].x, yBot);
      catmullRom(vis); ctx.lineTo(tip.x, yBot); ctx.closePath();
      const grd = ctx.createLinearGradient(0, yTop, 0, yBot);
      grd.addColorStop(0,   'rgba(34,197,94,0.26)');
      grd.addColorStop(0.65,'rgba(34,197,94,0.06)');
      grd.addColorStop(1,   'rgba(34,197,94,0)');
      ctx.fillStyle = grd; ctx.fill();


      ctx.shadowColor = '#22C55E'; ctx.shadowBlur = 14;
      ctx.beginPath(); catmullRom(vis);
      ctx.strokeStyle = '#22C55E'; ctx.lineWidth = 2.8;
      ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
      ctx.shadowBlur = 0;

      const scanFade = Math.sin(c01(progress * 1.06) * Math.PI) * 0.72;
      if (scanFade > 0.01) {
        ctx.save(); ctx.globalAlpha = alpha * scanFade;
        const sg = ctx.createLinearGradient(tip.x, yTop, tip.x, yBot);
        sg.addColorStop(0,    'rgba(34,197,94,0)');
        sg.addColorStop(0.30, 'rgba(34,197,94,0.42)');
        sg.addColorStop(0.72, 'rgba(34,197,94,0.20)');
        sg.addColorStop(1,    'rgba(34,197,94,0)');
        ctx.fillStyle = sg;
        ctx.fillRect(tip.x - 1.4, yTop, 2.8, yBot - yTop);
        ctx.restore();
      }


      ctx.save(); ctx.globalAlpha = alpha * 0.18;
      ctx.beginPath(); ctx.moveTo(ox, yBot); ctx.lineTo(ox + chw, yBot);
      ctx.strokeStyle = '#5BB8F5'; ctx.lineWidth = .5; ctx.stroke();
      ctx.restore();


      if (progress > 0.14) {
        const price = Math.round(progress * 240000);
        ctx.save(); ctx.globalAlpha = alpha * Math.min((progress-.14)/.14, 1);
        ctx.shadowColor = 'rgba(34,197,94,0.22)'; ctx.shadowBlur = 10;
        const lbl = '₹' + price.toLocaleString('en-IN');
        ctx.font = '600 11px "DM Sans",sans-serif';
        const lw = ctx.measureText(lbl).width + 18;
        rrect(tip.x - lw/2, tip.y - 33, lw, 20, 10);
        ctx.fillStyle = 'rgba(34,197,94,0.11)';
        ctx.strokeStyle = 'rgba(34,197,94,0.40)';
        ctx.lineWidth = 1; ctx.fill(); ctx.stroke();
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = '#15803D'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(lbl, tip.x, tip.y - 23);
        ctx.restore();
      }


      ctx.shadowBlur = 26;
      ctx.beginPath(); ctx.arc(tip.x, tip.y, 5.5, 0, PI2);
      ctx.fillStyle = '#22C55E'; ctx.fill(); ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(tip.x, tip.y, 5.5 + 4 + Math.sin(time*5)*2.5, 0, PI2);
      ctx.strokeStyle = 'rgba(34,197,94,0.24)'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.beginPath(); ctx.arc(tip.x, tip.y, 2, 0, PI2);
      ctx.fillStyle = 'white'; ctx.fill();

      ctx.restore();
    }

    function drawTimeLabels(gx, gy, gr, alpha, s) {
      if (alpha < .005 || !finite(gx,gy,gr) || gr <= 0) return;
      const { ox, chw, yBot } = getChartDims(gx, gy, gr, s);
      ['Jan','Apr','Jul','Oct','Dec'].forEach((l, i) => {
        const x = ox + (i/4)*chw;
        ctx.save(); ctx.globalAlpha = alpha * .50;
        ctx.font = '400 9px "DM Sans",sans-serif';
        ctx.fillStyle = '#7A9AB8'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText(l, x, yBot + 7);
        ctx.beginPath(); ctx.moveTo(x,yBot); ctx.lineTo(x,yBot+5);
        ctx.strokeStyle = '#7A9AB8'; ctx.lineWidth = 0.6; ctx.stroke();
        ctx.restore();
      });
    }

    function drawReturnStory(gx, gy, gr, progress, alpha, s) {
      if (alpha < .005 || progress <= 0 || !finite(gx,gy,gr) || gr <= 0) return;
      // Use the same fully-expanded chart dimensions so arcCX stays consistent
      const { ox, chw, yBot, yTop } = getChartDims(gx, gy, gr, s);
      const arcCX = ox + chw + 68, arcCY = yTop + 68;
      const arcR = 68, arcStart = -Math.PI*.75, arcSweep = progress * PI2 * .82;
      ctx.save(); ctx.globalAlpha = alpha;

      const arcP = eOut3(ph(progress, 0, .55));
      if (arcP > 0) {
        ctx.save(); ctx.shadowColor = '#22C55E'; ctx.shadowBlur = 18;
        ctx.beginPath(); ctx.arc(arcCX,arcCY,arcR,arcStart,arcStart+arcSweep*arcP);
        ctx.strokeStyle = '#22C55E'; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.arc(arcCX,arcCY,arcR,arcStart,arcStart+arcSweep*arcP);
        ctx.strokeStyle = 'rgba(255,255,255,0.58)'; ctx.lineWidth = 1.3;
        ctx.setLineDash([7,18]); ctx.lineDashOffset = -(time*24); ctx.stroke(); ctx.setLineDash([]);
        if (arcP > 0.5) {
          const tipA = arcStart+arcSweep*arcP, tx = arcCX+arcR*Math.cos(tipA), ty = arcCY+arcR*Math.sin(tipA), nA = tipA+Math.PI/2;
          ctx.fillStyle = '#22C55E'; ctx.shadowColor = '#22C55E'; ctx.shadowBlur = 10;
          ctx.beginPath(); ctx.moveTo(tx+Math.cos(nA)*7,ty+Math.sin(nA)*7); ctx.lineTo(tx-Math.cos(nA)*7,ty-Math.sin(nA)*7); ctx.lineTo(tx+Math.cos(tipA)*12,ty+Math.sin(tipA)*12); ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      }

      const counterP = eOut3(ph(progress, .30, .75));
      if (counterP > 0) {
        const val = Math.round(counterP*240000); ctx.save(); ctx.globalAlpha = alpha * counterP;
        const bw=122, bh=54, bx2=arcCX-bw/2, by2=arcCY-bh/2;
        ctx.shadowColor = 'rgba(34,197,94,0.22)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 5;
        rrect(bx2,by2,bw,bh,14);
        ctx.fillStyle = 'rgba(255,255,255,0.97)'; ctx.strokeStyle = 'rgba(34,197,94,0.30)';
        ctx.lineWidth = 1; ctx.fill(); ctx.stroke(); ctx.shadowColor = 'transparent';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(82,120,160,0.58)'; ctx.font = '400 7.5px "DM Sans",sans-serif';
        ctx.fillText('PORTFOLIO VALUE', arcCX, arcCY-12);
        ctx.fillStyle = '#0B2235'; ctx.font = '700 16px "DM Sans",sans-serif';
        ctx.fillText('₹'+val.toLocaleString('en-IN'), arcCX, arcCY+6);
        ctx.globalAlpha = alpha*counterP*0.38;
        ctx.beginPath(); ctx.strokeStyle = '#22C55E'; ctx.lineWidth = 1;
        for (let k=0;k<9;k++) {
          const sx=bx2+8+k*(bw-16)/8, sy=by2+bh-8-(0.3+Math.sin(k*0.85)*0.25)*12;
          k===0 ? ctx.moveTo(sx,sy) : ctx.lineTo(sx,sy);
        }
        ctx.stroke(); ctx.restore();
      }

      [{label:'EQUITY',val:'+22.4%',color:'#5BB8F5',pct:.62},{label:'BONDS',val:'+8.1%',color:'#22C55E',pct:.24},{label:'GOLD',val:'+14.2%',color:'#F59E0B',pct:.14}].forEach((chip,i) => {
        const chipP = eOut5(ph(progress,.52+i*.08,.80+i*.06)); if (chipP <= 0) return;
        const cx=arcCX+94+i*2, cy=arcCY-30+i*38;
        ctx.save(); ctx.globalAlpha = alpha * chipP;
        ctx.strokeStyle = chip.color+'55'; ctx.lineWidth = 1; ctx.setLineDash([2,4]);
        ctx.beginPath(); ctx.moveTo(arcCX+arcR*.55,arcCY+(i-1)*20); ctx.lineTo(cx-55,cy); ctx.stroke(); ctx.setLineDash([]);
        const cw=114, ch=26;
        rrect(cx-cw/2+2, cy-ch/2, cw, ch, 13);
        ctx.fillStyle = 'white'; ctx.strokeStyle = chip.color+'44'; ctx.lineWidth = .8;
        ctx.shadowColor = chip.color+'20'; ctx.shadowBlur = 8; ctx.fill(); ctx.stroke();
        ctx.shadowColor = 'transparent';
        ctx.beginPath(); ctx.arc(cx-cw/2+14,cy,4,0,PI2); ctx.fillStyle = chip.color; ctx.fill();
        ctx.fillStyle = '#1A3A5C'; ctx.font = '500 9px "DM Sans",sans-serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(chip.label, cx-cw/2+23, cy);
        ctx.fillStyle = chip.color; ctx.font = '600 9px "DM Sans",sans-serif';
        ctx.textAlign = 'right'; ctx.fillText(chip.val, cx+cw/2-2, cy);
        const barW=46, barH=3, barX=cx-cw/2+66, barY=cy+8;
        rrect(barX,barY,barW,barH,2); ctx.fillStyle = chip.color+'20'; ctx.fill();
        rrect(barX,barY,barW*chip.pct,barH,2); ctx.fillStyle = chip.color; ctx.fill();
        ctx.restore();
      });

      const cycleP = eOut3(ph(progress, .84, 1.0));
      if (cycleP > 0) {
        ctx.save(); ctx.globalAlpha = alpha * cycleP;
        const bx3 = arcCX-70, by3 = arcCY+arcR+18;
        ctx.shadowColor = 'rgba(91,184,245,0.18)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 3;
        rrect(bx3,by3,140,28,14);
        ctx.fillStyle = 'rgba(241,249,255,0.97)'; ctx.strokeStyle = 'rgba(91,184,245,0.30)';
        ctx.lineWidth = .8; ctx.fill(); ctx.stroke(); ctx.shadowColor = 'transparent';
        const spinA = time*1.4;
        ctx.save(); ctx.translate(bx3+14,by3+14);
        ctx.beginPath(); ctx.arc(0,0,5,spinA,spinA+PI2*0.78);
        ctx.strokeStyle = '#5BB8F5'; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.stroke();
        const aEnd = spinA+PI2*0.78;
        ctx.beginPath(); ctx.arc(5*Math.cos(aEnd),5*Math.sin(aEnd),1.8,0,PI2);
        ctx.fillStyle = '#5BB8F5'; ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#5BB8F5'; ctx.font = '500 9px "DM Sans",sans-serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText('REINVESTING · 09:30 DAILY', bx3+26, by3+14);
        ctx.restore();
      }
      ctx.restore();
    }

    function drawPhaseDots(s) {
      if (s < 0.02) return;
      const phaseIdx = s<0.42?0:s<0.82?1:2, cx0 = W/2-22;
      [0,1,2].forEach(i => {
        const active=i===phaseIdx, done=i<phaseIdx, cx2=cx0+i*22, cy2=H-22;
        ctx.save(); ctx.globalAlpha = active?1:done?0.55:0.22;
        ctx.beginPath(); ctx.arc(cx2,cy2,active?4.5:3,0,PI2);
        ctx.fillStyle = active?'#5BB8F5':done?'#22C55E':'rgba(91,184,245,0.5)';
        if (active) { ctx.shadowColor='#5BB8F5'; ctx.shadowBlur=10; }
        ctx.fill(); ctx.restore();
      });
    }


    let rafId;
    let lastFrame = 0;
    const FRAME_INTERVAL = 1000 / 60; // 60fps for smooth scroll

    function render(timestamp) {
      // Skip rendering when off-screen
      if (!isVisible) return;

      // Light throttle to prevent excessive rendering
      if (timestamp - lastFrame < FRAME_INTERVAL) {
        rafId = requestAnimationFrame(render);
        return;
      }
      lastFrame = timestamp;

      ctx.clearRect(0,0,W,H);
      // Standard increments for 60fps
      time += 0.020; globeRot += 0.0022; tickerOff += 0.72;
      const s = SP;

      const BASE_GX=W/2, BASE_GY=H/2-8, BASE_GR=128;
      const zoomP  = eOut5(ph(s,0.00,0.22)), gScale = lerp(1.0,1.52,zoomP);
      const gr     = Math.max(1, BASE_GR*(isFinite(gScale)?gScale:1));
      const gxZ    = lerp(BASE_GX,W*.285,zoomP), gyZ = lerp(BASE_GY,H/2,zoomP);
      const exitP  = eOut3(ph(s,0.40,0.62));
      const gx     = isFinite(exitP)?lerp(gxZ,-gr*1.4,exitP):gxZ, gy=gyZ;

      const globeA = 1 - eio(ph(s,0.38,0.60));
      const tickA  = c01(1 - eio(ph(s,0.28,0.48)));
      const partA  = globeA;
      if (s<0.02||exitP>.98) orbitTrail=[];
      const orbitP = eOut3(ph(s,0.02,0.42));
      const orbitA = c01(eio(ph(s,0.02,0.12))) * (1-eio(ph(s,0.40,0.56)));
      const colorT = eio(ph(s,0.34,0.48));
      const lineCol= lerpHex('#5BB8F5','#22C55E',colorT);
      // FIX: wider alpha window → chart fades in more gradually (was 0.44-0.56)
      const chartP = eOut5(ph(s,0.44,0.90));
      const chartA = eio(ph(s,0.44,0.64));
      const labA   = eOut3(ph(s,0.65,0.78));
      const retP   = eOut5(ph(s,0.82,1.00));
      const retA   = eio(ph(s,0.82,0.90));
      const badgeA = eio(ph(s,0.08,0.20)) * (1-eio(ph(s,0.32,0.42)));
      const clockA = eio(ph(s,0.04,0.15)) * (1-eio(ph(s,0.32,0.42)));

      if (s<0.02)      pt.textContent = '';
      else if (s<0.42) pt.textContent = 'ORBITAL  //  PHASE 01';
      else if (s<0.82) pt.textContent = 'MARKETS  //  PHASE 02';
      else             pt.textContent = 'RETURNS  //  PHASE 03';

      drawBackground();
      drawParticles(gx,gy,gr,partA*.50);
      drawTickerBand(gx,gy,gr,tickA,false);
      drawGlobe(gx,gy,gr,globeA);
      drawTickerBand(gx,gy,gr,tickA,true);
      drawExchangeBadges(gx,gy,gr,badgeA);
      drawMarketClock(gx,gy,gr,clockA,orbitP);
      drawOrbitalLine(gx,gy,gr,orbitP,orbitA,lineCol);
      // Pass s so chart/labels/returnStory all share the same expanded dimensions
      drawChart(gx,gy,gr,chartP,chartA,s);
      drawTimeLabels(gx,gy,gr,labA,s);
      drawReturnStory(gx,gy,gr,retP,retA,s);
      drawPhaseDots(s);

      rafId = requestAnimationFrame(render);
    }

    // Visibility observer: start/stop RAF loop based on viewport intersection
    const visObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible) {
          lastFrame = 0; // reset throttle
          rafId = requestAnimationFrame(render);
        } else {
          cancelAnimationFrame(rafId);
        }
      },
      { threshold: 0 }
    );
    visObserver.observe(scroller);

    return () => {
      visObserver.disconnect();
      scroller.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Fraunces:opsz,wght@9..144,700;9..144,900&display=swap');
        .omni-outer {
          width: 100%;
          height: 100vh;
          overflow-y: scroll;
          overflow-x: hidden;
          position: relative;
          scrollbar-width: none;
          -ms-overflow-style: none;
          touch-action: pan-y;
          contain: strict;
          isolation: isolate;
          -webkit-overflow-scrolling: touch;
        }
        .omni-outer::-webkit-scrollbar { display: none; }
        .omni-track { height: 420vh; position: relative; contain: size layout; }
        .omni-sticky {
          position: sticky;
          top: 0;
          height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: #EDF5FB;
          contain: layout style paint;
          will-change: transform;
          transform: translateZ(0);
        }
        .omni-canvas {
          display: block;
          width: 100%;
          max-width: 900px;
          height: auto;
          min-height: 220px;
          pointer-events: none;
          will-change: contents;
          border: none;
          outline: none;
          margin: 0;
          padding: 0;
        }
        .omni-hint {
          position: absolute; bottom: 90px; left: 50%; transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          transition: opacity .5s; font-family: 'DM Sans', sans-serif;
        }
        .omni-hint.hidden { opacity: 0; pointer-events: none; }
        .omni-hint span { font-size: 10px; letter-spacing: .2em; color: #8eafc6; text-transform: uppercase; }
        .omni-hint-line {
          width: 1px; height: 28px;
          background: linear-gradient(to bottom, transparent, #5BB8F5);
          animation: omni-hp 1.8s ease-in-out infinite;
        }
        @keyframes omni-hp { 0%,100%{opacity:.3;transform:scaleY(.5)} 50%{opacity:1;transform:scaleY(1)} }
        .omni-phase {
          position: absolute; bottom: 38px; right: 48px;
          font-size: 9px; letter-spacing: .2em; color: #8AAEC8;
          text-transform: uppercase; font-family: 'DM Sans', sans-serif;
        }
      `}</style>

      <div className="omni-outer" ref={scrollerRef} data-lenis-prevent>
        <div className="omni-track" ref={trackRef}>
          <div className="omni-sticky">
            <canvas ref={canvasRef} className="omni-canvas" width={900} height={520} />
            <div className="omni-hint" ref={hintRef}>
              <span>Scroll to explore</span>
              <div className="omni-hint-line" />
            </div>
            <div className="omni-phase" ref={phaseTagRef} />
          </div>
        </div>
      </div>
    </>
  );
}
