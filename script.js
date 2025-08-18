// mobile Navigation Toggle (guard against missing element)
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

if (hamburger && navMenu) {
    const toggleMenu = () => {
        const isActive = hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
        hamburger.setAttribute('aria-expanded', String(isActive));
    };
    hamburger.addEventListener('click', toggleMenu);
    // keyboard support for accessibility
    hamburger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleMenu();
        }
    });

    // close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
    }));
}

// smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// navbar background on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(12, 12, 12, 0.98)';
    } else {
        navbar.style.background = 'rgba(12, 12, 12, 0.95)';
    }
});

// animated counter for stats
let __aboutCountersAnimated = false; // prevents re-running counters on repeated intersection
function animateCounters() {
    if (__aboutCountersAnimated) return;
    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
        const target = counter.getAttribute('data-count');
        const showPlus = counter.getAttribute('data-plus') === 'true';
        
        // handle different target formats
        let numericTarget;
        if (target.includes('%')) {
            numericTarget = parseInt(target.replace(/[^\d]/g, ''));
        } else if (target.includes('+')) {
            numericTarget = parseInt(target.replace(/[^\d]/g, ''));
        } else {
            numericTarget = parseInt(target) || 0;
        }
        
        const increment = Math.max(1, Math.ceil(numericTarget / 100));
        let current = 0;

        const updateCounter = () => {
            if (current < numericTarget) {
                current = Math.min(current + increment, numericTarget);
                
                if (target.includes('%')) {
                    counter.textContent = '>' + current + '%';
                } else if (showPlus) {
                    counter.textContent = current + '+';
                } else {
                    counter.textContent = current + '+';
                }
                
                setTimeout(updateCounter, 30);
            }
        };
        
        updateCounter();
    });
    __aboutCountersAnimated = true; // mark done after scheduling first batch
}

// intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            
            // trigger counter animation for stats section
            if (entry.target.id === 'about' && !__aboutCountersAnimated) {
                setTimeout(animateCounters, 500);
            }
        }
    });
}, observerOptions);

document.querySelectorAll('section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(50px)';
    section.style.transition = 'all 0.8s ease';
    observer.observe(section);
});

class SkillBubbles {
    constructor() {
        this.container = document.getElementById('bubbleContainer');
        this.bubbles = [];
    // coffee level 0-3 (slider value); internal physics parameters derived from this
    this.coffeeLevel = 1; // default 1 cup
    this.baseConfig = { friction: 0.99 };
        
        if (this.container) {
            this.init();
        }
    }
    
