/**
 * Definições e configurações dos 4 modos de Quiz do AminoRush.
 */

export const QUIZ_MODES = {
    nom: {
        id: 'nom',
        labelKey: 'levelNom',
        perfectAchievement: 'amino_trainee',
        totalQuestions: 15,
        maxTime: 20,
        questionTypes: ['name_to_code', 'code_to_name'],
        badgeStyle: {
            background: 'rgba(108, 92, 231, 0.15)',
            color: '#6C5CE7',
        },
    },
    prop: {
        id: 'prop',
        labelKey: 'levelProp',
        perfectAchievement: 'amino_sapiente',
        totalQuestions: 15,
        maxTime: 20,
        questionTypes: ['property_to_name', 'name_to_group', 'group_to_name'],
        badgeStyle: {
            background: 'rgba(0, 184, 148, 0.15)',
            color: '#00B894',
        },
    },
    struc: {
        id: 'struc',
        labelKey: 'levelStruc',
        perfectAchievement: 'amino_boss',
        totalQuestions: 15,
        maxTime: 20,
        questionTypes: [
            'dica_to_name',
            'name_to_dica',
            'formula_to_name',
            'name_to_formula',
            'image_to_name',
        ],
        badgeStyle: {
            background: 'rgba(168, 85, 247, 0.15)',
            color: '#A855F7',
        },
    },
    mixed: {
        id: 'mixed',
        labelKey: 'levelMixed',
        perfectAchievement: 'amino_master',
        totalQuestions: 15,
        maxTime: 20,
        questionTypes: [
            'name_to_code',
            'code_to_name',
            'property_to_name',
            'name_to_group',
            'group_to_name',
            'dica_to_name',
            'name_to_dica',
            'formula_to_name',
            'name_to_formula',
            'image_to_name',
        ],
        badgeStyle: {
            background: 'rgba(245, 158, 11, 0.15)',
            color: '#F59E0B',
        },
    },
};

/**
 * Retorna a configuração do modo solicitado (com fallback para 'nom').
 * @param {string} modeId
 */
export function getQuizModeConfig(modeId) {
    return QUIZ_MODES[modeId] || QUIZ_MODES.nom;
}
