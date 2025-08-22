// mobile navigation toggle
(() => {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    if (!hamburger || !navMenu) return;
    const toggle = () => {
        const on = hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
        hamburger.setAttribute('aria-expanded', String(on));
    };
    hamburger.addEventListener('click', toggle);
    hamburger.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => { hamburger.classList.remove('active'); navMenu.classList.remove('active'); hamburger.setAttribute('aria-expanded','false'); }));
})();

// skill bubbles
class SkillBubbles {
    constructor(){ this.container=document.getElementById('bubbleContainer'); this.bubbles=[]; this.skills=null; this.speed=1; this.friction=0.985; this.jit=0; this.k=0.6; this.wall=1; this.coffee=1; if(this.container) this.init(); }
    init(){
        const slider=document.getElementById('intensitySlider');
        const valEl=document.getElementById('intensityValue');
        const levelCard=document.querySelector('.coffee-level-card');
        const stage=v=>v<=1?'Sleepy':v<=2?'Warming up':v<=5?'Productive':'TOO MANY!';
        const setStageClass=v=>{ const cls=v<=1?'sleepy':v<=2?'warming':v<=5?'productive':'too-many'; const list=document.body.classList; list.remove('coffee-stage-sleepy','coffee-stage-warming','coffee-stage-productive','coffee-stage-too-many'); list.add('coffee-stage-'+cls); };
        const ensureRainbowCss=()=>{ if(document.getElementById('coffeeRainbowCss')) return; const s=document.createElement('style'); s.id='coffeeRainbowCss'; s.textContent=`.coffee-rainbow{background:linear-gradient(90deg,#ff0040,#ff8000,#ffd500,#3cff00,#00e5ff,#6a00ff,#ff00d4);-webkit-background-clip:text;background-clip:text;color:transparent;background-size:400% 100%;animation:coffeeRainbow 6s linear infinite}@keyframes coffeeRainbow{0%{background-position:0% 50%}100%{background-position:100% 50%}}`; document.head.appendChild(s); };
    const update=()=>{ const v=parseInt(slider?.value||'1',10); this.coffee=v; this.speed=0.7+(v-1)*0.6; this.friction=0.992-(v-1)*0.012; this.jit=(v-1)*0.12; this.k=0.45+(v-1)*0.18; this.wall=1+(v-1)*0.12; setStageClass(v); if(valEl){ valEl.innerHTML=`${v} <span class="coffee-emoji" aria-hidden="true">☕</span> <span class="coffee-stage">(${stage(v)})</span>`; const stageEl=valEl.querySelector('.coffee-stage'); if(v>=6){ ensureRainbowCss(); stageEl&&stageEl.classList.add('coffee-rainbow'); valEl.classList.add('too-many-tilt'); levelCard&&levelCard.classList.add('coffee-overload'); valEl.style.color=''; } else { stageEl&&stageEl.classList.remove('coffee-rainbow'); valEl.classList.remove('too-many-tilt'); levelCard&&levelCard.classList.remove('coffee-overload'); valEl.style.color=v<=1?'#889':v<=5?'#14cba8':'#ff2d55'; } } if(slider){ slider.setAttribute('aria-valuenow',String(v)); slider.setAttribute('aria-valuetext',stage(v)); } };
        if(slider&&valEl){
            slider.addEventListener('input',()=>{ clearInterval(this.calmTimer); update(); });
            update();
            const calm=document.getElementById('calmCoffee');
            if(calm) calm.addEventListener('click',()=>{
                clearInterval(this.calmTimer);
                this.calmTimer=setInterval(()=>{
                    let v=parseInt(slider.value||'1',10);
                    if(v<=1){ clearInterval(this.calmTimer); return; }
                    slider.value=String(--v);
                    update();
                }, 250);
            });
        }
        const reset=document.getElementById('resetBubbles'); if(reset) reset.addEventListener('click',()=>this.create());
        this.loadSkills().finally(()=>{ this.create(); this.loop(); });
    }
    async loadSkills(){
        try{
            const res=await fetch('skills.json',{cache:'no-store'});
            const data=await res.json();
            const arr=Array.isArray(data?.skills)?data.skills:(Array.isArray(data)?data:[]);
            this.skills=arr.map(s=>typeof s==='string'?s:(s?.name||s?.label||String(s))).filter(Boolean);
        }catch{ this.skills=null; }
    }
    create(){
        this.bubbles.forEach(b=>b.el.remove()); this.bubbles=[];
        const skills=(this.skills&&this.skills.length?this.skills:[
            'Java','C','C++','MATLAB','JavaScript','PHP','HTML','CSS','Python','SQL','Bash','Git','Unix/Linux','nRF52 MCU','Java RMI','I2C','PWM','Q-Graphs','Machine Learning','Genetic Algorithms','Assembly','Rust','ERLang'
        ]);
        const rect=this.container.getBoundingClientRect();
        const colors=[['#00d4ff','#0090ff'],['#6a8bff','#4f46e5'],['#8b5cf6','#6366f1'],['#d946ef','#c026d3'],['#0ea5e9','#0284c7']];
        const makeBubble=(s,i)=>{
            const r=Math.max(26, s.length*2.6)+Math.random()*10;
            const b={x:r+Math.random()*(rect.width-2*r), y:r+Math.random()*(rect.height-2*r), vx:(Math.random()-.5)*1.6, vy:(Math.random()-.5)*1.6, r, col:colors[i%colors.length], drag:false, lastMX:0,lastMY:0,lastT:0};
            const el=document.createElement('div'); el.className='skill-bubble'; el.textContent=s; el.style.width=el.style.height=(r*2)+'px'; el.style.background=`linear-gradient(135deg, ${b.col[0]}, ${b.col[1]})`; el.style.left=(b.x-b.r)+'px'; el.style.top=(b.y-b.r)+'px'; el.style.fontSize=Math.max(8,Math.min(12,r*0.25))+'px';
            b.el=el; this.addDrag(b); this.container.appendChild(el); this.bubbles.push(b);
        };
        skills.forEach(makeBubble);
    }
    addDrag(b){
        const rectFn=()=>this.container.getBoundingClientRect();
        const onMove=e=>{
            if(!b.drag) return;
            const r=rectFn(); const mx=(e.touches?e.touches[0].clientX:e.clientX)-r.left; const my=(e.touches?e.touches[0].clientY:e.clientY)-r.top;
            const now=performance.now(); const dt=Math.max(1, now-(b.lastT||now));
            b.vx=(mx-b.lastMX)/dt*12; b.vy=(my-b.lastMY)/dt*12; b.lastMX=mx; b.lastMY=my; b.lastT=now;
            b.x=Math.max(b.r, Math.min(r.width-b.r, mx)); b.y=Math.max(b.r, Math.min(r.height-b.r, my));
        };
        const onUp=()=>{ b.drag=false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); document.removeEventListener('touchmove', onMove); document.removeEventListener('touchend', onUp); };
        b.el.addEventListener('mousedown', e=>{ e.preventDefault(); b.drag=true; const r=rectFn(); b.lastMX=e.clientX-r.left; b.lastMY=e.clientY-r.top; b.lastT=performance.now(); document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp); });
        b.el.addEventListener('touchstart', e=>{ b.drag=true; const r=rectFn(); const t=e.touches[0]; b.lastMX=t.clientX-r.left; b.lastMY=t.clientY-r.top; b.lastT=performance.now(); document.addEventListener('touchmove', onMove, {passive:false}); document.addEventListener('touchend', onUp); }, {passive:true});
    }
    loop(){ const step=()=>{ this.update(); requestAnimationFrame(step); }; requestAnimationFrame(step); }
    update(){
        const rect=this.container.getBoundingClientRect();
        // physics integration
        for(let i=0;i<this.bubbles.length;i++){
            const a=this.bubbles[i];
            if(!a.drag){
                if(this.jit){ a.vx+=(Math.random()-.5)*this.jit; a.vy+=(Math.random()-.5)*this.jit; }
                a.x+=a.vx*this.speed; a.y+=a.vy*this.speed; a.vx*=this.friction; a.vy*=this.friction;
                if(a.x-a.r<=0){a.x=a.r; a.vx=Math.abs(a.vx)*this.wall;} 
                if(a.x+a.r>=rect.width){a.x=rect.width-a.r; a.vx=-Math.abs(a.vx)*this.wall;} 
                if(a.y-a.r<=0){a.y=a.r; a.vy=Math.abs(a.vy)*this.wall;} 
                if(a.y+a.r>=rect.height){a.y=rect.height-a.r; a.vy=-Math.abs(a.vy)*this.wall;}
                const lim=6+this.coffee*2; const s2=a.vx*a.vx+a.vy*a.vy; if(s2>lim*lim){ const s=Math.sqrt(s2); a.vx=a.vx/s*lim; a.vy=a.vy/s*lim; }
            }
            // collisions
            for(let j=i+1;j<this.bubbles.length;j++){
                const b=this.bubbles[j];
                const dx=b.x-a.x, dy=b.y-a.y; const d=Math.hypot(dx,dy); const min=a.r+b.r;
                if(d>0 && d<min){
                    const nx=dx/d, ny=dy/d; const overlap=min-d; const push=overlap*0.5;
                    a.x-=nx*push; a.y-=ny*push; b.x+=nx*push; b.y+=ny*push;
                    // bounce
                    const k=this.k; a.vx-=nx*k; a.vy-=ny*k; b.vx+=nx*k; b.vy+=ny*k;
                }
            }
            a.el.style.left=(a.x-a.r)+'px'; a.el.style.top=(a.y-a.r)+'px';
        }
    }
}

