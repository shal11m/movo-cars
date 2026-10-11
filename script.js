let L=null,shown=0,raf;
const $=id=>document.getElementById(id),R=n=>Math.round(n/1000)*1000,f=n=>Math.round(n).toLocaleString("ru-RU")+" ₽";
/* НАСТРОЙКИ: цены доставки до Москвы, услуга, резервные курсы */
const FEE=100000;
const CT={"Китай":{c:"CNY",s:"¥",d:230000,p:250000},"Южная Корея":{c:"KRW",s:"₩",d:200000,p:35000000},"Япония":{c:"JPY",s:"¥",d:250000,p:2500000},"Германия":{c:"EUR",s:"€",d:260000,p:30000},"ОАЭ":{c:"AED",s:"AED",d:230000,p:120000},"США":{c:"USD",s:"$",d:400000,p:30000}};
const RT={CNY:12.5,KRW:0.065,JPY:0.6,EUR:100,AED:24.5,USD:90};
/* Утильсбор: базовая ставка 20 000 ₽ × коэффициент. Индексы: 0 = до 160 л.с., затем полосы 160–190, 190–220 … 500+ л.с. [новые, старше 3 лет] */
const HB=[160,190,220,250,280,310,340,370,400,430,460,500,1e9];
const KU={l0:[[0,15.36,15.84,16.2,17.28],[0,28.43,29.28,30.12,30.12]],
l1:[[.17,45,47.64,50.52,57.12,64.56,72.96,83.16,94.8,108,123.24,140.4,160.08],[.26,74.64,79.2,83.88,91.92,100.56,110.16,120.6,132,144.6,158.4,173.4,189.84]],
l2:[[.17,96.11,98.5,100.1,105,109.2,113.6,118.1,122.9,127.8,132.9,138.2,143.7],[.26,144,145.9,148,152.5,157.1,161.4,165.9,170.6,175.4,180.7,186.1,191.7]],
l3:[[107.67,109.8,112,114.3,117.1,120.6,124.2,127.9,131.7,135.7,139.8,144,148.3],[164.84,166.7,168.5,170.3,172.7,177.9,183.2,188.7,194.4,200.2,206.2,212.4,218.8]]};
KU.l4=[KU.l3[0].map(x=>x*1.273),KU.l3[1].map(x=>x*1.093)];
const S={c:"Китай",age:0,fuel:"ice",pu:"hp"};
function seg(id,items,get,set){const el=$(id);el.innerHTML="";items.forEach(([v,l])=>{const b=document.createElement("button");b.type="button";b.textContent=l;b.dataset.v=v;b.onclick=()=>{set(v);upd()};el.appendChild(b)});el._g=get}
function pressed(){document.querySelectorAll("#country,#age,#fuel,#pu").forEach(el=>[...el.children].forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.v)===String(el._g()))))}
seg("country",Object.keys(CT).map(k=>[k,k]),()=>S.c,v=>{S.c=v;$("price").value=CT[v].p});
seg("age",[[0,"до 3 лет"],[1,"3–5 лет"],[2,"5–7 лет"],[3,"старше 7"]],()=>S.age,v=>S.age=+v);
seg("fuel",[["ice","Бензин"],["dsl","Дизель"],["hyb","Гибрид"],["ev","Электро"]],()=>S.fuel,v=>S.fuel=v);
seg("pu",[["hp","л.с."],["kw","кВт"]],()=>S.pu,v=>S.pu=v);
$("price").value=CT[S.c].p;
function ett(p,age,cc){const e=RT.EUR;if(age===0){const v=p/e,t=v<=8500?[.54,2.5]:v<=16700?[.48,3.5]:v<=42300?[.48,5.5]:v<=84500?[.48,7.5]:v<=169000?[.48,15]:[.48,20];return Math.max(p*t[0],cc*t[1]*e)}
const r=age===1?[[1000,1.5],[1500,1.7],[1800,2.5],[2300,2.7],[3000,3],[1e9,3.6]]:[[1000,3],[1500,3.2],[1800,3.5],[2300,4.8],[3000,5],[1e9,5.7]];return cc*r.find(x=>cc<=x[0])[1]*e}
function util(ev,hp,cc,age){const old=age>=1?1:0;if(hp<=160&&(ev||cc<=3000))return 20000*(old?.26:.17);const bi=HB.findIndex(x=>hp<=x);
const tab=ev?KU.l1:cc<=1000?KU.l0:cc<=2000?KU.l1:cc<=3000?KU.l2:cc<=3500?KU.l3:KU.l4,a=tab[old];return 20000*a[Math.min(bi,a.length-1)]}
const exr=h=>h<=150?61:h<=200?612:h<=300?1004:h<=400?1711:h<=500?1773:1835;
const cfee=v=>v<=200000?1067:v<=450000?2134:v<=1200000?4269:v<=2700000?11746:v<=4200000?16524:v<=5500000?21344:v<=7000000?27540:30000;
function stack(a){[...$("stk").children].forEach((e,i)=>e.style.flexGrow=a[i]/(a[0]+a[1]+a[2]+a[3])*100)}
function upd(){
 const ct=CT[S.c],price=+$("price").value||0,pR=price*RT[ct.c],fu=S.fuel,ser=$("ser").checked,ev=fu==="ev"||(fu==="hyb"&&ser);
 $("sym").textContent=ct.s;$("conv").textContent="≈ "+f(pR)+" по курсу банка";
 $("wcc").hidden=fu==="ev";$("wpw").hidden=fu==="ev"||ser&&fu==="hyb"&&false;$("wser").hidden=fu!=="hyb";$("wmk").hidden=!(fu==="ev"||(fu==="hyb"&&ser));
 const cc=fu==="ev"?0:+$("cc").value||0,pw=+$("pw").value||0,hpI=S.pu==="kw"?pw*1.35962:pw,hpM=(+$("mk").value||0)*1.35962,hp=ev?hpM:hpI;
 const duty=fu==="ev"?pR*.15:ett(pR,S.age,cc),exc=hp>90?hp*exr(hp):0,ut=util(ev,hp,cc,S.age),cf=cfee(pR);
 const rows=[["Автомобиль",pR],["Доставка автовозом до Москвы",ct.d],["Таможенная пошлина",duty],["Акциз",exc],["Утилизационный сбор",ut],["Таможенный сбор",cf],["Услуга Movo",FEE]].filter(r=>r[1]>0);
 const tot=rows.reduce((s,r)=>s+r[1],0);
 $("rows").innerHTML=rows.map(r=>`<div class="row"><span>${r[0]}</span><span>${f(r[1])}</span></div>`).join("");
 stack([pR,ct.d,duty+exc+ut+cf,FEE]);tween(tot);pressed();
 const ag=["до 3 лет","3–5 лет","5–7 лет","старше 7 лет"][S.age],en={ice:"бензин",dsl:"дизель",hyb:ser?"гибрид (последовательный)":"гибрид",ev:"электро"}[fu];
 L={text:`Расчёт Movo Cars\n${S.c}, ${price.toLocaleString("ru-RU")} ${ct.s} (≈ ${f(pR)})\nВозраст: ${ag}; двигатель: ${en}${fu==="ev"?"":", "+cc+" см³"}, ${Math.round(hp)} л.с.\n`+rows.map(r=>r[0]+": "+f(r[1])).join("\n")+`\nИтого под ключ ≈ ${f(tot)}`}}
