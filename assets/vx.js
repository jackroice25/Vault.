/* Vault motion system — public site. No libraries; progressive enhancement only:
   without JS (or with reduced motion) every element is simply visible. */
(function(){
  var RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE=window.matchMedia&&matchMedia('(hover: hover) and (pointer: fine)').matches;
  var VX=window.VX={reduced:RM,fine:FINE};

  /* ── one rAF-throttled scroll/resize loop shared by every scroll effect ── */
  var subs=[],queued=false;
  function tick(){queued=false;for(var i=0;i<subs.length;i++)subs[i]();}
  function req(){if(!queued){queued=true;requestAnimationFrame(tick);}}
  VX.onScroll=function(fn){subs.push(fn);fn();};
  addEventListener('scroll',req,{passive:true});addEventListener('resize',req);

  /* ── reveals ── */
  function reveal(root){
    var els=(root||document).querySelectorAll('[data-r]:not(.in),.lines:not(.in),[data-in]:not(.in),.divider:not(.in)');
    // stagger children of [data-stagger] automatically
    (root||document).querySelectorAll('[data-stagger]').forEach(function(g){[].forEach.call(g.children,function(c,i){if(!c.style.getPropertyValue('--i'))c.style.setProperty('--i',i);});});
    if(RM||!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('in');});return;}
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{rootMargin:'0px 0px -10% 0px',threshold:.08});
    els.forEach(function(e){io.observe(e);});
    // failsafe: never leave content hidden (e.g. print, odd browsers)
    setTimeout(function(){els.forEach(function(e){var r=e.getBoundingClientRect();if(r.top<innerHeight)e.classList.add('in');});},2600);
  }
  VX.reveal=reveal;

  /* ── scroll-scrubbed words: [data-words] lights words up as the paragraph crosses the screen ── */
  function words(){
    document.querySelectorAll('[data-words]').forEach(function(p){
      var walk=function(n){[].slice.call(n.childNodes).forEach(function(c){
        if(c.nodeType===3){var f=document.createDocumentFragment();c.textContent.split(/(\s+)/).forEach(function(t){if(!t)return;if(/^\s+$/.test(t)){f.appendChild(document.createTextNode(t));}else{var s=document.createElement('span');s.className='w';s.textContent=t;f.appendChild(s);}});n.replaceChild(f,c);}
        else if(c.nodeType===1)walk(c);});};
      walk(p);p.classList.add('words');
      var ws=p.querySelectorAll('.w');
      if(RM){ws.forEach(function(w){w.classList.add('on');});return;}
      VX.onScroll(function(){
        var r=p.getBoundingClientRect(),start=innerHeight*.86,end=innerHeight*.38;
        var t=Math.max(0,Math.min(1,(start-r.top)/((start-end)+r.height*.6)));
        var n=Math.round(t*ws.length);
        for(var i=0;i<ws.length;i++)ws[i].classList.toggle('on',i<n);
      });
    });
  }

  /* ── cursor light + pointer parallax ── */
  function pointer(){
    if(!FINE||RM)return;
    document.querySelectorAll('[data-light]').forEach(function(el){
      var raf=0,x=0,y=0;
      el.addEventListener('pointermove',function(e){var r=el.getBoundingClientRect();x=e.clientX-r.left;y=e.clientY-r.top;
        if(!raf)raf=requestAnimationFrame(function(){raf=0;el.style.setProperty('--mx',x+'px');el.style.setProperty('--my',y+'px');});},{passive:true});
      el.addEventListener('pointerenter',function(){el.classList.add('lit');});
      el.addEventListener('pointerleave',function(){el.classList.remove('lit');});
    });
    // [data-depth] children drift a few px toward the cursor (2D only — 3D depth blurs text)
    document.querySelectorAll('[data-parallax]').forEach(function(host){
      var items=host.querySelectorAll('[data-depth]'),raf=0,px=0,py=0;
      host.addEventListener('pointermove',function(e){var r=host.getBoundingClientRect();px=(e.clientX-r.left)/r.width-.5;py=(e.clientY-r.top)/r.height-.5;
        if(!raf)raf=requestAnimationFrame(function(){raf=0;items.forEach(function(it){var d=+it.dataset.depth;it.style.translate=(px*d).toFixed(1)+'px '+(py*d).toFixed(1)+'px';});});},{passive:true});
      host.addEventListener('pointerleave',function(){items.forEach(function(it){it.style.translate='0 0';});});
    });
  }

  /* ── scroll parallax: [data-speed] moves at a fraction of the scroll ── */
  function parallax(){
    if(RM)return;
    var els=[].slice.call(document.querySelectorAll('[data-speed]'));
    if(!els.length)return;
    VX.onScroll(function(){
      var vh=innerHeight;
      els.forEach(function(el){var r=el.parentElement.getBoundingClientRect();if(r.bottom<-200||r.top>vh+200)return;
        var c=(r.top+r.height/2-vh/2)/vh;el.style.transform='translate3d(0,'+(c*+el.dataset.speed*-100).toFixed(1)+'px,0)';});
    });
  }

  /* ── sticky story: the step closest to the middle of the screen is the active one ── */
  function stories(){
    document.querySelectorAll('[data-story]').forEach(function(root){
      var steps=[].slice.call(root.querySelectorAll('[data-step]')),cur=-1;
      function set(i){if(i===cur)return;cur=i;root.dataset.active=i;
        steps.forEach(function(s,k){s.classList.toggle('on',k===i);});
        root.querySelectorAll('[data-panel]').forEach(function(p){p.classList.toggle('on',+p.dataset.panel===i);});
        root.querySelectorAll('[data-dot]').forEach(function(d){d.classList.toggle('on',+d.dataset.dot===i);d.setAttribute('aria-current',+d.dataset.dot===i?'step':'false');});
        var bar=root.querySelector('[data-progress]');if(bar)bar.style.transform='scaleY('+((i+1)/steps.length)+')';}
      VX.onScroll(function(){var mid=innerHeight/2,best=0,dist=1e9;
        steps.forEach(function(s,k){var r=s.getBoundingClientRect(),d=Math.abs(r.top+r.height/2-mid);if(d<dist){dist=d;best=k;}});set(best);});
      root.querySelectorAll('[data-dot]').forEach(function(d){d.addEventListener('click',function(){var i=+d.dataset.dot;set(i);steps[i].scrollIntoView({behavior:RM?'auto':'smooth',block:'center'});});});
    });
  }

  /* ── pause infinite marquees while off screen (saves battery) ── */
  function marquees(){
    if(!('IntersectionObserver' in window))return;
    var io=new IntersectionObserver(function(es){es.forEach(function(e){e.target.classList.toggle('paused',!e.isIntersecting);});});
    document.querySelectorAll('[data-marquee]').forEach(function(m){io.observe(m);});
  }

  /* ── billing toggle: [data-billing] root, buttons [data-period] ── */
  function billing(){
    document.querySelectorAll('[data-billing]').forEach(function(root){
      var btns=root.querySelectorAll('[data-period]');
      btns.forEach(function(b){b.addEventListener('click',function(){var p=b.dataset.period;
        document.querySelectorAll('[data-billing-target]').forEach(function(t){t.dataset.period=p;});
        root.dataset.period=p;btns.forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false');});});});
    });
  }

  function nav(){
    var n=document.getElementById('nav');if(!n)return;
    VX.onScroll(function(){n.classList.toggle('scrolled',scrollY>12);});
  }

  function init(){reveal();words();pointer();parallax();stories();marquees();billing();nav();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
