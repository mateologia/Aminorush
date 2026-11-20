/**
 * Utilitários de aleatoriedade com embaralhamento uniforme (Fisher-Yates).
 */

/**
 * Retorna uma nova cópia embaralhada do array sem mutar o original.
 * @template T
 * @param {T[]} array
 * @returns {T[]}
 */
export function shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

/**
 * Seleciona um item aleatório de um array.
 * @template T
 * @param {T[]} array
 * @returns {T}
 */
export function pickRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Seleciona `count` itens únicos aleatórios de um array sem mutá-lo.
 * @template T
 * @param {T[]} array
 * @param {number} count
 * @returns {T[]}
 */
export function sampleUnique(array, count) {
    return shuffle(array).slice(0, count);
}