document.querySelectorAll("#price,#cc,#pw,#mk,#ser").forEach(e=>e.addEventListener("input",upd));
fetch("https://www.cbr-xml-daily.ru/daily_json.js").then(r=>r.json()).then(j=>{Object.keys(RT).forEach(k=>{const v=j.Valute[k];if(v)RT[k]=v.Value/v.Nominal});$("rt").textContent="Курсы ЦБ РФ на "+new Date(j.Date).toLocaleDateString("ru-RU")+"."}).catch(()=>{$("rt").textContent="Курсы ориентировочные."}).finally(upd);
upd();

function tween(t){cancelAnimationFrame(raf);const s=shown,st=performance.now();(function k(n){const x=Math.min(1,(n-st)/450),e=1-Math.pow(1-x,3);shown=s+(t-s)*e;$("tot").textContent="≈ "+f(shown);if(x<1)raf=requestAnimationFrame(k)})(st)}
function fill(){document.querySelectorAll("input[type=range]").forEach(r=>r.style.setProperty("--p",((r.value-r.min)/(r.max-r.min)*100)+"%"))}
document.querySelectorAll("input[type=range]").forEach(r=>r.addEventListener("input",fill));fill();
$("go").addEventListener("click",()=>{if(!L)return;const s=$("sum");s.hidden=false;s.innerHTML="<b>Ваш расчёт</b><span style='white-space:pre-line'></span><button class='btn ghost' type='button'>Скопировать для сообщения</button>";s.children[1].textContent=L.text;const b=s.children[2];b.onclick=async()=>{b.textContent=(await copyTxt(L.text))?"Скопировано ✓":"Не удалось скопировать"}});
$("cpy").onclick=async()=>{const c=$("cpy"),ok=L&&await copyTxt(L.text);c.textContent=ok?"Скопировано ✓":"Не удалось скопировать";setTimeout(()=>c.textContent="Скопировать расчёт",2000)};

