/**
 * Motor dinâmico de geração de perguntas com cobertura total (1 questão por aminoácido)
 * e distribuição balanceada de tipos de questão.
 */

import { localizationService } from '../services/localizationService.js';
import { formatFormula, interpolate } from '../utils/formatters.js';
import { pickRandom, sampleUnique, shuffle } from '../utils/random.js';

/**
 * Monta um objeto multilíngue de enunciado usando o template `questions.<type>` em todos os idiomas carregados.
 * @param {string} type
 * @param {(lang: string) => Record<string, string>} buildParams
 * @returns {Record<string, string>}
 */
function buildLocalizedPrompt(type, buildParams) {
    const locales = localizationService.getAllLocales();
    const prompt = {};

    Object.keys(locales).forEach((lang) => {
        const template = localizationService.t(`questions.${type}`, lang);
        prompt[lang] = interpolate(template, buildParams(lang));
    });

    return prompt;
}

/**
 * Seleciona alternativas únicas para um campo do aminoácido (`code1`, `code3`, `name`, `group`, `tip`, etc.).
 * @param {Array<any>} aminoAcids
 * @param {any} correctValue
 * @param {string} field
 * @param {number} count
 * @returns {Array<any>}
 */
function getUniqueOptions(aminoAcids, correctValue, field, count = 4) {
    const uniqueValues = [];
    const seen = new Set();

    aminoAcids.forEach((aa) => {
        const val = aa[field];
        const key = typeof val === 'object' ? val['en-US'] : String(val);
        if (!seen.has(key)) {
            seen.add(key);
            uniqueValues.push(val);
        }
    });

    const correctKey =
        typeof correctValue === 'object' ? correctValue['en-US'] : String(correctValue);
    const distractors = uniqueValues.filter((val) => {
        const key = typeof val === 'object' ? val['en-US'] : String(val);
        return key !== correctKey;
    });

    return shuffle([correctValue, ...sampleUnique(distractors, count - 1)]);
}

/**
 * Constrói uma lista balanceada de `totalCount` tipos de questão a partir de `allowedTypes`,
 * evitando desbalanceamento extremo por sorteio puro.
 * @param {string[]} allowedTypes
 * @param {number} totalCount
 * @returns {string[]}
 */
export function buildBalancedTypeDeck(allowedTypes, totalCount) {
    if (!Array.isArray(allowedTypes) || allowedTypes.length === 0 || totalCount <= 0) {
        return [];
    }

    const deck = [];
    const fullCycles = Math.floor(totalCount / allowedTypes.length);
    const remainder = totalCount % allowedTypes.length;

    for (let i = 0; i < fullCycles; i++) {
        deck.push(...allowedTypes);
    }

    if (remainder > 0) {
        deck.push(...sampleUnique(allowedTypes, remainder));
    }

    return shuffle(deck);
}

/**
 * Constrói um deck balanceado a partir de grupos com cotas explícitas.
 * Ex.: [{ types: ['name_to_code1', 'code1_to_name'], count: 10 }, { types: ['name_to_code3', 'code3_to_name'], count: 10 }]
 * @param {Array<{ types: string[], count: number }>} typeGroups
 * @param {number} totalCount
 * @returns {string[]}
 */
export function buildGroupedTypeDeck(typeGroups, totalCount) {
    const deck = [];
    typeGroups.forEach((group) => {
        if (group.count > 0 && Array.isArray(group.types) && group.types.length > 0) {
            deck.push(...buildBalancedTypeDeck(group.types, group.count));
        }
    });

    // Ajusta caso o número de aminoácidos difira da soma das cotas
    if (deck.length > totalCount) {
        return shuffle(deck).slice(0, totalCount);
    }
    if (deck.length < totalCount) {
        const allTypes = [...new Set(typeGroups.flatMap((g) => g.types))];
        deck.push(...buildBalancedTypeDeck(allTypes, totalCount - deck.length));
    }

    return shuffle(deck);
}

/**
 * Gera uma única questão tipada para o aminoácido informado.
 * @param {string} type
 * @param {any} correctAA
 * @param {Array<any>} aminoAcids
 */
