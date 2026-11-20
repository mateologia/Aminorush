/**
 * Configurações padronizadas do modo Nomenclatura (cobertura total: 20 aminoácidos).
 * Suporta os 3 submodos: 1 letra, 3 letras e completo (10 + 10), com estrutura visual de apoio.
 */

export const NOMENCLATURA_VARIANTS = {
    oneLetter: {
        id: 'oneLetter',
        labelKey: 'levelNom1',
        questionTypes: ['name_to_code1', 'code1_to_name'],
    },
    threeLetters: {
        id: 'threeLetters',
        labelKey: 'levelNom3',
        questionTypes: ['name_to_code3', 'code3_to_name'],
    },
    full: {
        id: 'full',
        labelKey: 'levelNomFull',
        questionTypes: ['name_to_code1', 'code1_to_name', 'name_to_code3', 'code3_to_name'],
        // Balanceamento garantido: 10 questões de 1 letra + 10 de 3 letras (20 aminoácidos únicos)
        typeGroups: [
            { types: ['name_to_code1', 'code1_to_name'], count: 10 },
            { types: ['name_to_code3', 'code3_to_name'], count: 10 },
        ],
    },
};

export const NOMENCLATURA_CONFIG = {
    id: 'nom',
    slug: 'nomenclatura',
    labelKey: 'levelNomFull',
    perfectAchievement: 'amino_trainee',
    coverage: 'full',
    totalQuestions: 20,
    maxTime: 20,
    hasJustification: true,
    showStructureImage: true,
    defaultVariant: 'full',
    questionTypes: NOMENCLATURA_VARIANTS.full.questionTypes,
    typeGroups: NOMENCLATURA_VARIANTS.full.typeGroups,
    variants: NOMENCLATURA_VARIANTS,
    badgeStyle: {
        background: 'rgba(108, 92, 231, 0.15)',
        color: '#6C5CE7',
    },
};

/**
 * Resolve a configuração efetiva para o submodo selecionado.
 * @param {'oneLetter' | 'threeLetters' | 'full'} [variantKey]
 */
export function resolveNomenclaturaVariant(variantKey) {
    return NOMENCLATURA_VARIANTS[variantKey] || NOMENCLATURA_VARIANTS[NOMENCLATURA_CONFIG.defaultVariant];
}