    init() {
        // setup COFFEE intensity slider
        const slider = document.getElementById('intensitySlider');
        const valueEl = document.getElementById('intensityValue');
        if (slider && valueEl) {
            const labelFor = (cups) => {
                // mapping:
                // 1 -> Sleepy
                // 2 -> Warming Up
                // 3-4 -> Productive
                // 5 -> Too Many
                // 6 -> Too Many!! (maxed)
                if (cups === 1) return { stage: 'Sleepy', color: '#889' };
                if (cups === 2) return { stage: 'Warming Up', color: '#f0a500' };
                if (cups <= 4) return { stage: 'Productive', color: '#14cba8' };
                if (cups === 5) return { stage: 'Too Many', color: '#ff2d55', rainbow: true };
                if (cups === 6) return { stage: 'Too Many', color: '#ff2d55', rainbow: true, maxed: true };
            };
            const updateLabel = () => {
                const cups = parseInt(slider.value, 10);
                const normalized = (cups - 1) / 5; // 0..1
                const eased = Math.pow(normalized, 0.8);
                this.coffeeLevel = 3 * eased; // 0..3

                const d = labelFor(cups);
                // update slider ARIA
                slider.setAttribute('aria-valuenow', String(cups));
                slider.setAttribute('aria-valuetext', d.stage);
                // update stage class on parent card for styling hooks
                const card = document.getElementById('coffeeSliderCard') || slider.parentElement;
                if (card) {
                    card.classList.remove('coffee-stage-sleepy','coffee-stage-warming','coffee-stage-productive','coffee-stage-too-many');
                    const key = d.stage.toLowerCase().replace(/\s+/g,'-');
                    card.classList.add('coffee-stage-' + (key === 'too-many' ? 'too-many' : key));
                }
                // reset base styles
                valueEl.style.animation = 'none';
                valueEl.style.background = 'none';
                valueEl.style.webkitBackgroundClip = '';
                valueEl.style.backgroundClip = '';
                valueEl.style.filter = 'none';
                valueEl.style.color = d.color;
                const levelCard = document.querySelector('.coffee-level-card');
                if (d.rainbow) {
                    valueEl.classList.add('too-many-tilt');
                    if (levelCard) levelCard.classList.add('coffee-overload');
                    const exclaim = d.maxed ? '!!' : '!';
                    valueEl.innerHTML = cups + ' ☕ <span class="hyper-word">(' + d.stage.toUpperCase() + exclaim + ')</span>';
                    const hw = valueEl.querySelector('.hyper-word');
                    hw.style.background = 'linear-gradient(45deg,#ff004c,#ff8a00,#ffe600,#00e675,#00c8ff,#8a2eff,#ff00c8,#ff004c)';
                    hw.style.backgroundSize = '300% 300%';
                    hw.style.webkitBackgroundClip = 'text';
                    hw.style.backgroundClip = 'text';
                    hw.style.color = 'transparent';
                    hw.style.animation = 'coffeeRainbow 4s linear infinite';
                    hw.style.filter = 'drop-shadow(0 1px 3px rgba(255,0,140,0.55))';
                    hw.style.display = 'inline-block';
                    hw.style.fontSize = '0.9em';
                } else {
                    valueEl.classList.remove('too-many-tilt');
                    if (levelCard) levelCard.classList.remove('coffee-overload');
                    valueEl.textContent = cups + ' ☕ (' + d.stage + ')';
                }
            };
            slider.addEventListener('input', updateLabel);
            updateLabel();

            // calm down button
            const calmBtn = document.getElementById('calmCoffee');
            if (calmBtn) {
                calmBtn.addEventListener('click', () => {
                    let current = parseInt(slider.value, 10);
                    if (current <= 1) return;
                    const step = () => {
                        current -= 1;
                        slider.value = String(current);
                        updateLabel();
                        if (current > 1) setTimeout(step, 230);
                    };
                    step();
                });
            }
        }
        
        // setup reset button
        const resetBtn = document.getElementById('resetBubbles');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.createBubbles());
        }
        
        // create initial bubbles
        this.createBubbles();
        this.startLoop();
    }
    
    createBubbles() {
        // clear existing bubbles (useful if reset)
        this.bubbles.forEach(b => b.element.remove());
        this.bubbles = [];
        
        const skills = [ // (from my cv)
            // proficient languages
            'Java', 'C', 'C++', 'MATLAB',
            'JavaScript', 'PHP', 'HTML', 'CSS',
            'Python', 'SQL', 'Bash',
            
            // technologies & frameworks
            'Git', 'Unix/Linux', 'nRF52 MCU',
            'Java RMI', 'I2C', 'PWM',
            'Q-Graphs', 'Machine Learning',
            'Genetic Algorithms',
            
            // familiar/learning
            'Assembly', 'Rust', 'ERLang'
        ];
        
        const rect = this.container.getBoundingClientRect();

        const gradientPalette = [
            ['#00d4ff', '#0090ff'],
            ['#5dd6ff', '#0077ff'],
            ['#6a8bff', '#4f46e5'],
            ['#8b5cf6', '#6366f1'],
            ['#d946ef', '#c026d3'],
            ['#ec4899', '#db2777'],
            ['#0ea5e9', '#0284c7'],
        ];
        
        skills.forEach((skill, i) => {
            // calculate bubble size based on text length
            const textLength = skill.length;
            const minRadius = Math.max(25, textLength * 2.8); 
            const maxRadius = minRadius + 15; 
            const radius = minRadius + Math.random() * (maxRadius - minRadius);
            
            const bubble = {
                x: 50 + Math.random() * (rect.width - 100),
                y: 50 + Math.random() * (rect.height - 100),
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                radius: radius,
                color: gradientPalette[i % gradientPalette.length],
                skill: skill,
                element: null,
                isDragging: false
            };
            
            // Create DOM element
            const el = document.createElement('div');
            el.className = 'skill-bubble';
            el.textContent = skill;
            el.style.width = el.style.height = (bubble.radius * 2) + 'px';
            // Apply gradient background for smoother, complementary appearance
            if (Array.isArray(bubble.color)) {
                el.style.background = `linear-gradient(135deg, ${bubble.color[0]}, ${bubble.color[1]})`;
            } else {
                el.style.background = bubble.color; // fallback
            }
            el.style.border = '1px solid rgba(255,255,255,0.12)';
            el.style.position = 'absolute';
            el.style.left = (bubble.x - bubble.radius) + 'px';
            el.style.top = (bubble.y - bubble.radius) + 'px';
            
            // adjust font size based on bubble size for better fit (smaller)
            const fontSize = Math.max(8, Math.min(12, bubble.radius * 0.25));
            el.style.fontSize = fontSize + 'px';
            
            bubble.element = el;
            
            // add drag functionality
            this.addDragListeners(bubble);
            
            this.container.appendChild(el);
            this.bubbles.push(bubble);
        });
    }
    
    addDragListeners(bubble) {
        let dragData = { 
            isDragging: false,
            hasStartedDrag: false,
            startX: 0, 
            startY: 0, 
            targetX: 0, 
            targetY: 0,
            offsetX: 0, 
            offsetY: 0,
            lastMouseX: 0,
            lastMouseY: 0,
            mouseVelX: 0,
            mouseVelY: 0,
            lastMoveTime: 0
        };
        
        bubble.element.addEventListener('mousedown', (e) => {
            e.preventDefault();
            dragData.isDragging = true;
            dragData.hasStartedDrag = false;
            bubble.isDragging = true;
            
            const rect = this.container.getBoundingClientRect();
            
            // record starting position
            dragData.startX = bubble.x;
            dragData.startY = bubble.y;
            
            // calculate drag offset from bubble center
            dragData.offsetX = e.clientX - rect.left - bubble.x;
            dragData.offsetY = e.clientY - rect.top - bubble.y;
            
            // initialize target to current position (no movement yet)
            dragData.targetX = bubble.x;
            dragData.targetY = bubble.y;
            
            // initialize velocity tracking
            dragData.lastMouseX = e.clientX - rect.left;
            dragData.lastMouseY = e.clientY - rect.top;
            dragData.mouseVelX = 0;
            dragData.mouseVelY = 0;
            dragData.lastMoveTime = performance.now();
            
            const mousemove = (e) => {
                if (dragData.isDragging) {
                    const rect = this.container.getBoundingClientRect();
                    const currentTime = performance.now();
                    const currentMouseX = e.clientX - rect.left;
                    const currentMouseY = e.clientY - rect.top;
                    
                    // calculate mouse velocity (pixels per millisecond)
                    const timeDelta = Math.max(1, currentTime - dragData.lastMoveTime);
                    dragData.mouseVelX = (currentMouseX - dragData.lastMouseX) / timeDelta;
                    dragData.mouseVelY = (currentMouseY - dragData.lastMouseY) / timeDelta;
                    
                    // store current mouse position for next calculation
                    dragData.lastMouseX = currentMouseX;
                    dragData.lastMouseY = currentMouseY;
                    dragData.lastMoveTime = currentTime;
                    
                    // calculate where the mouse wants the bubble to be
                    let targetX = currentMouseX - dragData.offsetX;
                    let targetY = currentMouseY - dragData.offsetY;
                    
                    // keep target in bounds
                    targetX = Math.max(bubble.radius, Math.min(rect.width - bubble.radius, targetX));
                    targetY = Math.max(bubble.radius, Math.min(rect.height - bubble.radius, targetY));
                    
                    // mark that we've started actually dragging
                    dragData.hasStartedDrag = true;
                    
                    // store target for bubble to follow
                    dragData.targetX = targetX;
                    dragData.targetY = targetY;
                }
            };
            
            const mouseup = (e) => {
                if (dragData.isDragging) {
                    // use the mouse velocity at release for slingshot effect
                    const velocityFactor = 12;
                    bubble.vx = dragData.mouseVelX * velocityFactor;
                    bubble.vy = dragData.mouseVelY * velocityFactor;
                    
                    // cap maximum slingshot velocity
                    const maxVel = 8;
                    bubble.vx = Math.max(-maxVel, Math.min(maxVel, bubble.vx));
                    bubble.vy = Math.max(-maxVel, Math.min(maxVel, bubble.vy));
                }
                
                dragData.isDragging = false;
                dragData.hasStartedDrag = false;
                bubble.isDragging = false;
                document.removeEventListener('mousemove', mousemove);
                document.removeEventListener('mouseup', mouseup);
            };
            
            document.addEventListener('mousemove', mousemove);
            document.addEventListener('mouseup', mouseup);
        });
        
        // store drag data on bubble for use in update loop
        bubble.dragData = dragData;
    }
    
    startLoop() {
        const update = () => {
            this.updateBubbles();
            requestAnimationFrame(update);
        };
        requestAnimationFrame(update);
    }
    
    updateBubbles() {
        const rect = this.container.getBoundingClientRect();
        
    this.bubbles.forEach(bubble => {
            // handle dragged bubbles with closer following and collision pushing
            if (bubble.isDragging && bubble.dragData) {
                const dragData = bubble.dragData;
                
                // only apply lag behavior after actual dragging has started
                if (dragData.hasStartedDrag) {
                    // smooth drag: snap when close, smooth when far to avoid jitter 'ping-pong'
                    const dx = dragData.targetX - bubble.x;
                    const dy = dragData.targetY - bubble.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist > 20) {
                        // far: move quickly towards cursor
                        bubble.x += dx * 0.5;
                        bubble.y += dy * 0.5;
                    } else if (dist > 2) {
                        // near: gentle easing
                        bubble.x += dx * 0.35;
                        bubble.y += dy * 0.35;
                    } else {
                        // snap when very close
                        bubble.x = dragData.targetX;
                        bubble.y = dragData.targetY;
                    }
                    // zero out velocities while dragging so we don't accumulate bounce energy
                    bubble.vx = 0;
                    bubble.vy = 0;
                }
                // if we haven't started dragging yet, bubble stays in place
                
                // COLLISION PUSHING: dragged bubble pushes others away
                this.bubbles.forEach(other => {
                    if (other === bubble || other.isDragging) return;
                    
                    const dx = other.x - bubble.x;
                    const dy = other.y - bubble.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const minDistance = bubble.radius + other.radius + 5;
                    
                    if (distance < minDistance && distance > 0) {
                        // simple push away from dragged bubble
                        const nx = dx / distance;
                        const ny = dy / distance;
                        
                        // move other bubble to safe distance
                        const targetDistance = minDistance + 2;
                        other.x = bubble.x + nx * targetDistance;
                        other.y = bubble.y + ny * targetDistance;
                        
                        // add gentle velocity away from dragged bubble
                        other.vx += nx * 2;
                        other.vy += ny * 2;
                        
                        // keep in bounds
                        other.x = Math.max(other.radius, Math.min(rect.width - other.radius, other.x));
                        other.y = Math.max(other.radius, Math.min(rect.height - other.radius, other.y));
                    }
                });
                
                // update DOM position for dragged bubbles
                bubble.element.style.left = (bubble.x - bubble.radius) + 'px';
                bubble.element.style.top = (bubble.y - bubble.radius) + 'px';
                return; // skip regular physics for dragged bubbles
            }
            
            // derive physics factors from coffee level
            // speed multiplier grows roughly exponentially for extra chaos
            const speedMul = 0.6 + (this.coffeeLevel * 0.55) + Math.pow(this.coffeeLevel, 1.6) * 0.15; // ~0.6 -> ~2.3
            const friction = 0.99 - (this.coffeeLevel * 0.01); // 0.99 down to 0.96
            const wallBounceRetention = 0.85 + (this.coffeeLevel * 0.03); // 0.85 -> 0.94
            const collisionBounce = 0.7 + (this.coffeeLevel * 0.15); // 0.7 -> 1.15
            const jitterChance = this.coffeeLevel * 0.02; // up to 6% per frame at lvl 3
            const jitterMagnitude = 0.5 + this.coffeeLevel * 1.2; // 0.5 -> 4.1

            // apply physics to non-dragged bubbles with coffee-based energy
            bubble.x += bubble.vx * speedMul;
            bubble.y += bubble.vy * speedMul;

            // random jitter at high coffee levels
            if (Math.random() < jitterChance) {
                bubble.vx += (Math.random() - 0.5) * jitterMagnitude;
                bubble.vy += (Math.random() - 0.5) * jitterMagnitude;
            }

            // friction
            bubble.vx *= friction;
            bubble.vy *= friction;
            
            // bounce off of walls
            if (bubble.x - bubble.radius <= 0) {
                bubble.x = bubble.radius;
                bubble.vx = Math.abs(bubble.vx) * wallBounceRetention;
            }
            if (bubble.x + bubble.radius >= rect.width) {
                bubble.x = rect.width - bubble.radius;
                bubble.vx = -Math.abs(bubble.vx) * wallBounceRetention;
            }
            if (bubble.y - bubble.radius <= 0) {
                bubble.y = bubble.radius;
                bubble.vy = Math.abs(bubble.vy) * wallBounceRetention;
            }
            if (bubble.y + bubble.radius >= rect.height) {
                bubble.y = rect.height - bubble.radius;
                bubble.vy = -Math.abs(bubble.vy) * wallBounceRetention;
            }
            
            // bubble collisions
            this.bubbles.forEach(other => {
                if (bubble === other || other.isDragging || bubble.isDragging) return;
                
                const dx = bubble.x - other.x;
                const dy = bubble.y - other.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = bubble.radius + other.radius;
                
                if (distance < minDistance && distance > 0) {
                    // separate bubbles first (prevents sticking)
                    const overlap = minDistance - distance;
                    const separateForce = overlap * 0.5;
                    
                    const nx = dx / distance;
                    const ny = dy / distance;
                    
                    // BOUNCE bubbles
                    bubble.x += nx * separateForce;
                    bubble.y += ny * separateForce;
                    other.x -= nx * separateForce;
                    other.y -= ny * separateForce;
                    
                    const bounceStrength = collisionBounce; // higher = more sliding / chaos with coffee
                    
                    bubble.vx += nx * bounceStrength;
                    bubble.vy += ny * bounceStrength;
                    other.vx -= nx * bounceStrength;
                    other.vy -= ny * bounceStrength;
                }
            });
            
            // update DOM position (for non-dragged bubbles)
            bubble.element.style.left = (bubble.x - bubble.radius) + 'px';
            bubble.element.style.top = (bubble.y - bubble.radius) + 'px';
        });
    }
}