export function generateQuestion(type, correctAA, aminoAcids, config = {}) {
    let questionText = {};
    let correctAnswer = null;
    let options = [];

    switch (type) {
        case 'name_to_code1': {
            questionText = buildLocalizedPrompt(type, (lang) => ({
                name: correctAA.name[lang],
            }));
            correctAnswer = correctAA.code1;
            options = getUniqueOptions(aminoAcids, correctAnswer, 'code1', 4);
            break;
        }

        case 'code1_to_name': {
            questionText = buildLocalizedPrompt(type, () => ({
                code: correctAA.code1,
            }));
            correctAnswer = correctAA.name;
            options = getUniqueOptions(aminoAcids, correctAnswer, 'name', 4);
            break;
        }

        case 'name_to_code3':
        case 'name_to_code': {
            const promptType = type === 'name_to_code3' ? 'name_to_code3' : 'name_to_code';
            questionText = buildLocalizedPrompt(promptType, (lang) => ({
                name: correctAA.name[lang],
            }));
            correctAnswer = correctAA.code3;
            options = getUniqueOptions(aminoAcids, correctAnswer, 'code3', 4);
            break;
        }

        case 'code3_to_name': {
            questionText = buildLocalizedPrompt(type, () => ({
                code: correctAA.code3,
            }));
            correctAnswer = correctAA.name;
            options = getUniqueOptions(aminoAcids, correctAnswer, 'name', 4);
            break;
        }

        case 'code_to_name': {
            const code = Math.random() > 0.5 ? correctAA.code3 : correctAA.code1;
            questionText = buildLocalizedPrompt(type, () => ({ code }));
            correctAnswer = correctAA.name;
            options = getUniqueOptions(aminoAcids, correctAnswer, 'name', 4);
            break;
        }

        case 'property_to_name': {
            const prop = pickRandom(correctAA.properties);
            questionText = buildLocalizedPrompt(type, (lang) => ({
                property: prop[lang],
            }));
            correctAnswer = correctAA.name;
            const wrongNames = aminoAcids
                .filter((aa) => !aa.properties.some((p) => p['en-US'] === prop['en-US']))
                .map((aa) => aa.name);
            options = shuffle([correctAnswer, ...sampleUnique(wrongNames, 3)]);
            break;
        }

        case 'name_to_group': {
            questionText = buildLocalizedPrompt(type, (lang) => ({
                name: correctAA.name[lang],
            }));
            correctAnswer = correctAA.group;
            options = getUniqueOptions(aminoAcids, correctAnswer, 'group', 4);
            break;
        }

        case 'group_to_name': {
            questionText = buildLocalizedPrompt(type, (lang) => ({
                group: correctAA.group[lang],
            }));
            correctAnswer = correctAA.name;
            const wrongNames = aminoAcids
                .filter((aa) => aa.groupKey !== correctAA.groupKey)
                .map((aa) => aa.name);
            options = shuffle([correctAnswer, ...sampleUnique(wrongNames, 3)]);
            break;
        }

        case 'dica_to_name': {
            questionText = buildLocalizedPrompt(type, (lang) => ({
                tip: correctAA.tip[lang],
            }));
            correctAnswer = correctAA.name;
            options = getUniqueOptions(aminoAcids, correctAnswer, 'name', 4);
            break;
        }

        case 'name_to_dica': {
            questionText = buildLocalizedPrompt(type, (lang) => ({
                name: correctAA.name[lang],
            }));
            correctAnswer = correctAA.tip;
            options = getUniqueOptions(aminoAcids, correctAnswer, 'tip', 4);
            break;
        }

        case 'formula_to_name': {
            const formatted = formatFormula(correctAA.formula);
            questionText = buildLocalizedPrompt(type, () => ({ formula: formatted }));
            correctAnswer = correctAA.name;
            // Garante que isômeros com mesma fórmula (ex.: Leu e Ile) nunca entrem como distratores
            const wrongNames = aminoAcids
                .filter((aa) => aa.formula !== correctAA.formula)
                .map((aa) => aa.name);
            options = shuffle([correctAnswer, ...sampleUnique(wrongNames, 3)]);
            break;
        }

        case 'name_to_formula': {
            questionText = buildLocalizedPrompt(type, (lang) => ({
                name: correctAA.name[lang],
            }));
            correctAnswer = formatFormula(correctAA.formula);
            const uniqueWrongFormulas = [
                ...new Set(
                    aminoAcids
                        .filter((aa) => aa.formula !== correctAA.formula)
                        .map((aa) => aa.formula)
                ),
            ];
            options = shuffle([
                correctAnswer,
                ...sampleUnique(uniqueWrongFormulas, 3).map((f) => formatFormula(f)),
            ]);
            break;
        }

        case 'image_to_name': {
            questionText = buildLocalizedPrompt(type, () => ({}));
            correctAnswer = correctAA.name;
            const wrongNames = aminoAcids
                .filter((aa) => aa.id !== correctAA.id)
                .map((aa) => aa.name);
            options = shuffle([correctAnswer, ...sampleUnique(wrongNames, 3)]);
            break;
        }

        default:
            throw new Error(`Tipo de questão desconhecido: ${type}`);
    }

    const showImage =
        Boolean(config.forceShowImage) ||
        type === 'image_to_name' ||
        type === 'formula_to_name' ||
        type === 'name_to_formula';

    return {
        type,
        aminoAcidId: correctAA.id,
        questionText,
        correctAnswer,
        options,
        correctAA,
        justification: correctAA.justification ?? null,
        questionImage: showImage ? correctAA.image : null,
    };
}

