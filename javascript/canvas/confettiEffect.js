/**
 * Efeito de partículas de confete renderizado no #confettiCanvas com suporte a DPI.
 */

import { CanvasManager } from './canvasManager.js';

const CONFETTI_COLORS = ['#6C5CE7', '#00B894', '#FF6B6B', '#F59E0B', '#A855F7'];

class ConfettiEffect {
    constructor() {
        this.manager = null;
        this.particles = [];
    }

    _ensureManager() {
        if (!this.manager) {
            this.manager = new CanvasManager('confettiCanvas');
        }
        return this.manager;
    }

    /**
     * Dispara uma rajada de confete. Múltiplas chamadas acumulam partículas suavemente.
     * @param {number} [count=80]
     */
    trigger(count = 80) {
        const manager = this._ensureManager();
        if (!manager.ctx) return;

        manager.resize();

        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * manager.width,
                y: Math.random() * -100 - 20,
                size: Math.random() * 8 + 4,
                color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
                speedY: Math.random() * 3 + 2,
                speedX: Math.random() * 4 - 2,
                rot: Math.random() * 360,
                rotSpeed: Math.random() * 10 - 5,
            });
        }

        if (manager.rafId === null) {
            manager.startLoop((ctx, _width, height, dt) => {
                this.particles = this.particles.filter((p) => {
                    p.y += p.speedY * dt;
                    p.x += p.speedX * dt;
                    p.rot += p.rotSpeed * dt;

                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate((p.rot * Math.PI) / 180);
                    ctx.fillStyle = p.color;
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                    ctx.restore();

                    return p.y < height + 20;
                });

                return this.particles.length > 0;
            });
        }
    }

    clear() {
        this.particles = [];
        if (this.manager) {
            this.manager.stopLoop();
            this.manager.clear();
        }
    }
}

export const confettiEffect = new ConfettiEffect();
