/* Vault site — languages. English is the source and what search engines index.
   The other languages live in /assets/i18n/<page>.<lang>.json (English text → translation) and are loaded
   only for visitors who pick them. The choice is stored in localStorage 'vaultLang', the same key the app's
   sign-in screen reads, so the app opens in the same language. Load this file in <head>, before vx.js. */
(function(){
  'use strict';
  var LANGS=[['en','English'],['it','Italiano'],['es','Español'],['fr','Français'],['de','Deutsch'],['zh','中文'],['ja','日本語'],['ru','Русский'],['pl','Polski']];
  var root=document.documentElement, PAGE=root.getAttribute('data-i18n-page')||'home';
  var lang='en';
  try{var saved=localStorage.getItem('vaultLang');if(saved&&LANGS.some(function(l){return l[0]===saved;}))lang=saved;}catch(e){}
  var INLINE={B:1,STRONG:1,EM:1,A:1,BR:1,SPAN:1,I:1,U:1,SMALL:1,MARK:1};
  var SKIP={SCRIPT:1,STYLE:1,NOSCRIPT:1,SVG:1,TEMPLATE:1,svg:1};
  var ATTRS=['aria-label','placeholder','alt','title'];
  function norm(s){return String(s||'').replace(/\s+/g,' ').trim();}
  function inlineOnly(el){for(var i=0;i<el.children.length;i++){var c=el.children[i];if(!INLINE[c.tagName]||!inlineOnly(c))return false;}return true;}
  function isLeaf(el){var own=false;for(var i=0;i<el.childNodes.length;i++){var n=el.childNodes[i];if(n.nodeType===3&&norm(n.nodeValue))own=true;}return own&&inlineOnly(el);}
  function units(){
    var out=[];
    (function walk(el){
      if(SKIP[el.tagName]||el.hasAttribute('data-noi18n'))return;
      if(el!==document.body&&isLeaf(el)){out.push({k:norm(el.innerHTML),el:el,t:'h'});return;}
      for(var i=0;i<el.childNodes.length;i++){var n=el.childNodes[i];
        if(n.nodeType===3){var v=norm(n.nodeValue);if(v&&/[A-Za-z]/.test(v))out.push({k:v,n:n,t:'t'});}
        else if(n.nodeType===1)walk(n);}
    })(document.body);
    document.querySelectorAll('['+ATTRS.join('],[')+']').forEach(function(el){if(el.closest('[data-noi18n]'))return;
      ATTRS.forEach(function(a){var v=norm(el.getAttribute(a));if(v&&/[A-Za-z]/.test(v))out.push({k:v,el:el,t:'a',a:a});});});
    return out;
  }
  var dict=null;
  function apply(){
    if(!dict)return;
    units().forEach(function(u){var tr=dict[u.k];if(!tr)return;
      if(u.t==='h')u.el.innerHTML=tr;
      else if(u.t==='t'){var raw=u.n.nodeValue;u.n.nodeValue=raw.match(/^\s*/)[0]+tr+raw.match(/\s*$/)[0];}
      else u.el.setAttribute(u.a,tr);});
    var tt=dict[norm(document.title)];if(tt)document.title=tt;
  }
  window.VXT=function(s){return (dict&&dict[s])||s;};
  window.VXI18N={langs:LANGS,lang:lang,collect:function(){var seen={},keys=[];units().forEach(function(u){if(!seen[u.k]){seen[u.k]=1;keys.push(u.k);}});
    var tt=norm(document.title);if(tt&&!seen[tt])keys.push(tt);return keys;}};

  // the extraction tool sets __vxExtract: leave the English page untouched
  if(window.__vxExtract){window.__vxI18n=new Promise(function(){});return;}

  function domReady(){return new Promise(function(r){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',r);else r();});}
  if(lang==='en'){window.__vxI18n=Promise.resolve();}
  else{
    root.lang=lang; root.classList.add('i18n-wait');
    var work=Promise.all([fetch('/assets/i18n/'+PAGE+'.'+lang+'.json?v=1').then(function(r){return r.ok?r.json():null;}).catch(function(){return null;}),domReady()])
      .then(function(r){dict=r[0];try{apply();}catch(e){}});
    // never keep the page hidden or the animations waiting for long, even on a slow network
    window.__vxI18n=Promise.race([work,new Promise(function(r){setTimeout(r,2500);})]).then(function(){root.classList.remove('i18n-wait');});
  }

  /* ── the language switcher in the nav ── */
  function switcher(){
    var host=document.querySelector('[data-lang-host]');if(!host)return;
    var cur=LANGS.filter(function(l){return l[0]===lang;})[0];
    var w=document.createElement('div');w.className='lang';w.setAttribute('data-noi18n','');
    w.innerHTML='<button type="button" class="lang-btn" aria-haspopup="listbox" aria-expanded="false" aria-label="Language">'
      +'<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M1.5 8h13M8 1.5c2 2.2 2.8 4.2 2.8 6.5S10 12.3 8 14.5M8 1.5C6 3.7 5.2 5.7 5.2 8S6 12.3 8 14.5" fill="none" stroke="currentColor" stroke-width="1.1"/></svg>'
      +'<span>'+cur[0].toUpperCase()+'</span></button>'
      +'<ul class="lang-menu" role="listbox" aria-label="Language">'+LANGS.map(function(l){return '<li role="option" aria-selected="'+(l[0]===lang)+'"><button type="button" data-l="'+l[0]+'"'+(l[0]===lang?' class="on"':'')+'>'+l[1]+'<em>'+l[0].toUpperCase()+'</em></button></li>';}).join('')+'</ul>';
    host.parentNode.insertBefore(w,host);
    var btn=w.querySelector('.lang-btn');
    function close(){w.classList.remove('open');btn.setAttribute('aria-expanded','false');}
    btn.addEventListener('click',function(e){e.stopPropagation();var o=!w.classList.contains('open');w.classList.toggle('open',o);btn.setAttribute('aria-expanded',String(o));});
    document.addEventListener('click',function(e){if(!w.contains(e.target))close();});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')close();});
    w.querySelectorAll('[data-l]').forEach(function(b){b.addEventListener('click',function(){var l=b.getAttribute('data-l');
      try{localStorage.setItem('vaultLang',l);}catch(e){} if(l!==lang)location.reload(); else close();});});
  }
  domReady().then(switcher);
})();
