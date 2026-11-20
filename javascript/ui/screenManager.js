/**
 * Gerenciador central de navegação entre telas (`.screen.active`).
 * Controla também o layout expandido do container quando o Banco de Dados está ativo.
 */

import { state } from '../core/gameState.js';
import { localizationService } from '../services/localizationService.js';

class ScreenManager {
    constructor() {
        this.listeners = new Set();
    }

    /**
     * Exibe a tela alvo, ajusta layout do container e notifica ouvintes registrados.
     * @param {string} screenId
     */
    show(screenId) {
        const target = document.getElementById(screenId);
        if (!target) return;

        document.querySelectorAll('.screen').forEach((section) => {
            section.classList.remove('active');
        });
        target.classList.add('active');
        state.screen = screenId;

        const isDatabase = screenId === 'studyScreen';
        this.setLayoutMode(isDatabase ? 'wide' : 'default');

        localizationService.applyToDOM();
        this.listeners.forEach((cb) => cb(screenId));
    }

    /**
     * Ajusta o modo de largura do container principal ('default' | 'wide' | 'detail').
     * @param {'default' | 'wide' | 'detail'} mode
     */
    setLayoutMode(mode) {
        const container = document.querySelector('.container');
        if (!container) return;

        container.classList.toggle('container--wide', mode === 'wide');
        container.classList.toggle('container--detail', mode === 'detail');
        document.body.classList.toggle('is-database-view', mode !== 'default');
    }

    getCurrent() {
        return state.screen;
    }

    onChange(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }
}

export const screenManager = new ScreenManager();