const hero=document.querySelector(".hero"),pg=$("prog");
addEventListener("scroll",()=>{const y=scrollY;pg.style.width=(y/(document.body.scrollHeight-innerHeight)*100)+"%";},{passive:true});
const links=[...document.querySelectorAll(".nav nav a")];
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){links.forEach(a=>a.classList.toggle("on",a.getAttribute("href")==="#"+e.target.id));sync()}}),{rootMargin:"-45% 0px -50% 0px"});
document.querySelectorAll("section[id]").forEach(s=>io.observe(s));

const mt=document.querySelector(".mt");mt.innerHTML+=mt.innerHTML;document.fonts.ready.then(()=>{mt.style.animationDuration=(mt.scrollWidth/2/60)+"s"});
const rv=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");rv.unobserve(e.target)}}),{threshold:.15});
document.querySelectorAll(".geo div,.svc-h,.svc-g>div,.steps div,.gal figure,.faq details").forEach((el,i)=>{el.classList.add("rv0");el.style.animationDelay=(([...el.parentNode.children].indexOf(el))*90)+"ms";rv.observe(el)});
const cm=$("cm");$("fab").onclick=()=>{$("wa").href="https://wa.me/79944444464"+(L?"?text="+encodeURIComponent(L.text):"");cm.hidden=false};
cm.onclick=e=>{if(e.target===cm)cm.hidden=true};addEventListener("keydown",e=>{if(e.key==="Escape")cm.hidden=true});

const so=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");so.unobserve(e.target)}}),{threshold:.08});
document.querySelectorAll("main > section, footer").forEach(s=>{s.classList.add("rs");so.observe(s)});

function sync(a){const n=$("mn"),i=$("ind"),b=a||n.querySelector("a.on");if(!b){i.style.opacity=0;return}i.style.opacity=1;i.style.left=b.offsetLeft+"px";i.style.width=b.offsetWidth+"px"}
links.forEach(a=>a.addEventListener("mouseenter",()=>sync(a)));$("mn").addEventListener("mouseleave",()=>sync());

