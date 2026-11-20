/**
 * Parâmetros de balanceamento do modo Codon Blitz (Arcade).
 */

export const CODON_BLITZ_CONFIG = {
    initialTime: 25,
    maxTime: 90,
    lives: 3,
    maxLevel: 7,
    gridSize: 12,
    roundBonusSeconds: 12,
    timeoutGraceSeconds: 5,
    freezeSeconds: 5,
    radarDurationMs: 3000,
    roundTransitionMs: 500,
};

/**
 * Calcula o comprimento da sequência peptídica alvo para o nível atual (de 3 até 6).
 * @param {number} level
 * @returns {number}
 */
export function getSequenceLengthForLevel(level) {
    return Math.min(3 + Math.floor((level - 1) / 2), 6);
}
