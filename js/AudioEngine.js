const AudioContext = window.AudioContext || window.webkitAudioContext;
export const ctx = new AudioContext();

export function resumeContext() {
    if (ctx.state === 'suspended') {
        ctx.resume();
    }
}