// smooth 3D project carousel (simplified & stable)
class ProjectWheel {
    constructor() {
        this.container = document.getElementById('projectWheel');
        this.items = Array.from(document.querySelectorAll('.project-item'));
        this.dots = Array.from(document.querySelectorAll('.wheel-dot'));
        this.prevBtn = document.getElementById('wheelPrevBtn');
        this.nextBtn = document.getElementById('wheelNextBtn');
        this.total = this.items.length;
        this.current = 0;
        this.isAnimating = false;
        this.autoRotate = null;
        
        // simplified rotation properties
        this.angle = 0;
        this.targetAngle = 0;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartAngle = 0;
        
        this.setup();
        this.render();
    }

    setup() {
        // set up 3D context
        this.container.style.transformStyle = 'preserve-3d';
        
        // position items in a circle
        const radius = 350;
        const angleStep = (Math.PI * 2) / this.total;
        
        this.items.forEach((item, index) => {
            const itemAngle = angleStep * index;
            const x = Math.sin(itemAngle) * radius;
            const z = Math.cos(itemAngle) * radius;
            
            item.style.position = 'absolute';
            item.style.transformOrigin = 'center center';
            item.dataset.angle = itemAngle;
            item.dataset.x = x;
            item.dataset.z = z;
            
            // click to navigate
            item.addEventListener('click', () => this.goTo(index));
        });
        
        // navigation controls
        this.prevBtn.addEventListener('click', () => this.shift(-1)); // Previous = counter-clockwise
        this.nextBtn.addEventListener('click', () => this.shift(1));  // Next = clockwise
        this.dots.forEach((dot, i) => dot.addEventListener('click', () => this.goTo(i)));
        
        // click to navigate
        this.items.forEach((item, index) => {
            item.addEventListener('click', () => this.goTo(index));
        });
        
        // auto rotate
        this.startAuto();
        this.container.addEventListener('mouseenter', () => this.stopAuto());
        this.container.addEventListener('mouseleave', () => this.startAuto());
    }

