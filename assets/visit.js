/* Vault site: anonymous visit count + campaign tags passed to the app. No cookies, no storage, no identifiers.
   Skipped when the browser sends Global Privacy Control / Do Not Track. */
(function(){try{
  if(location.hostname!=='vaultwishlist.com') return;
  var q=new URLSearchParams(location.search), cl=function(v){return (v||'').replace(/[^a-z0-9_.-]/gi,'').slice(0,40);};
  var tags={utm_source:cl(q.get('utm_source')),utm_medium:cl(q.get('utm_medium')),utm_campaign:cl(q.get('utm_campaign')),utm_content:cl(q.get('utm_content'))};
  // 1) "Open Vault" buttons carry this visit's campaign tags into the app (attribution of sign-ups/first saves)
  var extra=Object.keys(tags).filter(function(k){return tags[k];}).map(function(k){return k+'='+encodeURIComponent(tags[k]);}).join('&');
  if(extra){ document.querySelectorAll('a[href^="/app"],a[href^="https://vaultwishlist.com/app"]').forEach(function(a){ a.href+= (a.href.indexOf('?')<0?'?':'&')+extra; }); }
  // 2) anonymous page view (page, campaign tags, referring domain)
  if(navigator.globalPrivacyControl===true||navigator.doNotTrack==='1') return;
  var page=location.pathname.replace(/^\/+|\.html$/g,'')||'home', props={page:page,src:page,p:'site'};
  if(tags.utm_source) props.usrc=tags.utm_source; if(tags.utm_medium) props.med=tags.utm_medium;
  if(tags.utm_campaign) props.camp=tags.utm_campaign; if(tags.utm_content) props.cre=tags.utm_content;
  try{ if(document.referrer){ var h=new URL(document.referrer).hostname; if(h&&h!==location.hostname) props.ref=h.slice(0,60); } }catch(e){}
  fetch('https://ottgafbrcogkmflnisbh.supabase.co/rest/v1/rpc/log_event',{method:'POST',
    headers:{'Content-Type':'application/json',apikey:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90dGdhZmJyY29na21mbG5pc2JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3Nzc4NDEsImV4cCI6MjA5ODM1Mzg0MX0.002lqUQ2LpAqQYHdje-3L9aD19MwzyMUjCvOKG1xifU',Authorization:'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90dGdhZmJyY29na21mbG5pc2JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3Nzc4NDEsImV4cCI6MjA5ODM1Mzg0MX0.002lqUQ2LpAqQYHdje-3L9aD19MwzyMUjCvOKG1xifU'},
    body:JSON.stringify({p_name:'page_view',p_device:'',p_props:props})}).catch(function(){});
}catch(e){}})();
