// Drawing Utilities
export function createCableElement(fromId, toId) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', 'cable-path');
    document.getElementById('cable-layer').appendChild(path);
    updateSingleCable(path, fromId, toId);
    return path;
}

export function updateCables(cables) {
    cables.forEach(c => {
        updateSingleCable(c.element, c.from, c.to);
    });
}

export function updateSingleCable(pathEl, fromId, toId) {
    // Find DOM elements for ports
    const fromMod = document.getElementById(fromId);
    const toMod = document.getElementById(toId);

    if (!fromMod || !toMod) return;

    const outPort = fromMod.querySelector('.port.output');
    const inPort = toMod.querySelector('.port.input');

    if (!outPort || !inPort) return;

    const r1 = outPort.getBoundingClientRect();
    const r2 = inPort.getBoundingClientRect();

    // Adjust for SVG position (handles scrolling)
    const svg = document.getElementById('cable-layer');
    const svgRect = svg.getBoundingClientRect();

    const x1 = (r1.left + r1.width / 2) - svgRect.left;
    const y1 = (r1.top + r1.height / 2) - svgRect.top;
    const x2 = (r2.left + r2.width / 2) - svgRect.left;
    const y2 = (r2.top + r2.height / 2) - svgRect.top;

    drawCurve(pathEl, x1, y1, x2, y2);
}

export function drawCurve(pathEl, x1, y1, x2, y2) {
    // Bezier curve with "droop" logic based on distance
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const droop = Math.min(dist * 0.5, 200);

    // Control points
    const cp1x = x1;
    const cp1y = y1 + droop;
    const cp2x = x2;
    const cp2y = y2 + droop;

    const d = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
    pathEl.setAttribute('d', d);
}