    addDragControls() {
        let isDragging = false;
        let startX = 0;
        let startAngle = 0;
        
        const handleStart = (e) => {
            isDragging = true;
            this.isDragging = true;
            this.stopAuto();
            
            startX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            startAngle = this.angle;
            
            this.container.style.cursor = 'grabbing';
        };
        
        const handleMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
            const currentX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const deltaX = currentX - startX;
            const sensitivity = 0.01;
            
            this.angle = startAngle + deltaX * sensitivity;
            this.targetAngle = this.angle;
        };
        
        const handleEnd = () => {
            if (!isDragging) return;
            isDragging = false;
            this.isDragging = false;
            
            this.container.style.cursor = 'grab';
            
            // snap to nearest item
            const angleStep = (Math.PI * 2) / this.total;
            const nearestIndex = Math.round(-this.angle / angleStep) % this.total;
            const correctedIndex = nearestIndex < 0 ? nearestIndex + this.total : nearestIndex;
            
            this.goTo(correctedIndex);
            this.startAuto();
        };
        
        // mouse events
        this.container.addEventListener('mousedown', handleStart);
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);
        
        // touch events
        this.container.addEventListener('touchstart', handleStart, { passive: true });
        document.addEventListener('touchmove', handleMove, { passive: false });
        document.addEventListener('touchend', handleEnd);
    }

    startAnimationLoop() {
        const animate = () => {
            if (!this.isDragging) {
                const diff = this.targetAngle - this.angle;
                if (Math.abs(diff) > 0.001) {
                    this.angle += diff * 0.1;
                }
            }
            
            this.render();
            requestAnimationFrame(animate);
        };
        animate();
    }

    render() {
        // predefined positions and rotations for 5 positions
        const positions = [
            { x: 0, z: 350, angle: 0 },      // center
            { x: 240, z: 280, angle: -45 },  // right
            { x: 380, z: 100, angle: -75 },  // far right
            { x: -380, z: 100, angle: 75 },  // far left
            { x: -240, z: 280, angle: 45 }   // left
        ];
        
        const opacities = [1, 0.8, 0.4, 0.4, 0.8];
        const scales = [0.75, 0.65, 0.5, 0.5, 0.65];
        
        // create array of card indices in current display order
        const cardOrder = [];
        for (let i = 0; i < this.total; i++) {
            cardOrder.push((this.current + i) % this.total);
        }
        
        // apply positions to cards based on their order
        this.items.forEach((item, cardIndex) => {
            const positionIndex = cardOrder.indexOf(cardIndex);
            
            if (positionIndex < positions.length) {
                // card is visible - use predefined position
                const pos = positions[positionIndex];
                item.style.transform = `translate(-50%, -50%) translate3d(${pos.x}px, 0, ${pos.z}px) rotateY(${pos.angle}deg) scale(${scales[positionIndex]})`;
                item.style.opacity = opacities[positionIndex];
                item.style.filter = `brightness(${opacities[positionIndex]})`;
                item.style.zIndex = positions.length - positionIndex;
            } else {
                // card is hidden behind
                item.style.transform = `translate(-50%, -50%) translate3d(0, 0, -200px) scale(0.5)`;
                item.style.opacity = 0;
                item.style.filter = 'brightness(0.5)';
                item.style.zIndex = 1;
            }
        });
        
        // update dots
        this.dots.forEach((dot, i) => dot.classList.toggle('active', i === this.current));
        
        // update focused state
        this.items.forEach((item, i) => {
            item.classList.toggle('focused', i === this.current);
        });
    }

    shift(direction) {
        if (this.isAnimating) return;
        this.isAnimating = true;
        
        this.current = (this.current + direction + this.total) % this.total;
        this.render();
        
        setTimeout(() => { this.isAnimating = false; }, 600);
    }

    goTo(index) {
        if (this.isAnimating || index === this.current) return;
        this.isAnimating = true;
        
        this.current = index;
        this.render();
        
        setTimeout(() => { this.isAnimating = false; }, 600);
    }

    startAuto() {
        this.stopAuto();
        this.autoRotate = setInterval(() => {
            if (!this.isDragging && !this.isAnimating) {
                this.shift(1);
            }
        }, 8000);
    }

    stopAuto() {
        if (this.autoRotate) {
            clearInterval(this.autoRotate);
            this.autoRotate = null;
        }
    }
}

