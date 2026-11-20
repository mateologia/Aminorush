/**
 * Regras e geração de perguntas do modo Propriedades com cobertura total (20/20 aminoácidos).
 */

import { generateFullCoveragePool } from '../../core/questionEngine.js';
import { PROPRIEDADES_CONFIG } from './config.js';

/**
 * Gera 20 questões únicas (1 por aminoácido) balanceando os 3 tipos de propriedades químicas.
 * @param {Array<any>} aminoAcids
 */
export function createPropriedadesPool(aminoAcids) {
    return generateFullCoveragePool(aminoAcids, {
        allowedTypes: PROPRIEDADES_CONFIG.questionTypes,
    });
}
