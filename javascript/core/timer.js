/**
 * Temporizador de precisão (ticks de 100ms) com suporte a congelamento (Freeze)
 * e callbacks desacoplados para Quiz e Codon Blitz.
 */

export class GameTimer {
    constructor() {
        this.intervalId = null;
        this.timeLeft = 0;
        this.maxTime = 20;
        this.isFrozen = false;
        this.freezeRemaining = 0;
        this.urgentThreshold = 5.5;
        this._lastTickTime = 0;
        this._callbacks = {};
    }

    /**
     * Inicia (ou reinicia) a contagem regressiva.
     * @param {{
     *   duration: number,
     *   maxTime?: number,
     *   urgentThreshold?: number,
     *   onTick?: (snapshot: { timeLeft: number, maxTime: number, isFrozen: boolean, freezeRemaining: number }) => void,
     *   onUrgentSecond?: (secondsLeft: number) => void,
     *   onFreezeEnd?: () => void,
     *   onTimeout?: () => void
     * }} options
     */
    start(options) {
        this.stop();

        this.timeLeft = options.duration;
        this.maxTime = options.maxTime ?? options.duration;
        this.urgentThreshold = options.urgentThreshold ?? 5.5;
        this.isFrozen = false;
        this.freezeRemaining = 0;
        this._lastTickTime = this.timeLeft;
        this._callbacks = {
            onTick: options.onTick,
            onUrgentSecond: options.onUrgentSecond,
            onFreezeEnd: options.onFreezeEnd,
            onTimeout: options.onTimeout,
        };

        this._emitTick();

        this.intervalId = setInterval(() => {
            if (this.isFrozen) {
                this.freezeRemaining = Math.max(0, +(this.freezeRemaining - 0.1).toFixed(2));
                if (this.freezeRemaining <= 0) {
                    this.isFrozen = false;
                    this._callbacks.onFreezeEnd?.();
                }
            } else {
                this.timeLeft = Math.max(0, +(this.timeLeft - 0.1).toFixed(2));

                if (
                    this.timeLeft <= this.urgentThreshold &&
                    this.timeLeft > 0 &&
                    Math.ceil(this.timeLeft) < Math.ceil(this._lastTickTime)
                ) {
                    this._callbacks.onUrgentSecond?.(Math.ceil(this.timeLeft));
                }
                this._lastTickTime = this.timeLeft;
            }

            this._emitTick();

            if (this.timeLeft <= 0) {
                this.stop();
                this._callbacks.onTimeout?.();
            }
        }, 100);
    }

    /**
     * Congela o temporizador por `seconds` segundos.
     * @param {number} [seconds=5]
     */
    freeze(seconds = 5) {
        this.isFrozen = true;
        this.freezeRemaining = seconds;
        this._emitTick();
    }

    /**
     * Adiciona tempo ao contador respeitando `maxTime`.
     * @param {number} seconds
     */
    addTime(seconds) {
        this.timeLeft = Math.min(this.timeLeft + seconds, this.maxTime);
        this._lastTickTime = this.timeLeft;
        this._emitTick();
    }

    /**
     * Define diretamente o tempo restante (útil para janela extra de 5s no Codon Blitz).
     * @param {number} seconds
     */
    setTime(seconds) {
        this.timeLeft = Math.max(0, Math.min(seconds, this.maxTime));
        this._lastTickTime = this.timeLeft;
        this._emitTick();
    }

    stop() {
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    _emitTick() {
        this._callbacks.onTick?.({
            timeLeft: this.timeLeft,
            maxTime: this.maxTime,
            isFrozen: this.isFrozen,
            freezeRemaining: this.freezeRemaining,
        });
    }
}

export const gameTimer = new GameTimer();