const CARS=[{"n": "Mercedes-Benz GLC Coupe", "b": "Mercedes-Benz", "c": "Южная Корея", "p": ["images/img-02.jpg", "images/img-03.jpg", "images/img-04.jpg"]}, {"n": "BMW 3 серии", "b": "BMW", "c": "Китай", "p": ["images/img-05.jpg", "images/img-06.jpg"]}, {"n": "BMW X3 xDrive30i", "b": "BMW", "c": "Китай", "p": ["images/img-07.jpg", "images/img-08.jpg", "images/img-09.jpg"]}, {"n": "Li Auto L6", "b": "Другие марки", "c": "Китай", "p": ["images/img-10.jpg", "images/img-11.jpg", "images/img-12.jpg"]}, {"n": "Mercedes-AMG G63", "b": "Mercedes-Benz", "c": "Edition Performance", "p": ["images/img-13.jpg", "images/img-14.jpg", "images/img-15.jpg", "images/img-16.jpg", "images/img-17.jpg", "images/img-18.jpg"]}, {"n": "Mercedes-AMG GLE 53 Coupe", "b": "Mercedes-Benz", "c": "Купе", "p": ["images/img-19.jpg", "images/img-20.jpg", "images/img-21.jpg", "images/img-22.jpg"]}, {"n": "BMW X7", "b": "BMW", "c": "Южная Корея", "p": ["images/img-23.jpg"]}, {"n": "Mercedes-Benz E-Class", "b": "Mercedes-Benz", "c": "Южная Корея", "p": ["images/img-24.jpg"]}, {"n": "Mercedes-Benz S-Class", "b": "Mercedes-Benz", "c": "Южная Корея", "p": ["images/img-25.jpg"]}, {"n": "Audi Q7", "b": "Audi", "c": "Южная Корея", "p": ["images/img-26.jpg"]}, {"n": "Audi Q8", "b": "Audi", "c": "Южная Корея", "p": ["images/img-27.jpg"]}, {"n": "Porsche Panamera", "b": "Porsche", "c": "Южная Корея", "p": ["images/img-28.jpg"]}, {"n": "Porsche Taycan", "b": "Porsche", "c": "Южная Корея", "p": ["images/img-29.jpg"]}, {"n": "Porsche Cayenne Coupe", "b": "Porsche", "c": "Южная Корея", "p": ["images/img-30.jpg"]}, {"n": "Lamborghini Urus", "b": "Другие марки", "c": "Южная Корея", "p": ["images/img-31.jpg"]}, {"n": "BMW X3 (новое поколение)", "b": "BMW", "c": "Южная Корея", "p": ["images/img-32.jpg"]}, {"n": "BMW X4", "b": "BMW", "c": "Южная Корея", "p": ["images/img-33.jpg"]}, {"n": "BMW X5", "b": "BMW", "c": "Южная Корея", "p": ["images/img-34.jpg"]}, {"n": "BMW X6", "b": "BMW", "c": "Южная Корея", "p": ["images/img-35.jpg"]}, {"n": "Range Rover Sport", "b": "Другие марки", "c": "Южная Корея", "p": ["images/img-36.jpg"]}, {"n": "Bentley Continental GT Convertible", "b": "Другие марки", "c": "Южная Корея", "p": ["images/img-37.jpg"]}, {"n": "Lotus Emira", "b": "Другие марки", "c": "Южная Корея", "p": ["images/img-38.jpg"]}];
const gl=$("gl"),gi=$("gi"),gth=$("gth");let ci=0,pi=0,lastF=null,sx=null;
const pad=n=>String(n).padStart(2,"0"),ORD=["BMW","Mercedes-Benz","Audi","Porsche","Другие марки"],BR=[];
CARS.forEach((c,i)=>{c.i=i;let g=BR.find(x=>x.n===c.b);if(!g)BR.push(g={n:c.b,l:[]});g.l.push(c)});
BR.sort((a,b)=>ORD.indexOf(a.n)-ORD.indexOf(b.n));
/* внутри каждой марки сначала машины с красными номерами (Encar), затем остальные; последние уходят в карусель */
const RED=new Set(["Mercedes-Benz GLC Coupe","Mercedes-Benz E-Class","Mercedes-Benz S-Class","BMW X7","BMW X3 (новое поколение)","BMW X4","BMW X5","BMW X6","Audi Q7","Audi Q8","Porsche Panamera","Porsche Taycan","Porsche Cayenne Coupe","Lamborghini Urus","Bentley Continental GT Convertible","Lotus Emira"]);
BR.forEach(g=>g.l.sort((a,b)=>RED.has(b.n)-RED.has(a.n)));
function mkCard(c){const a=document.createElement("article");a.className="car";a.tabIndex=0;a.setAttribute("role","button");a.setAttribute("aria-label","Смотреть фото: "+c.n);
a.innerHTML='<img draggable="false" alt="" loading="lazy"><div class="car-cap"><b></b></div><span class="car-n"><svg class="ic"><use href="#i-img"/></svg></span>';
const im=a.querySelector("img");im.src=c.p[0];im.alt=c.n;a.querySelector("b").textContent=c.n;
if(c.p.length>1)a.querySelector(".car-n").append(c.p.length+" фото");else a.querySelector(".car-n").remove();
a.onclick=()=>openG(c.i);a.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();openG(c.i)}};return a}
BR.forEach(g=>{const blk=document.createElement("div");blk.className="cb";
blk.innerHTML='<div class="cb-h"><h3></h3><span class="cb-c"></span></div><div class="car-wrap"><button class="car-a prev" type="button" aria-label="Назад"><svg class="ic"><use href="#i-left"/></svg></button><button class="car-a next" type="button" aria-label="Вперёд"><svg class="ic"><use href="#i-right"/></svg></button><div class="car-track"></div></div>';
blk.querySelector("h3").textContent=g.n;const tr=blk.querySelector(".car-track"),pv=blk.querySelector(".prev"),nx=blk.querySelector(".next"),cnt=blk.querySelector(".cb-c");
g.l.forEach(c=>tr.appendChild(mkCard(c)));
const per=()=>innerWidth>700?2:1,gp=()=>parseFloat(getComputedStyle(tr).gap)||0,pw=()=>(tr.children[0].offsetWidth+gp())*per();
const cu=()=>{const n=Math.ceil(g.l.length/per()),k=Math.round(tr.scrollLeft/pw());cnt.textContent=n>1?pad(Math.min(n,k+1))+" / "+pad(n):"";pv.hidden=nx.hidden=n<=1;pv.disabled=tr.scrollLeft<4;nx.disabled=tr.scrollLeft+tr.clientWidth>=tr.scrollWidth-4};
pv.onclick=()=>tr.scrollTo({left:(Math.round(tr.scrollLeft/pw())-1)*pw(),behavior:"smooth"});nx.onclick=()=>tr.scrollTo({left:(Math.round(tr.scrollLeft/pw())+1)*pw(),behavior:"smooth"});
tr.addEventListener("scroll",cu,{passive:true});addEventListener("resize",cu);$("brands").appendChild(blk);cu()});
function showP(i){const c=CARS[ci];pi=(i+c.p.length)%c.p.length;gi.style.opacity=0;gi.onload=()=>{gi.style.opacity=1};gi.src=c.p[pi];gi.alt=c.n+", фото "+(pi+1);[...gth.children].forEach((b,j)=>b.classList.toggle("on",j===pi));gth.children[pi].scrollIntoView({inline:"center",block:"nearest",behavior:"smooth"});$("gs").textContent=(pi+1)+" / "+c.p.length}
function openG(i){ci=i;const mn=CARS[i].p.length>1;gth.style.display=mn?"":"none";$("gp").style.display=$("gn").style.display=mn?"":"none";lastF=document.activeElement;$("gt").textContent=CARS[i].n;gth.innerHTML="";CARS[i].p.forEach((s,j)=>{const b=document.createElement("button");b.type="button";b.setAttribute("aria-label","Фото "+(j+1));const im=new Image();im.src=s;im.alt="";b.appendChild(im);b.onclick=()=>showP(j);gth.appendChild(b)});gl.hidden=false;document.body.style.overflow="hidden";showP(0);$("gx").focus()}
function closeG(){gl.hidden=true;document.body.style.overflow="";if(lastF)lastF.focus()}
$("gx").onclick=closeG;$("gp").onclick=()=>showP(pi-1);$("gn").onclick=()=>showP(pi+1);
gl.addEventListener("click",e=>{if(e.target===gl||e.target.classList.contains("gl-in")||e.target.classList.contains("gl-stage"))closeG()});
addEventListener("keydown",e=>{if(gl.hidden)return;if(e.key==="Escape")closeG();if(e.key==="ArrowLeft")showP(pi-1);if(e.key==="ArrowRight")showP(pi+1)});
const stg=document.querySelector(".gl-stage");stg.addEventListener("pointerdown",e=>{sx=e.clientX});stg.addEventListener("pointerup",e=>{if(sx===null)return;const d=e.clientX-sx;sx=null;if(Math.abs(d)>50)showP(pi+(d<0?1:-1))});

