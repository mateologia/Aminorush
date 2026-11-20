/**
 * Ponto de entrada padronizado do modo Propriedades.
 */

import { quizGameEngine } from '../../core/gameEngine.js';
import { PROPRIEDADES_CONFIG } from './config.js';
import { createPropriedadesPool } from './logic.js';

export const propriedadesMode = {
    ...PROPRIEDADES_CONFIG,
    createQuestionPool: createPropriedadesPool,
    start(options = {}) {
        quizGameEngine.start(this, options);
    },
};