// projects wheel
const PROJECT_WHEEL_ROTATE_MS=14000;
async function initProjects(){
    const wheel=document.getElementById('projectWheel'); if(!wheel) return;
    try{
        const res=await fetch('projects.json',{cache:'no-store'}); const data=await res.json();
        const projects=Array.isArray(data.projects)?data.projects:[]; if(!projects.length){ wheel.innerHTML='<p style="text-align:center;opacity:.7">No projects to display.</p>'; return; }
        const safe=s=>s==null?'':String(s); const tags=p=>[] .concat(p.tech||[],p.tags||[],p.skills||[]);
        wheel.innerHTML=projects.map((p,i)=>`
            <div class="project-item${i===0?' focused':''}" data-index="${i}">
                <div class="project-card">
                    <div class="project-image"><div class="project-placeholder"><i class="${safe(p.icon)||'fas fa-folder'}"></i></div></div>
                    <div class="project-content">
                        <h3>${safe(p.title)||'Untitled'}</h3>
                        <p>${safe(p.description)}</p>
                        <div class="card-footer">
                            <div class="project-tech">${tags(p).map(t=>`<span class="tech-tag">${safe(t)}</span>`).join('')}</div>
                            ${(Array.isArray(p.links)&&p.links.length)?`<div class="project-links">${p.links.map(l=>`<a href="${safe(l.href)}" target="_blank" rel="noopener" class="project-link" ${l.ariaLabel?`aria-label="${safe(l.ariaLabel)}"`:''}><i class="${safe(l.icon)||'fas fa-external-link-alt'}"></i></a>`).join('')}</div>`:''}
                        </div>
                    </div>
                </div>
            </div>`).join('');
        const dots=document.getElementById('wheelDots'); if(dots) dots.innerHTML=projects.map((_,i)=>`<span class="wheel-dot${i===0?' active':''}" data-index="${i}"></span>`).join('');
        new ProjectWheel();
    }catch(e){ console.error('Error loading projects:', e); }
}