/* ===== МЕНЮ ===== */
(function(){
const b=document.getElementById("bur"),m=document.getElementById("mm");if(!b||!m)return;
const set=o=>{m.classList.toggle("open",o);b.setAttribute("aria-expanded",String(o));b.setAttribute("aria-label",o?"Закрыть меню":"Открыть меню");document.body.style.overflow=o?"hidden":""};
b.onclick=()=>set(!m.classList.contains("open"));
m.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>set(false)));
addEventListener("keydown",e=>{if(e.key==="Escape")set(false)});
matchMedia("(min-width:901px)").addEventListener("change",e=>{if(e.matches)set(false)});
})();


/* ===== кнопка звонка: на телефоне скрыта, пока виден первый экран ===== */
(function(){const f=document.getElementById("fab");if(!f)return;const u=()=>f.classList.toggle("off",scrollY<innerHeight*.7);u();addEventListener("scroll",u,{passive:true});addEventListener("resize",u)})();

/* ===== копирование в буфер обмена (работает и без HTTPS, и в мобильных браузерах) ===== */
function copyTxt(s){return new Promise(res=>{
 let ok=false;
 try{const a=document.createElement("textarea");a.value=s;a.setAttribute("readonly","");a.style.cssText="position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px";document.body.appendChild(a);a.focus();a.select();a.setSelectionRange(0,s.length);ok=document.execCommand("copy");a.remove()}catch(e){ok=false}
 if(ok)return res(true);
 if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(s).then(()=>res(true),()=>res(false));else res(false)})}
/* ===== надпись MOVO: ровно от левого до правого края экрана ===== */
(function(){const b=document.querySelector(".big"),h=document.querySelector(".hero");if(!b||!h)return;
const fit=()=>{b.style.fontSize="100px";const r=document.createRange();r.selectNodeContents(b);const w=r.getBoundingClientRect().width;if(w>0)b.style.fontSize=(100*h.clientWidth/w)+"px"};
fit();document.fonts&&document.fonts.ready.then(fit);addEventListener("resize",fit);addEventListener("load",fit)})();
