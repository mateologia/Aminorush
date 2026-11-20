/**
 * Configurações padronizadas do modo Estrutura & Bioquímica (cobertura total: 20 aminoácidos).
 */

export const ESTRUTURA_BIOQUIMICA_CONFIG = {
    id: 'struc',
    slug: 'estrutura-e-bioquimica',
    labelKey: 'levelStruc',
    perfectAchievement: 'amino_boss',
    coverage: 'full',
    totalQuestions: 20,
    maxTime: 20,
    hasJustification: true,
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
};
