/**
 * Gerenciador de elementos <canvas> com suporte automático a devicePixelRatio (telas QHD/Retina).
 */

export class CanvasManager {
    /**
     * @param {HTMLCanvasElement | string} target Elemento canvas ou seletor/ID
     */
    constructor(target) {
        this.canvas =
            typeof target === 'string'
                ? document.getElementById(target) || document.querySelector(target)
                : target;
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.width = 0;
        this.height = 0;
        this.dpr = 1;
        this.rafId = null;

        this._boundResize = () => this.resize();
        if (this.canvas) {
            this.resize();
            window.addEventListener('resize', this._boundResize);
        }
    }

    resize() {
        if (!this.canvas || !this.ctx) return;
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.canvas.width = Math.floor(this.width * this.dpr);
        this.canvas.height = Math.floor(this.height * this.dpr);
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;

        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }

    clear() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    /**
     * Inicia um loop de animação. Encerra automaticamente quando `stepFn` retorna `false`.
     * @param {(ctx: CanvasRenderingContext2D, width: number, height: number, dt: number) => boolean} stepFn
     */
    startLoop(stepFn) {
        if (!this.ctx) return;
        this.stopLoop();
        this.resize();

        let lastTime = performance.now();

        const loop = (now) => {
            const dt = Math.min((now - lastTime) / 16.6667, 3); // normalizado a ~60fps
            lastTime = now;

            this.clear();
            const shouldContinue = stepFn(this.ctx, this.width, this.height, dt);

            if (shouldContinue) {
                this.rafId = requestAnimationFrame(loop);
            } else {
                this.rafId = null;
                this.clear();
            }
        };

        this.rafId = requestAnimationFrame(loop);
    }

    stopLoop() {
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    destroy() {
        this.stopLoop();
        window.removeEventListener('resize', this._boundResize);
    }
}
