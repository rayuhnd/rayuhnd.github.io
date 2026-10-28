(function(){
var CH='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+-=<>?/\\|{}[]~;:';
var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var rnd=function(){return CH[Math.floor(Math.random()*CH.length)]};
var scramble=function(s,n){var o='';for(var i=0;i<s.length;i++){o+=(i<n||/\s/.test(s[i]))?s[i]:rnd()}return o};
function run(el){
 var txt=el.dataset.txt,len=txt.length,dur=Math.min(700+len*10,1500),t0=performance.now(),lastScramble=0,scrambled=scramble(txt,0);
 el.style.minHeight=el.offsetHeight+'px';el.classList.add('scr');
 (function tick(now){
  var p=Math.min((now-t0)/dur,1),n=Math.floor(p*len);
  if(p<1){
   if(now-lastScramble>=100){scrambled=scramble(txt,n);lastScramble=now}
   el.textContent=scrambled;requestAnimationFrame(tick)
  }
  else{el.textContent=txt;el.classList.remove('scr');el.style.minHeight=''}
 })(t0);
}
if(!reduce&&'IntersectionObserver' in window){
 var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){io.unobserve(e.target);run(e.target)}})},{threshold:.2});
 document.querySelectorAll('h1,h2,h3,h4').forEach(function(el){
  if(el.children.length||!el.textContent.trim())return;
  el.dataset.txt=el.textContent;el.textContent=scramble(el.dataset.txt,0);io.observe(el);
 });
}
})();
document.querySelectorAll('[data-go]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();var t=document.getElementById(a.dataset.go);if(t)t.scrollIntoView({behavior:'smooth'})}));
(function(){
var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
if(window.innerWidth<=1099)return;
var canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
if(!ctx)return;
canvas.className='matrix-rain';canvas.setAttribute('aria-hidden','true');
document.body.insertBefore(canvas,document.body.firstChild);
var width=0,height=0,ratio=1,streams=[],lastFrame=0,accent='';
var cell=14,center=520;
var matrixChars='!"#¤%&/()=?^*@£$€{[]}asdfghjklöäqwertyuiopåzxcvbnm0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
var japaneseChars='あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
function randomMatrixChar(){
 if(Math.random()<.5)return matrixChars[Math.floor(Math.random()*matrixChars.length)];
 var group=Math.floor(Math.random()*3);
 if(group===0)return japaneseChars[Math.floor(Math.random()*japaneseChars.length)];
 var code=group===1?0x3041+Math.floor(Math.random()*0x56):0x4e00+Math.floor(Math.random()*0x5200);
 return String.fromCharCode(code);
}
function resize(){
 width=window.innerWidth;height=window.innerHeight;ratio=Math.min(window.devicePixelRatio||1,2);
 canvas.width=width*ratio;canvas.height=height*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);
 accent=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()||'#3ddbb8';
 streams=[];
 var leftEnd=Math.max(0,width/2-center),rightStart=Math.min(width,width/2+center);
 function addSide(start,end){
  for(var x=start+12;x<end-8;x+=18)streams.push({x:x,y:Math.random()*height,speed:30+Math.random()*65,length:8+Math.floor(Math.random()*14),chars:[]});
 }
 addSide(0,leftEnd);addSide(rightStart,width);
 render(0);
}
function render(delta){
 ctx.clearRect(0,0,width,height);ctx.font='12px Consolas, "Courier New", monospace';ctx.textAlign='center';
 streams.forEach(function(stream){
  if(!reduce)stream.y=(stream.y+stream.speed*delta/1000)%(height+stream.length*cell);
  for(var i=0;i<stream.length;i++){
   var y=stream.y-i*cell;
   if(y<0||y>height)continue;
   if(!stream.chars[i]||Math.random()<.025)stream.chars[i]=randomMatrixChar();
   ctx.globalAlpha=i===0?.85:.06+.3*(1-i/stream.length);
   ctx.fillStyle=accent;ctx.fillText(stream.chars[i],stream.x,y);
  }
 });
 ctx.globalAlpha=1;
}
var frame;
function animate(now){
 if(document.hidden)return;
 if(now-lastFrame>=45){render(now-lastFrame);lastFrame=now}
 frame=requestAnimationFrame(animate);
}
window.addEventListener('resize',resize);
document.addEventListener('visibilitychange',function(){
 if(document.hidden){cancelAnimationFrame(frame)}
 else if(!reduce){lastFrame=performance.now();frame=requestAnimationFrame(animate)}
});
resize();
if(!reduce)frame=requestAnimationFrame(animate);
})();
