import { ctx } from './AudioEngine.js';
import { modules } from './State.js';
import { startDragModule, startCableDrag, endCableDrag, removeCablesFromInput } from './Interaction.js';

export class Module {
    constructor(type, x, y) {
        this.id = 'mod_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        this.type = type;
        this.x = x;
        this.y = y;
        this.inputs = {};
        this.outputs = {};
        this.audioNode = null;

        this.element = this.createUI();
        this.initAudio();
        document.getElementById('rack').appendChild(this.element);

        modules.push(this);
    }

    initAudio() {
        if (this.type === 'VCO') {
            this.audioNode = ctx.createOscillator();
            this.audioNode.type = 'sawtooth';
            this.audioNode.frequency.value = 440;
            this.audioNode.start();
            this.outputs['out'] = this.audioNode;
        } else if (this.type === 'VCA') {
            this.audioNode = ctx.createGain();
            this.audioNode.gain.value = 0.5;
            this.inputs['in'] = this.audioNode;
            this.outputs['out'] = this.audioNode;
        } else if (this.type === 'OUTPUT') {
            this.audioNode = ctx.destination;
            this.inputs['in'] = this.audioNode;
        }
    }

    createUI() {
        const div = document.createElement('div');
        div.className = 'module';
        div.style.left = this.x + 'px';
        div.style.top = this.y + 'px';
        div.id = this.id;

        // Header for Dragging
        const header = document.createElement('div');
        header.className = 'module-header';
        header.innerText = this.type;
        header.onmousedown = (e) => startDragModule(e, this);
        header.ontouchstart = (e) => startDragModule(e, this); // Touch support
        div.appendChild(header);

        // Controls
        if (this.type === 'VCO') {
            this.addKnob(div, 'Freq', 50, 2000, 440, val => this.audioNode.frequency.value = val);
            this.addSelect(div, ['sine', 'square', 'sawtooth', 'triangle'], val => this.audioNode.type = val);
        } else if (this.type === 'VCA') {
            this.addKnob(div, 'Level', 0, 1, 0.5, val => this.audioNode.gain.value = val);
        }

        // Ports
        const portsDiv = document.createElement('div');
        portsDiv.className = 'ports';

        // Input Port
        if (this.type !== 'VCO') {
            const port = document.createElement('div');
            port.className = 'port input';
            port.dataset.type = 'in';
            port.dataset.moduleId = this.id;

            // Mouse
            port.onmouseup = (e) => endCableDrag(e, this.id, 'in');
            port.ondblclick = (e) => {
                e.stopPropagation();
                removeCablesFromInput(this.id, 'in');
            };

            // Touch handled by handleTouchDrop in Interaction.js detecting elementFromPoint

            portsDiv.appendChild(port);
        } else {
            portsDiv.appendChild(document.createElement('div')); // Spacer
        }

        // Output Port
        if (this.type !== 'OUTPUT') {
            const port = document.createElement('div');
            port.className = 'port output';
            port.dataset.type = 'out';
            port.dataset.moduleId = this.id;

            port.onmousedown = (e) => startCableDrag(e, this.id, 'out');
            port.ontouchstart = (e) => startCableDrag(e, this.id, 'out');

            portsDiv.appendChild(port);
        }

        div.appendChild(portsDiv);
        return div;
    }

    addKnob(parent, labelText, min, max, def, callback) {
        const group = document.createElement('div');
        group.className = 'control-group';
        const label = document.createElement('label');
        label.innerText = labelText;
        const input = document.createElement('input');
        input.type = 'range';
        input.min = min;
        input.max = max;
        input.step = 0.01;
        input.value = def;
        // Touch support for range inputs is usually handled by browser default behavior
        // But we might need stopPropagation if dragging module interferes?
        // Dragging module is on header only, so input range should be fine.
        input.oninput = (e) => callback(parseFloat(e.target.value));

        group.appendChild(label);
        group.appendChild(input);
        parent.appendChild(group);
    }

    addSelect(parent, options, callback) {
        const group = document.createElement('div');
        group.className = 'control-group';
        const select = document.createElement('select');
        select.style.width = "100%";
        options.forEach(opt => {
            const o = document.createElement('option');
            o.value = opt;
            o.innerText = opt;
            if(opt === 'sawtooth') o.selected = true;
            select.appendChild(o);
        });
        select.onchange = (e) => callback(e.target.value);
        group.appendChild(select);
        parent.appendChild(group);
    }
}
