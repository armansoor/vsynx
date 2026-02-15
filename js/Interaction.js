import { modules, cables, getDragCable, getDragModule, setDragCable, setDragModule } from './State.js';
import { updateCables, createCableElement, drawCurve } from './Cable.js';

function getEventPos(e) {
    if (e.touches && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
}

// --- Module Dragging Logic ---
export function startDragModule(e, module) {
    if (e.type === 'touchstart') e.preventDefault();

    const pos = getEventPos(e);
    const modRect = module.element.getBoundingClientRect();

    const dragModule = {
        mod: module,
        // Store offset of mouse relative to module top-left
        offsetX: pos.x - modRect.left,
        offsetY: pos.y - modRect.top
    };
    setDragModule(dragModule);

    if (e.type === 'mousedown') {
        window.addEventListener('mousemove', onDragModule);
        window.addEventListener('mouseup', stopDragModule);
    } else {
        window.addEventListener('touchmove', onDragModule, { passive: false });
        window.addEventListener('touchend', stopDragModule);
    }
}

function onDragModule(e) {
    const dragModule = getDragModule();
    if (!dragModule) return;
    if (e.type === 'touchmove') e.preventDefault();

    const pos = getEventPos(e);
    const rack = document.getElementById('rack');
    const rackRect = rack.getBoundingClientRect();

    // Calculate new position relative to rack content
    // viewport_x - rack_viewport_x + scroll_x - mouse_offset
    dragModule.mod.x = (pos.x - rackRect.left + rack.scrollLeft) - dragModule.offsetX;
    dragModule.mod.y = (pos.y - rackRect.top + rack.scrollTop) - dragModule.offsetY;

    dragModule.mod.element.style.left = dragModule.mod.x + 'px';
    dragModule.mod.element.style.top = dragModule.mod.y + 'px';

    updateCables(cables);
}

function stopDragModule() {
    setDragModule(null);
    window.removeEventListener('mousemove', onDragModule);
    window.removeEventListener('mouseup', stopDragModule);
    window.removeEventListener('touchmove', onDragModule);
    window.removeEventListener('touchend', stopDragModule);
}

// --- Cable Patching Logic ---
export function startCableDrag(e, modId, portType) {
    e.stopPropagation();
    if (e.type === 'touchstart') e.preventDefault();

    const portEl = e.target;
    const rect = portEl.getBoundingClientRect();
    const pos = getEventPos(e);

    // We need startX/Y relative to SVG
    const svg = document.getElementById('cable-layer');
    const svgRect = svg.getBoundingClientRect();

    const dragCable = {
        fromMod: modId,
        startX: (rect.left + rect.width / 2) - svgRect.left,
        startY: (rect.top + rect.height / 2) - svgRect.top,
        currentX: pos.x - svgRect.left,
        currentY: pos.y - svgRect.top,
        tempLine: document.createElementNS('http://www.w3.org/2000/svg', 'path')
    };

    dragCable.tempLine.setAttribute('class', 'cable-path');
    dragCable.tempLine.style.opacity = '0.5';
    document.getElementById('cable-layer').appendChild(dragCable.tempLine);

    setDragCable(dragCable);

    if (e.type === 'mousedown') {
        window.addEventListener('mousemove', onCableDrag);
        window.addEventListener('mouseup', abortCableDrag);
    } else {
        window.addEventListener('touchmove', onCableDrag, { passive: false });
        window.addEventListener('touchend', handleTouchDrop);
    }
}

function onCableDrag(e) {
    const dragCable = getDragCable();
    if (!dragCable) return;
    if (e.type === 'touchmove') e.preventDefault();

    const pos = getEventPos(e);
    const svg = document.getElementById('cable-layer');
    const svgRect = svg.getBoundingClientRect();

    dragCable.currentX = pos.x - svgRect.left;
    dragCable.currentY = pos.y - svgRect.top;

    drawCurve(dragCable.tempLine, dragCable.startX, dragCable.startY, dragCable.currentX, dragCable.currentY);
}

function handleTouchDrop(e) {
    const dragCable = getDragCable();
    if (!dragCable) return;

    const touch = e.changedTouches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);

    if (target && target.classList.contains('port') && target.classList.contains('input')) {
        const modId = target.dataset.moduleId;
        completeConnection(dragCable, modId);
    }

    cleanupDrag();
}

export function endCableDrag(e, toModId, portType) {
    const dragCable = getDragCable();
    if (!dragCable) return;
    e.stopPropagation();

    completeConnection(dragCable, toModId);
    cleanupDrag();
}

function completeConnection(dragCable, toModId) {
    const sourceMod = modules.find(m => m.id === dragCable.fromMod);
    const destMod = modules.find(m => m.id === toModId);

    if (sourceMod && destMod && sourceMod !== destMod) {
        try {
            sourceMod.outputs['out'].connect(destMod.inputs['in']);

            cables.push({
                from: dragCable.fromMod,
                to: toModId,
                element: createCableElement(dragCable.fromMod, toModId)
            });
        } catch (err) {
            console.error("Connection failed", err);
        }
    }
}

function abortCableDrag() {
    cleanupDrag();
}

function cleanupDrag() {
    const dragCable = getDragCable();
    if (dragCable) {
        dragCable.tempLine.remove();
        setDragCable(null);
        window.removeEventListener('mousemove', onCableDrag);
        window.removeEventListener('mouseup', abortCableDrag);
        window.removeEventListener('touchmove', onCableDrag);
        window.removeEventListener('touchend', handleTouchDrop);
    }
}

export function removeCablesFromInput(moduleId, inputName) {
    const cablesToRemove = cables.filter(c => c.to === moduleId);

    cablesToRemove.forEach(c => {
        const sourceMod = modules.find(m => m.id === c.from);
        const destMod = modules.find(m => m.id === c.to);

        if (sourceMod && destMod) {
            try {
                sourceMod.outputs['out'].disconnect(destMod.inputs['in']);
            } catch(err) {
                console.warn(err);
            }
        }
        c.element.remove();
    });

    for (let i = cables.length - 1; i >= 0; i--) {
        if (cables[i].to === moduleId) {
            cables.splice(i, 1);
        }
    }
}
