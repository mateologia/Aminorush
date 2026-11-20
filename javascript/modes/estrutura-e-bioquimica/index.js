/**
 * Ponto de entrada padronizado do modo Estrutura & Bioquímica.
 */

import { quizGameEngine } from '../../core/gameEngine.js';
import { ESTRUTURA_BIOQUIMICA_CONFIG } from './config.js';
import { createEstruturaBioquimicaPool } from './logic.js';

export const estruturaBioquimicaMode = {
    ...ESTRUTURA_BIOQUIMICA_CONFIG,
    createQuestionPool: createEstruturaBioquimicaPool,
    start(options = {}) {
        quizGameEngine.start(this, options);
    },
};