/**
 * Gera um pool com COBERTURA TOTAL: exatamente 1 questão para cada um dos 20 aminoácidos,
 * sem repetições, em ordem embaralhada e com tipos balanceados.
 * @param {Array<any>} aminoAcids
 * @param {{ allowedTypes?: string[], typeGroups?: Array<{ types: string[], count: number }> }} config
 */
export function generateFullCoveragePool(aminoAcids, config = {}) {
    const shuffledAminoAcids = shuffle(aminoAcids);
    const totalCount = shuffledAminoAcids.length;

    const typeDeck =
        Array.isArray(config.typeGroups) && config.typeGroups.length > 0
            ? buildGroupedTypeDeck(config.typeGroups, totalCount)
            : buildBalancedTypeDeck(config.allowedTypes || [], totalCount);

    return shuffledAminoAcids.map((aa, index) =>
        generateQuestion(typeDeck[index], aa, aminoAcids, {
            forceShowImage: Boolean(config.forceShowImage),
        })
    );
}

/**
 * Gera um pool de `count` perguntas sem repetir aminoácidos quando `count <= aminoAcids.length`.
 * Mantido para compatibilidade com chamadas diretas.
 * @param {string[]} allowedTypes
 * @param {Array<any>} aminoAcids
 * @param {number} [count]
 */
export function generateQuestionPool(allowedTypes, aminoAcids, count = aminoAcids.length) {
    if (count === aminoAcids.length) {
        return generateFullCoveragePool(aminoAcids, { allowedTypes });
    }

    const selectedAAs =
        count < aminoAcids.length
            ? sampleUnique(aminoAcids, count)
            : Array.from({ length: count }, () => pickRandom(aminoAcids));

    const typeDeck = buildBalancedTypeDeck(allowedTypes, selectedAAs.length);

    return selectedAAs.map((aa, index) =>
        generateQuestion(typeDeck[index], aa, aminoAcids)
    );
}

/**
 * Compara a opção escolhida com a resposta correta (suporta objetos multilíngues e strings).
 * @param {any} selected
 * @param {any} correct
 * @returns {boolean}
 */
export function isOptionEqual(selected, correct) {
    if (selected === correct) return true;
    if (
        selected &&
        correct &&
        typeof selected === 'object' &&
        typeof correct === 'object'
    ) {
        return selected['en-US'] === correct['en-US'];
    }
    return false;
}