// contact form handler
class ContactForm {
    constructor() {
        this.form = document.querySelector('.contact-form');
        this.init();
    }

    init() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
            const msg = this.form.querySelector('textarea#message');
            if (msg) {
                const autoSize = () => {
                    msg.style.height = 'auto';
                    const max = Math.round(window.innerHeight * 0.4);
                    const needed = msg.scrollHeight + 2;
                    if (needed < max) {
                        msg.style.overflowY = 'hidden';
                        msg.style.height = needed + 'px';
                    } else {
                        msg.style.overflowY = 'auto';
                        msg.style.height = max + 'px';
                    }
                };
                ['input','change'].forEach(ev => msg.addEventListener(ev, autoSize));
                // initial sizing after load
                setTimeout(autoSize, 0);
            }
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        const statusEl = document.getElementById('formStatus');
        const formData = new FormData(this.form);
        const honeypot = formData.get('company');
        const name = (formData.get('name')||'').toString().trim();
        const email = (formData.get('email')||'').toString().trim();
        const message = (formData.get('message')||'').toString().trim();

        const setStatus = (msg, ok=false) => {
            if (!statusEl) return;
            statusEl.textContent = msg;
            statusEl.classList.remove('success','error');
            statusEl.classList.add(ok ? 'success' : 'error');
        };

