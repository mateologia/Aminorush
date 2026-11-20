/**
 * Regras e geração de perguntas do Modo Completo com cobertura total (20/20 aminoácidos).
 */

import { generateFullCoveragePool } from '../../core/questionEngine.js';
import { MODO_COMPLETO_CONFIG } from './config.js';

/**
 * Gera 20 questões únicas (1 por aminoácido) cobrindo todos os temas de forma balanceada.
 * @param {Array<any>} aminoAcids
 */
export function createModoCompletoPool(aminoAcids) {
    return generateFullCoveragePool(aminoAcids, {
        allowedTypes: MODO_COMPLETO_CONFIG.questionTypes,
        typeGroups: MODO_COMPLETO_CONFIG.typeGroups,
    });
}
