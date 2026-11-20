/**
 * Regras e geração de perguntas do modo Estrutura & Bioquímica com cobertura total (20/20 aminoácidos).
 */

import { generateFullCoveragePool } from '../../core/questionEngine.js';
import { ESTRUTURA_BIOQUIMICA_CONFIG } from './config.js';

/**
 * Gera 20 questões únicas (1 por aminoácido), distribuindo exatamente 4 de cada um dos 5 tipos.
 * @param {Array<any>} aminoAcids
 */
export function createEstruturaBioquimicaPool(aminoAcids) {
    return generateFullCoveragePool(aminoAcids, {
        allowedTypes: ESTRUTURA_BIOQUIMICA_CONFIG.questionTypes,
    });
}