        // honeypot bot trap
        if (honeypot) { return; }

        if (!name || !email || !message) {
            setStatus('Please fill in all fields.');
            return;
        }
        const emailRegex = /^[\w.!#$%&'*+/=?`{|}~-]+@[\w-]+(\.[\w-]+)+$/;
        if (!emailRegex.test(email)) {
            setStatus('Please enter a valid email address.');
            return;
        }
        if (message.length < 10) {
            setStatus('Message is a little short — add more detail.');
            return;
        }

        setStatus('Sending...', true);

        try {
            // add subject hidden field if not present
            if (!this.form.querySelector('input[name="_subject"]')) {
                const subj = document.createElement('input');
                subj.type = 'hidden';
                subj.name = '_subject';
                subj.value = 'Portfolio Contact';
                this.form.appendChild(subj);
            }

            // build payload: prefer FormData to keep compatibility (attachments later)
            const response = await fetch(this.form.action || 'https://formspree.io/f/mblkeoov', {
                method: 'POST',
                headers: { 'Accept': 'application/json' },
                body: formData
            });

            if (response.ok) {
                setStatus('Thank you! Your message has been sent.', true);
                this.form.reset();
            } else {
                // attempt to parse JSON error
                let errMsg = 'Send failed. Please try again later.';
                try {
                    const data = await response.json();
                    if (data && data.error) errMsg = data.error;
                } catch(_) {}
                setStatus(errMsg);
            }
        } catch (err) {
            setStatus('Network error. Please retry.');
        }
    }
}

