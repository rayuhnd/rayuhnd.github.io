(function(){
var CH='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+-=<>?/\\|{}[]~;:';
var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var rnd=function(){return CH[Math.floor(Math.random()*CH.length)]};
var scramble=function(s,n){var o='';for(var i=0;i<s.length;i++){o+=(i<n||/\s/.test(s[i]))?s[i]:rnd()}return o};
function run(el){
 var txt=el.dataset.txt,len=txt.length,dur=Math.min(500+len*14,1800),t0=performance.now();
 el.style.minHeight=el.offsetHeight+'px';el.classList.add('scr');
 (function tick(now){
  var p=Math.min((now-t0)/dur,1),n=Math.floor(p*len);
  if(p<1){el.textContent=scramble(txt,n);requestAnimationFrame(tick)}
  else{el.textContent=txt;el.classList.remove('scr');el.style.minHeight=''}
 })(t0);
}
if(!reduce&&'IntersectionObserver' in window){
 var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){io.unobserve(e.target);run(e.target)}})},{threshold:.2});
 document.querySelectorAll('h1,h2,h4,h3,.sub,.eyebrow,.yr,.tag,.org,.group,.card p,.hero p,.item li,#about p,.btn,.chips span,.links a').forEach(function(el){
  if(el.children.length||!el.textContent.trim())return;
  el.dataset.txt=el.textContent;el.textContent=scramble(el.dataset.txt,0);io.observe(el);
 });
}
})();
document.querySelectorAll('[data-go]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();var t=document.getElementById(a.dataset.go);if(t)t.scrollIntoView({behavior:'smooth'})}));
