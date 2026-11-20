/**
 * Registro central de todos os modos de jogo do AminoRush.
 */

import { codonBlitzMode } from './codon-blitz/index.js';
import { estruturaBioquimicaMode } from './estrutura-e-bioquimica/index.js';
import { modoCompletoMode } from './modo-completo/index.js';
import { nomenclaturaMode } from './nomenclatura/index.js';
import { propriedadesMode } from './propriedades/index.js';

export const QUIZ_MODES = {
    nom: nomenclaturaMode,
    prop: propriedadesMode,
    struc: estruturaBioquimicaMode,
    mixed: modoCompletoMode,
};

/**
 * Retorna o módulo do modo Quiz correspondente ao ID (fallback: nomenclatura).
 * @param {string} modeId
 */
export function getQuizMode(modeId) {
    return QUIZ_MODES[modeId] || nomenclaturaMode;
}

export {
    codonBlitzMode,
    estruturaBioquimicaMode,
    modoCompletoMode,
    nomenclaturaMode,
    propriedadesMode,
};
