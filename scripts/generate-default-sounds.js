/**
 * Generate default sound alert WAV files for StreamFinity
 * Pure Node.js — no dependencies
 */
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..', 'server', 'public', 'sounds', 'defaults');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const SR = 44100;
function sine(f, t) { return Math.sin(2 * Math.PI * f * t); }
function env(t, a, d, s, r, dur) {
    if (t < a) return t / a;
    if (t < a + d) return 1 - (1 - s) * ((t - a) / d);
    if (t < dur - r) return s;
    if (t < dur) return s * (1 - (t - (dur - r)) / r);
    return 0;
}
function writeWav(name, dur, fn) {
    const n = Math.ceil(SR * dur);
    const buf = Buffer.alloc(44 + n * 2);
    buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8);
    buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
    buf.writeUInt16LE(1, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28);
    buf.writeUInt16LE(2, 30); buf.writeUInt16LE(16, 32);
    buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
    for (let i = 0; i < n; i++) {
        const v = Math.max(-1, Math.min(1, fn(i / SR)));
        buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
    }
    fs.writeFileSync(path.join(OUT, name), buf);
    console.log(`  ✓ ${name} (${(buf.length / 1024).toFixed(1)}KB, ${dur}s)`);
}

console.log('Generating default sounds...');

writeWav('gift-alert.wav', 0.8, t => {
    const e = env(t, 0.01, 0.1, 0.4, 0.3, 0.8);
    return (sine(880, t) * 0.4 + sine(1320, t) * 0.3 * (t > 0.15 ? 1 : 0) + sine(1760, t) * 0.2 * (t > 0.3 ? 1 : 0)) * e;
});

writeWav('follow-alert.wav', 0.6, t => {
    const f = 440 + 440 * (t / 0.6);
    return (sine(f, t) * 0.5 + sine(f * 1.5, t) * 0.2) * env(t, 0.02, 0.1, 0.5, 0.2, 0.6);
});

writeWav('share-alert.wav', 0.5, t => {
    const b1 = t < 0.12 ? sine(1000, t) * env(t, 0.005, 0.03, 0.6, 0.04, 0.12) : 0;
    const b2 = t > 0.18 && t < 0.32 ? sine(1200, t) * env(t - 0.18, 0.005, 0.03, 0.6, 0.04, 0.14) : 0;
    return (b1 + b2) * 0.6;
});

writeWav('sub-alert.wav', 1.2, t => {
    const c1 = t < 0.4 ? (sine(523, t) + sine(659, t) + sine(784, t)) / 3 * env(t, 0.01, 0.1, 0.5, 0.15, 0.4) : 0;
    const c2 = t > 0.35 && t < 0.75 ? (sine(587, t) + sine(740, t) + sine(880, t)) / 3 * env(t - 0.35, 0.01, 0.1, 0.5, 0.15, 0.4) : 0;
    const c3 = t > 0.7 ? (sine(659, t) + sine(830, t) + sine(988, t)) / 3 * env(t - 0.7, 0.01, 0.15, 0.4, 0.25, 0.5) : 0;
    return (c1 + c2 + c3) * 0.5;
});

writeWav('chat-alert.wav', 0.25, t => sine(800 - 400 * (t / 0.25), t) * env(t, 0.005, 0.05, 0.2, 0.1, 0.25) * 0.5);

writeWav('like-alert.wav', 0.4, t => {
    const f = 2000 + 1000 * sine(12, t);
    return sine(f, t) * env(t, 0.005, 0.05, 0.3, 0.15, 0.4) * 0.35;
});

writeWav('coin-alert.wav', 0.5, t => {
    const e = env(t, 0.005, 0.08, 0.3, 0.2, 0.5);
    return (sine(2637, t) * 0.4 + sine(3520, t) * 0.2 * (t > 0.1 ? 1 : 0)) * e;
});

writeWav('levelup-alert.wav', 1.0, t => {
    const notes = [523, 659, 784, 1047];
    const idx = Math.min(Math.floor(t / 0.25), 3);
    const lt = t - idx * 0.25;
    return sine(notes[idx], t) * env(lt, 0.01, 0.05, 0.5, 0.1, 0.25) * 0.5;
});

writeWav('airhorn.wav', 1.5, t => {
    const e = env(t, 0.05, 0.2, 0.7, 0.4, 1.5);
    return (sine(220, t) * 0.3 + sine(440, t) * 0.3 + sine(660, t) * 0.2 + sine(880, t) * 0.1 + (Math.random() - 0.5) * 0.1) * e;
});

writeWav('ding.wav', 0.6, t => sine(1568, t) * env(t, 0.005, 0.1, 0.2, 0.3, 0.6) * 0.5);

console.log('\nDone! 10 default sounds generated.');
