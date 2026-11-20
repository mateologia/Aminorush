/**
 * Ponto de entrada padronizado do modo Nomenclatura com suporte aos 3 submodos.
 */

import { quizGameEngine } from '../../core/gameEngine.js';
import { NOMENCLATURA_CONFIG, resolveNomenclaturaVariant } from './config.js';
import { createNomenclaturaPool } from './logic.js';

export const nomenclaturaMode = {
    ...NOMENCLATURA_CONFIG,
    createQuestionPool: createNomenclaturaPool,
    start(options = {}) {
        const variant = resolveNomenclaturaVariant(options.variant);
        const runtimeConfig = {
            ...this,
            activeVariant: variant.id,
            labelKey: variant.labelKey,
            questionTypes: variant.questionTypes,
            typeGroups: variant.typeGroups,
        };
        quizGameEngine.start(runtimeConfig, { variant: variant.id });
    },
};