// typing effect
function startTypingEffect() {
    if (window.__typingCleanup) window.__typingCleanup();

    const root = document.querySelector('.typing-text');
    if (!root) {
        console.warn('Typing effect root .typing-text not found');
        return;
    }

    const FAST_SPEED = 15; // ms per character
    const lines = [
        { text: "Hi, I'm Davis Parlour,", tag: 'h1', cls: 'hero-title', speed: FAST_SPEED, cursor: 'gradient' },
        { text: 'Graduate Software Engineer.', tag: 'p', cls: 'hero-subtitle', speed: FAST_SPEED, cursor: 'normal' },
        { text: 'First-Class BSc Computer Science.', tag: 'p', cls: 'hero-description', speed: FAST_SPEED, cursor: 'normal' }
    ];

    const timeouts = [];
    function later(fn, ms){ const id = setTimeout(fn, ms); timeouts.push(id); return id; }
    window.__typingCleanup = () => { timeouts.forEach(clearTimeout); if (cursor && cursor.remove) cursor.remove(); };

    const cursor = document.createElement('span');
    cursor.id = 'typing-cursor';
    cursor.textContent = '';
    const applyCursorMode = (mode) => {
        cursor.className = mode === 'gradient' ? 'typing-cursor' : 'typing-cursor-normal';
    };

    root.innerHTML = '';
    const placeholders = [];
    lines.forEach(l => {
        const el = document.createElement(l.tag);
        el.className = l.cls + ' typing-placeholder';
        el.innerHTML = '&nbsp;';
        root.appendChild(el);
        placeholders.push(el);
    });
    root.style.display = 'flex';
    root.style.flexDirection = 'column';
    root.style.alignItems = 'flex-start';
    root.style.justifyContent = 'flex-start';

    let lineIndex = 0;
    let charIndex = 0;
    let activeEl = null;
    let activeText = null;

    function startLine() {
        const line = lines[lineIndex];
        activeEl = placeholders[lineIndex];
        activeEl.textContent = '';
        activeText = document.createTextNode('');
        activeEl.appendChild(activeText);
        applyCursorMode(line.cursor);
        activeEl.appendChild(cursor);
        charIndex = 0;
        typeChar();
    }

    function typeChar() {
        const line = lines[lineIndex];
        if (charIndex <= line.text.length) {
            activeText.nodeValue = line.text.slice(0, charIndex);
            if (charIndex === line.text.length) {
                // finish line, move cursor out temporarily (so it doesn't duplicate when next line starts)
                cursor.remove();
                lineIndex++;
                if (lineIndex < lines.length) {
                    later(startLine, 400);
                } else {
                    // proceed to buttons
                    later(showButtons, 500);
                }
                return;
            }
            charIndex++;
            later(typeChar, line.speed);
        }
    }

    function showButtons() {
        // type out pseudo code for the buttons
        const codeBlock = document.createElement('pre');
        codeBlock.className = 'code-block typing-buttons-code';
        root.appendChild(codeBlock);

        const codeLines = [
            '<a class="btn btn-primary" href="#projects">View My Work</a>',
            '<a class="btn btn-secondary" href="Davis-Parlour-CV.pdf" target="_blank">Download CV</a>'
        ];
        const fullCode = codeLines.join('\n');
        let codeIndex = 0;

        // place cursor inside code block
        applyCursorMode('normal');
        codeBlock.appendChild(cursor);

        function typeCodeChar() {
            if (codeIndex <= fullCode.length) {
                // update displayed code (textContent ensures HTML is escaped)
                const current = fullCode.slice(0, codeIndex);
                // keep cursor always at end by removing and re-appending
                cursor.remove();
                codeBlock.textContent = current;
                codeBlock.appendChild(cursor);
                codeIndex++;
                later(typeCodeChar, 10);
            } else {
                // finished typing code
                cursor.remove();
                // fade code, then show buttons
                codeBlock.classList.add('fade-out');
                later(() => {
                    codeBlock.remove();
                    revealRealButtons();
                }, 600);
            }
        }

        typeCodeChar();

        // after code typing finished, show buttons
        function revealRealButtons() {
            const container = document.createElement('div');
            container.className = 'hero-buttons';
            root.appendChild(container);
            const btnDefs = [
                { html: 'View My Work', cls: 'btn btn-primary btn-appearing', href: '#projects' },
                { html: '<i class="fas fa-download"></i> Download CV', cls: 'btn btn-secondary btn-appearing', href: 'Davis-Parlour-CV.pdf', target: '_blank' }
            ];
            let b = 0;
            function nextBtn(){
                if (b < btnDefs.length) {
                    const def = btnDefs[b++];
                    const a = document.createElement('a');
                    a.className = def.cls;
                    a.href = def.href;
                    if (def.target) a.target = def.target;
                    a.innerHTML = def.html;
                    container.appendChild(a);
                    later(nextBtn, 450);
                } else {
                    later(fixPunctuation, 600);
                }
            }
            nextBtn();
        }
    }

    // cool little thing where "I" go back and fix punctuation in real-time
    function fixPunctuation() {
        const first = root.querySelector('.hero-title');
        if (!first) return;
        if (first.textContent.endsWith(',')) {
            // place cursor inline for correction
            applyCursorMode('gradient');
            first.appendChild(cursor);
            const base = first.textContent.slice(0, -1);
            first.textContent = base;
            later(() => {
                first.textContent = base + '.';
                cursor.remove();
            }, 350);
        }
    }

    startLine();
}

