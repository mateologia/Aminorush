/**
 * Configurações padronizadas do Modo Completo (cobertura total: 20 aminoácidos).
 * Garante presença equilibrada dos 3 pilares (Nomenclatura 1 e 3 letras, Propriedades e Estrutura & Bioquímica).
 */

export const MODO_COMPLETO_CONFIG = {
    id: 'mixed',
    slug: 'modo-completo',
    labelKey: 'levelMixed',
    perfectAchievement: 'amino_master',
    coverage: 'full',
    totalQuestions: 20,
    maxTime: 20,
    hasJustification: true,
    questionTypes: [
        'name_to_code1',
        'code1_to_name',
        'name_to_code3',
        'code3_to_name',
        'property_to_name',
        'name_to_group',
        'group_to_name',
        'dica_to_name',
        'name_to_dica',
        'formula_to_name',
        'name_to_formula',
        'image_to_name',
    ],
    // Distribuição balanceada totalizando 20 questões (1 por aminoácido):
    // 3 de sigla 1 letra + 3 de sigla 3 letras + 6 de propriedades + 8 de estrutura & bioquímica
    typeGroups: [
        { types: ['name_to_code1', 'code1_to_name'], count: 3 },
        { types: ['name_to_code3', 'code3_to_name'], count: 3 },
        { types: ['property_to_name', 'name_to_group', 'group_to_name'], count: 6 },
        {
            types: [
                'dica_to_name',
                'name_to_dica',
                'formula_to_name',
                'name_to_formula',
                'image_to_name',
            ],
            count: 8,
        },
    ],
    badgeStyle: {
        background: 'rgba(245, 158, 11, 0.15)',
        color: '#F59E0B',
    },
};
