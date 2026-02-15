export const modules = [];
export const cables = [];
export let dragCable = null;
export let dragModule = null;

export function setDragCable(value) {
    dragCable = value;
}

export function setDragModule(value) {
    dragModule = value;
}

export function getDragCable() {
    return dragCable;
}

export function getDragModule() {
    return dragModule;
}