function parallaxEffect() {
    const scrolled = window.pageYOffset;
    const heroElements = document.querySelectorAll('.floating-element');
    
    heroElements.forEach((element, index) => {
        const speed = 0.5 + (index * 0.1);
        const yPos = -(scrolled * speed);
        element.style.transform = `translateY(${yPos}px)`;
    });
}

// CSS animation for bubble entrance
const style = document.createElement('style');
style.textContent = `
    .skill-bubble {
        animation: bubbleEntrance 0.5s ease-out forwards;
    }
    
    @keyframes bubbleEntrance {
        from {
            opacity: 0;
            transform: scale(0);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }
    @keyframes pulse {
        from { transform: scale(1); filter: brightness(1); }
        to { transform: scale(1.08); filter: brightness(1.3); }
    }
    @keyframes coffeeRainbow {
        0% { background-position: 0% 50%; }
        50% { background-position: 200% 50%; }
        100% { background-position: 400% 50%; }
    }
`;
document.head.appendChild(style);

// initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SkillBubbles();
    new ProjectWheel();
    new ContactForm();
    // start typing effect after delay of 500ms
    setTimeout(startTypingEffect, 500);

    // refine about section so there's only a small consistent gap after stats on mobile (reduce empty space)
    function adjustAboutLayout(attempt=0){
        const about = document.getElementById('about');
        if(!about) return;
        const stats = about.querySelector('.about-stats');
        const isMobile = window.innerWidth <= 768;
        // clear any previous height overrides
        about.style.minHeight = '';
        if(!isMobile || !stats) {
            // reset cutoff height closer to desktop default
            about.style.setProperty('--about-grid-cutoff-height','2px');
            return;
        }
        const aboutRect = about.getBoundingClientRect();
        const statsRect = stats.getBoundingClientRect();
        const sectionHeight = about.offsetHeight; // current rendered height
        const distanceBottomOfStatsFromTop = statsRect.bottom - aboutRect.top;
        const desiredSpacingAfterStats = 20; 
        
        let cutoff = sectionHeight - distanceBottomOfStatsFromTop - desiredSpacingAfterStats;
        
        if(cutoff < 4){
            cutoff = 8;
            const neededExtra = distanceBottomOfStatsFromTop + desiredSpacingAfterStats + cutoff - sectionHeight;
            if(neededExtra > 0){
                const currentPadBottom = parseFloat(getComputedStyle(about).paddingBottom) || 0;
                about.style.paddingBottom = (currentPadBottom + neededExtra) + 'px';
            }
        }
        cutoff = Math.min(Math.max(cutoff, 8), 80); // clamp to new smaller range
        about.style.setProperty('--about-grid-cutoff-height', cutoff + 'px');
        if(attempt < 5){
            requestAnimationFrame(()=>adjustAboutLayout(attempt+1));
        }
    }
    adjustAboutLayout();
    setTimeout(()=>adjustAboutLayout(), 900); // after counters kick in
    window.addEventListener('resize', debounce(()=>adjustAboutLayout(), 120));
});

// konami code easter egg
let konamiCode = [];
const konamiSequence = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'KeyB', 'KeyA'
];

document.addEventListener('keydown', (e) => {
    konamiCode.push(e.code);
    konamiCode = konamiCode.slice(-konamiSequence.length);

    if (konamiCode.length === konamiSequence.length &&
        konamiCode.every((code, index) => code === konamiSequence[index])) {
        // easter egg activated (avoid filtering entire body to keep navbar solid)
        let overlay = document.getElementById('rainbowOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'rainbowOverlay';
            document.body.appendChild(overlay);
        }
        document.body.classList.add('rainbow-active');
        // auto remove after 5s
        setTimeout(() => {
            document.body.classList.remove('rainbow-active');
        }, 5000);
    }
});

// add rainbow CSS
const rainbowStyle = document.createElement('style');
rainbowStyle.textContent = `
    @keyframes rainbow {
        0% { filter: hue-rotate(0deg); }
        25% { filter: hue-rotate(90deg); }
        50% { filter: hue-rotate(180deg); }
        75% { filter: hue-rotate(270deg); }
        100% { filter: hue-rotate(360deg); }
    }
`;
document.head.appendChild(rainbowStyle);

// performance optimization: debounce scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// apply debouncing to scroll-heavy functions
window.addEventListener('scroll', debounce(parallaxEffect, 10));

