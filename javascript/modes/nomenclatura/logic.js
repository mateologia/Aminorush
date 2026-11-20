/**
 * Regras e geração de perguntas do modo Nomenclatura com cobertura total (20/20 aminoácidos)
 * e exibição da imagem estrutural do aminoácido para reforço visual.
 */

import { generateFullCoveragePool } from '../../core/questionEngine.js';
import { NOMENCLATURA_CONFIG, resolveNomenclaturaVariant } from './config.js';

/**
 * Gera o pool de 20 questões únicas (1 por aminoácido) para o submodo escolhido.
 * @param {Array<any>} aminoAcids
 * @param {{ variant?: 'oneLetter' | 'threeLetters' | 'full' }} [options]
 */
export function createNomenclaturaPool(aminoAcids, options = {}) {
    const variant = resolveNomenclaturaVariant(options.variant);

    return generateFullCoveragePool(aminoAcids, {
        allowedTypes: variant.questionTypes,
        typeGroups: variant.typeGroups,
        forceShowImage: NOMENCLATURA_CONFIG.showStructureImage,
    });
}
