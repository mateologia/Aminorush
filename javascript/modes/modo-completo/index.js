/**
 * Ponto de entrada padronizado do Modo Completo.
 */

import { quizGameEngine } from '../../core/gameEngine.js';
import { MODO_COMPLETO_CONFIG } from './config.js';
import { createModoCompletoPool } from './logic.js';

export const modoCompletoMode = {
    ...MODO_COMPLETO_CONFIG,
    createQuestionPool: createModoCompletoPool,
    start(options = {}) {
        quizGameEngine.start(this, options);
    },
};
