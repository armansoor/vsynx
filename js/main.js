import { resumeContext } from './AudioEngine.js';
import { Module } from './Module.js';
import { modules, cables } from './State.js';
import { updateCables } from './Cable.js';

// Expose functions to the global scope for HTML buttons
window.resumeContext = resumeContext;

window.addModule = function(type) {
    const pos = getNextPosition();
    new Module(type, pos.x, pos.y);
}

window.autoArrange = function() {
    const modW = 250; // module width + margin
    const modH = 300; // module height + margin
    const startX = 50;
    const startY = 80;
    const cols = Math.floor((window.innerWidth - 100) / modW) || 1;

    modules.forEach((mod, i) => {
        const c = i % cols;
        const r = Math.floor(i / cols);
        mod.x = startX + c * modW;
        mod.y = startY + r * modH;
        mod.element.style.left = mod.x + 'px';
        mod.element.style.top = mod.y + 'px';
        mod.element.style.transition = 'left 0.5s ease, top 0.5s ease';

        // Remove transition after animation
        setTimeout(() => {
            mod.element.style.transition = '';
        }, 500);
    });

    // Animate cables? Updating them every frame during transition is expensive.
    // Instead, we just update them once (they will jump), or we use requestAnimationFrame loop
    // to update cables during the transition.

    let frames = 0;
    function animateCables() {
        updateCables(cables);
        frames++;
        if(frames < 30) requestAnimationFrame(animateCables);
    }
    animateCables();
}

// Initial Output Module
new Module('OUTPUT', 600, 200);

// Smart Placement Logic
function getNextPosition() {
    const modW = 250;
    const modH = 300;
    const cols = Math.floor((window.innerWidth - 100) / modW) || 1;

    // Try grid positions
    for (let i = 0; i < 1000; i++) {
        const c = i % cols;
        const r = Math.floor(i / cols);
        const x = 50 + c * modW;
        const y = 50 + r * modH;

        // Check collision with existing modules
        const conflict = modules.some(m =>
            x < m.x + 200 && // visual width approx
            x + 200 > m.x &&
            y < m.y + 250 &&
            y + 250 > m.y
        );

        if (!conflict) return { x, y };
    }

    return {
        x: 50 + Math.random() * 50,
        y: 50 + Math.random() * 50
    };
}


// Main Loop
function loop() {
    requestAnimationFrame(loop);
}
loop();