class ProjectWheel{
    constructor(){
        this.items=Array.from(document.querySelectorAll('.project-item'));
        this.dots=Array.from(document.querySelectorAll('#wheelDots .wheel-dot'));
        this.prev=document.getElementById('wheelPrevBtn');
        this.next=document.getElementById('wheelNextBtn');
        this.total=this.items.length; this.current=0; this.anim=false; this.timer=null;
        if(this.prev) this.prev.addEventListener('click',()=>this.shift(-1)); if(this.next) this.next.addEventListener('click',()=>this.shift(1));
        this.dots.forEach((d,i)=>d.addEventListener('click',()=>this.go(i))); this.items.forEach((it,i)=>it.addEventListener('click',()=>this.go(i)));
        this.startAuto(); const c=document.getElementById('projectWheel'); if(c){ c.addEventListener('mouseenter',()=>this.stopAuto()); c.addEventListener('mouseleave',()=>this.startAuto()); }
        this.render();
    }
    render(){
        const pos=[{x:0,z:350,a:0,s:0.75,o:1},{x:240,z:280,a:-45,s:0.65,o:0.8},{x:380,z:100,a:-75,s:0.5,o:0.4},{x:-380,z:100,a:75,s:0.5,o:0.4},{x:-240,z:280,a:45,s:0.65,o:0.8}];
        const order=Array.from({length:this.total},(_,i)=>(this.current+i)%this.total);
        this.items.forEach((item,idx)=>{
            const k=order.indexOf(idx);
            if(k<pos.length){
                const p=pos[k];
                item.style.transform=`translate(-50%, -50%) translate3d(${p.x}px,0,${p.z}px) rotateY(${p.a}deg) scale(${p.s})`;
                item.style.opacity=p.o;
                const blur = k===0 ? 0 : (k===1 || k===4 ? 1.2 : 2.2);
                item.style.filter = blur > 0 ? `blur(${blur}px) brightness(${p.o})` : 'none';
                item.style.zIndex=pos.length-k;
            }
            else { item.style.transform='translate(-50%, -50%) translate3d(0,0,-200px) scale(0.5)'; item.style.opacity=0; item.style.filter='brightness(0.5)'; item.style.zIndex=1; }
            item.classList.toggle('focused', idx===this.current);
        });
        this.dots.forEach((d,i)=>d.classList.toggle('active', i===this.current));
    }
    shift(dir){ if(this.anim) return; this.anim=true; this.current=(this.current+dir+this.total)%this.total; this.render(); setTimeout(()=>this.anim=false,600); }
    go(i){ if(this.anim||i===this.current) return; this.anim=true; this.current=i; this.render(); setTimeout(()=>this.anim=false,600); }
    startAuto(){ this.stopAuto(); this.timer=setInterval(()=>{ if(!this.anim) this.shift(1); }, PROJECT_WHEEL_ROTATE_MS); }
    stopAuto(){ if(this.timer){ clearInterval(this.timer); this.timer=null; } }
}

