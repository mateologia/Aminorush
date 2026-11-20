/**
 * Serviço de áudio baseado em Web Audio API (zero dependência de arquivos externos).
 * Suporta silenciamento dinâmico e retomada segura de AudioContext após interação do usuário.
 */

class AudioService {
    constructor() {
        this.audioCtx = null;
        this.enabled = true;
    }

    init() {
        try {
            if (!this.audioCtx) {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (AudioContextClass) {
                    this.audioCtx = new AudioContextClass();
                }
            }
            if (this.audioCtx && this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }
        } catch {
            this.enabled = false;
        }
    }

    setEnabled(value) {
        this.enabled = Boolean(value);
        if (this.enabled) {
            this.init();
        }
    }

    isEnabled() {
        return this.enabled;
    }

    toggle() {
        this.setEnabled(!this.enabled);
        return this.enabled;
    }

    playTone(freq, type = 'sine', duration = 0.1, volume = 0.1) {
        if (!this.enabled) return;
        if (!this.audioCtx) this.init();
        if (!this.audioCtx) return;

        try {
            const now = this.audioCtx.currentTime;
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(volume, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start(now);
            osc.stop(now + duration);
        } catch {
            // Ignora erro caso o navegador bloqueie áudio antes de gesto do usuário
        }
    }

    playCorrect() {
        this.playTone(600, 'sine', 0.1, 0.1);
        setTimeout(() => this.playTone(800, 'sine', 0.15, 0.1), 100);
    }

    playWrong() {
        this.playTone(200, 'sawtooth', 0.3, 0.2);
    }

    playTick() {
        this.playTone(1000, 'square', 0.05, 0.02);
    }

    playPowerup() {
        this.playTone(400, 'triangle', 0.1, 0.1);
        setTimeout(() => this.playTone(600, 'triangle', 0.3, 0.1), 100);
    }

    playToast() {
        this.playTone(500, 'sine', 0.1, 0.1);
        setTimeout(() => this.playTone(800, 'sine', 0.1, 0.1), 100);
    }
}

export const audioService = new AudioService();
