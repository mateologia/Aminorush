/**
 * Funções puras de pontuação, combos e estatísticas das partidas.
 */

/**
 * Pontos ganhos ao acertar uma pergunta do Quiz normal.
 * @param {number} timeLeft Tempo restante em segundos
 * @param {number} combo Multiplicador de combo atual (antes de incrementar)
 * @returns {number}
 */
export function calculateQuizPoints(timeLeft, combo) {
    return Math.floor((100 + timeLeft * 5) * (1 + combo * 0.1));
}

/**
 * Nova pontuação após erro no Quiz normal.
 * @param {number} currentScore
 * @returns {number}
 */
export function applyWrongPenalty(currentScore) {
    return Math.max(0, currentScore - 50);
}

/**
 * Nova pontuação após tempo esgotado no Quiz normal.
 * @param {number} currentScore
 * @returns {number}
 */
export function applyTimeoutPenalty(currentScore) {
    return Math.max(0, currentScore - 30);
}

/**
 * Pontos ganhos por aminoácido acertado no Codon Blitz.
 * @param {number} level
 * @returns {number}
 */
export function calculateArcadeStepPoints(level) {
    return 10 * level;
}

/**
 * Precisão percentual arredondada.
 * @param {number} correct
 * @param {number} total
 * @returns {number}
 */
export function calculateAccuracy(correct, total) {
    if (!total) return 0;
    return Math.round((correct / total) * 100);
}