// contact form
class ContactForm{
    constructor(){ this.form=document.querySelector('.contact-form'); if(this.form){ this.form.addEventListener('submit',e=>this.submit(e)); } }
    async submit(e){
        e.preventDefault(); const status=document.getElementById('formStatus'); const fd=new FormData(this.form);
        const name=(fd.get('name')||'').toString().trim(); const email=(fd.get('email')||'').toString().trim(); const msg=(fd.get('message')||'').toString().trim();
        const set=(m,ok=false)=>{ if(!status) return; status.textContent=m; status.classList.remove('success','error'); status.classList.add(ok?'success':'error'); };
    if(fd.get('hp_company')) return; if(!name||!email||!msg) return set('Please fill in all fields.'); if(!/^[\w.!#$%&'*+/=?`{|}~-]+@[\w-]+(\.[\w-]+)+$/.test(email)) return set('Please enter a valid email address.');
        set('Sending...', true);
        try{ if(!this.form.querySelector('input[name="_subject"]')){ const i=document.createElement('input'); i.type='hidden'; i.name='_subject'; i.value='Portfolio Contact'; this.form.appendChild(i);} const res=await fetch(this.form.action||'https://formspree.io/f/mblkeoov',{method:'POST', headers:{'Accept':'application/json'}, body:fd}); if(res.ok){ set('Thank you! Your message has been sent.', true); this.form.reset(); } else { let m='Send failed. Please try again later.'; try{ const d=await res.json(); if(d&&d.error) m=d.error; }catch{} set(m);} } catch{ set('Network error. Please retry.'); }
    }
}

// typing effect
function startTyping(){
    const root=document.querySelector('.typing-text'); if(!root) return; root.innerHTML='';
    const prefersReduced=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lines=[ {tag:'h1', cls:'hero-title', text:"Hi, I'm Davis Parlour."}, {tag:'p', cls:'hero-subtitle', text:'Graduate Software Engineer.'}, {tag:'p', cls:'hero-description', text:'First-Class BSc Computer Science.'} ];
    let i=0; const typeLine=()=>{ if(i>=lines.length) return showCodeThenButtons(); const l=lines[i++]; const el=document.createElement(l.tag); el.className=l.cls; root.appendChild(el); if(prefersReduced){ el.textContent=l.text; return setTimeout(typeLine, 50); } let j=0; const id=setInterval(()=>{ el.textContent=l.text.slice(0,++j); if(j>=l.text.length) clearInterval(id); },15); setTimeout(typeLine, l.text.length*15+200); };
    const showCodeThenButtons=()=>{
        // live code writing block: type the actual button HTML code
    const codeText = `<a class="btn btn-primary" href="#projects">View My Work</a>\n<a class="btn btn-secondary" href="Davis-Parlour-CV.pdf" target="_blank"><i class="fas fa-download"></i> Download CV</a>`;
        const codeDiv=document.createElement('div'); codeDiv.className='typing-buttons-code code-block'; codeDiv.style.visibility='hidden'; codeDiv.textContent=codeText; root.appendChild(codeDiv);
        const h=codeDiv.offsetHeight; codeDiv.style.minHeight=h+'px'; codeDiv.style.visibility='visible'; codeDiv.textContent='';
        if(prefersReduced){ codeDiv.textContent=codeText; return setTimeout(()=>fadeAndShowButtons(codeDiv), 400); }
    let k=0; const step=3; const tick=()=>{ k+=step; if(k>codeText.length) k=codeText.length; codeDiv.textContent=codeText.slice(0,k); if(k<codeText.length) req=requestAnimationFrame(tick); else setTimeout(()=>fadeAndShowButtons(codeDiv), 150); };
    let req=requestAnimationFrame(tick);
    };
    const fadeAndShowButtons=(codeDiv)=>{ codeDiv.classList.add('fade-out'); setTimeout(()=>{ codeDiv.remove(); showBtns(); }, 600); };
    const showBtns=()=>{ const box=document.createElement('div'); box.className='hero-buttons'; root.appendChild(box); const a=document.createElement('a'); a.className='btn btn-primary btn-appearing'; a.href='#projects'; a.textContent='View My Work'; const b=document.createElement('a'); b.className='btn btn-secondary btn-appearing'; b.href='Davis-Parlour-CV.pdf'; b.target='_blank'; b.innerHTML='<i class="fas fa-download"></i> Download CV'; box.append(a,b); };
    typeLine();
}

// boot
document.addEventListener('DOMContentLoaded',()=>{ new SkillBubbles(); initProjects(); initCoffee(); new ContactForm(); setTimeout(startTyping,300); });

// coffee corner
async function initCoffee(){
    const grid=document.getElementById('coffeeGrid'); if(!grid) return;
    try{
        const res=await fetch('coffee.json',{cache:'no-store'});
        const data=await res.json();
        const coffees=Array.isArray(data.coffees)?data.coffees:[];
        if(!coffees.length){ grid.innerHTML='<p style="text-align:center;opacity:.7">No coffees yet.</p>'; return; }
        const safe=s=>s==null?'':String(s);
        grid.innerHTML=coffees.map(c=>{
            const variant=c.variant?` coffee-card-${safe(c.variant)}`:'';
            const tags=Array.isArray(c.tags)?c.tags:[];
            return `
            <div class="project-card coffee-card-simple${variant}">
                <div class="project-image"><div class="project-placeholder"><i class="${safe(c.icon)||'fas fa-mug-hot'}"></i></div></div>
                <div class="project-content">
                    <h3>${safe(c.title)||'Untitled'}</h3>
                    <p>${safe(c.description)}</p>
                    <div class="card-footer">
                        <div class="project-tech">${tags.map(t=>`<span class=\"tech-tag\">${safe(t)}</span>`).join('')}</div>
                        ${(Array.isArray(c.links)&&c.links.length)?`<div class=\"project-links\">${c.links.map(l=>`<a href=\"${safe(l.href)}\" target=\"_blank\" rel=\"noopener\" class=\"project-link\" ${l.ariaLabel?`aria-label=\\\"${safe(l.ariaLabel)}\\\"`:''}><i class=\"${safe(l.icon)||'fas fa-external-link-alt'}\"></i></a>`).join('')}</div>`:''}
                    </div>
                </div>
            </div>`;
        }).join('');
    }catch(e){ console.error('Error loading coffees:', e); }
}
