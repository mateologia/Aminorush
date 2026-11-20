/**
 * Estado global centralizado do AminoRush (Quiz, Codon Blitz, Estudo e Preferências).
 */

export const state = {
    // Preferências globais
    lang: 'pt-BR',
    soundOn: true,
    screen: 'homeScreen',

    // Dados carregados
    aminoAcids: [],
    achievementsMeta: {},

    // Sessão do modo Quiz
    gameMode: 'nom',
    gameModeOptions: {},
    score: 0,
    combo: 1,
    maxCombo: 1,
    currentQuestion: 0,
    totalQuestions: 20,
    correctAnswers: 0,
    errors: [],
    timeLeft: 20,
    maxTime: 20,
    isAnswering: false,
    awaitingContinue: false,
    totalTimeSpent: 0,
    questionPool: [],

    // Power-ups & Freeze
    powerups: {
        fiftyFifty: 1,
        freeze: 1,
        radar: 1,
    },
    used5050: false,
    usedFreeze: false,
    usedRadar: false,
    isFrozen: false,
    freezeTimer: 0,

    // Banco de dados / estudo
    studyIndex: 0,

    // Estado específico do Codon Blitz (Arcade)
    arcade: {
        sequence: [],
        gridOptions: [],
        currentStep: 0,
        lives: 3,
        level: 1,
        targetLength: 3,
        maxLevel: 7,
    },
};

/**
 * Reinicia o estado de sessão para uma nova partida do Quiz normal.
 * @param {string} mode
 * @param {{ totalQuestions?: number, maxTime?: number, modeOptions?: Record<string, any> }} [config]
 */
export function resetQuizState(mode, config = {}) {
    state.gameMode = mode;
    state.gameModeOptions = config.modeOptions ? { ...config.modeOptions } : {};
    state.maxTime = config.maxTime ?? 20;
    state.timeLeft = state.maxTime;
    state.totalQuestions = config.totalQuestions ?? 20;
    state.score = 0;
    state.combo = 1;
    state.maxCombo = 1;
    state.currentQuestion = 0;
    state.correctAnswers = 0;
    state.errors = [];
    state.totalTimeSpent = 0;
    state.isAnswering = false;
    state.awaitingContinue = false;
    state.questionPool = [];
    state.powerups = { fiftyFifty: 1, freeze: 1, radar: 1 };
    state.used5050 = false;
    state.usedFreeze = false;
    state.usedRadar = false;
    state.isFrozen = false;
    state.freezeTimer = 0;
}

/**
 * Reinicia o estado de sessão para uma nova partida do Codon Blitz.
 * @param {{ initialTime?: number, maxTime?: number, lives?: number, maxLevel?: number }} [config]
 */
export function resetArcadeState(config = {}) {
    state.gameMode = 'arcade';
    state.gameModeOptions = {};
    state.score = 0;
    state.combo = 1;
    state.maxCombo = 1;
    state.totalTimeSpent = 0;
    state.maxTime = config.maxTime ?? 90;
    state.timeLeft = config.initialTime ?? 25;
    state.awaitingContinue = false;
    state.powerups = { fiftyFifty: 0, freeze: 1, radar: 1 };
    state.used5050 = false;
    state.usedFreeze = false;
    state.usedRadar = false;
    state.isFrozen = false;
    state.freezeTimer = 0;

    state.arcade = {
        sequence: [],
        gridOptions: [],
        currentStep: 0,
        lives: config.lives ?? 3,
        level: 1,
        targetLength: 3,
        maxLevel: config.maxLevel ?? 7,
    };
}
