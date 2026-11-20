/**
 * Motor principal dos modos Quiz (Nomenclatura, Propriedades, Estrutura & Bioquímica e Modo Completo).
 * Suporta pausa para leitura da justificativa bioquímica com avanço manual via botão "Continuar".
 */

import { confettiEffect } from '../canvas/confettiEffect.js';
import { audioService } from '../services/audioService.js';
import { localizationService } from '../services/localizationService.js';
import { sampleUnique } from '../utils/random.js';
import { achievementSystem } from './achievementSystem.js';
import { resetQuizState, state } from './gameState.js';
import { generateFullCoveragePool, isOptionEqual } from './questionEngine.js';
import {
    applyTimeoutPenalty,
    applyWrongPenalty,
    calculateAccuracy,
    calculateQuizPoints,
} from './scoreSystem.js';
import { gameTimer } from './timer.js';

const NEXT_QUESTION_DELAY_MS = 1500;

class QuizGameEngine {
    constructor() {
        this.modeConfig = null;
        this.modeOptions = {};
        this.nextTimeoutId = null;
        this.handlers = {
            onStart: null,
            onQuestionReady: null,
            onTimerTick: null,
            onFreezeEnd: null,
            onAnswerEvaluated: null,
            onTimeout: null,
            onFiftyFifty: null,
            onFreezeStart: null,
            onGameEnd: null,
        };
    }

    /**
     * Registra callbacks da camada de UI.
     * @param {Partial<typeof this.handlers>} handlers
     */
    setHandlers(handlers) {
        this.handlers = { ...this.handlers, ...handlers };
    }

    /**
     * Inicia uma nova partida do modo informado.
     * @param {any} modeConfig
     * @param {Record<string, any>} [options]
     */
    start(modeConfig, options = {}) {
        this.stop();
        audioService.init();

        this.modeConfig = modeConfig;
        this.modeOptions = options;

        const defaultTotal = state.aminoAcids.length || 20;
        resetQuizState(modeConfig.id, {
            totalQuestions: modeConfig.totalQuestions ?? defaultTotal,
            maxTime: modeConfig.maxTime ?? 20,
            modeOptions: options,
        });

        state.questionPool =
            typeof modeConfig.createQuestionPool === 'function'
                ? modeConfig.createQuestionPool(state.aminoAcids, options)
                : generateFullCoveragePool(state.aminoAcids, {
                      allowedTypes: modeConfig.questionTypes,
                      typeGroups: modeConfig.typeGroups,
                      forceShowImage: Boolean(modeConfig.showStructureImage),
                  });

        state.totalQuestions = state.questionPool.length;

        this.handlers.onStart?.({
            modeConfig,
            state,
        });

        this.nextQuestion();
    }

    /**
     * Interrompe timers e transições pendentes (ex.: ao voltar para o menu).
     */
    stop() {
        gameTimer.stop();
        state.awaitingContinue = false;
        if (this.nextTimeoutId !== null) {
            clearTimeout(this.nextTimeoutId);
            this.nextTimeoutId = null;
        }
    }

    getCurrentQuestion() {
        if (state.currentQuestion <= 0) return null;
        return state.questionPool[state.currentQuestion - 1] ?? null;
    }

    /**
     * Verifica se o modo atual deve pausar após resposta/timeout para leitura da justificativa.
     * @param {any} question
     * @returns {boolean}
     */
    _shouldPauseForJustification(question) {
        return Boolean(this.modeConfig?.hasJustification && question?.justification);
    }

    nextQuestion() {
        if (state.currentQuestion >= state.totalQuestions) {
            this.finish();
            return;
        }

        state.isAnswering = false;
        state.awaitingContinue = false;
        state.isFrozen = false;
        state.timeLeft = state.maxTime;

        const question = state.questionPool[state.currentQuestion];
        state.currentQuestion += 1;

        this.handlers.onQuestionReady?.({
            question,
            index: state.currentQuestion,
            total: state.totalQuestions,
            state,
        });

        gameTimer.start({
            duration: state.maxTime,
            maxTime: state.maxTime,
            onTick: (snapshot) => {
                state.timeLeft = snapshot.timeLeft;
                state.isFrozen = snapshot.isFrozen;
                state.freezeTimer = snapshot.freezeRemaining;
                this.handlers.onTimerTick?.(snapshot);
            },
            onUrgentSecond: () => {
                audioService.playTick();
            },
            onFreezeEnd: () => {
                state.isFrozen = false;
                this.handlers.onFreezeEnd?.();
            },
            onTimeout: () => {
                this.handleTimeout();
            },
        });
    }

    /**
     * Chamado quando o jogador clica em "Continuar ▶" (ou Enter/Espaço) após ler a justificativa.
     * Retoma o fluxo normal e reinicia o temporizador na próxima pergunta.
     */
    continueToNext() {
        if (!state.awaitingContinue) return;
        state.awaitingContinue = false;
        this.nextQuestion();
    }

    /**
     * Processa a alternativa clicada pelo jogador.
     * @param {any} selectedOption
     * @param {MouseEvent} [event]
     */
    submitAnswer(selectedOption, event) {
        if (state.isAnswering) return;
        const question = this.getCurrentQuestion();
        if (!question) return;

        state.isAnswering = true;
        gameTimer.stop();

        const timeSpent = state.maxTime - state.timeLeft;
        state.totalTimeSpent += timeSpent;

        const isCorrect = isOptionEqual(selectedOption, question.correctAnswer);
        const shouldPause = this._shouldPauseForJustification(question);
        const isLastQuestion = state.currentQuestion >= state.totalQuestions;
        let gainedPoints = 0;

        if (isCorrect) {
            audioService.playCorrect();
            state.correctAnswers += 1;
            achievementSystem.unlock('first_blood');

            if (timeSpent <= 2.1) {
                achievementSystem.unlock('speed_demon');
            }

            gainedPoints = calculateQuizPoints(state.timeLeft, state.combo);
            state.score += gainedPoints;
            state.combo += 1;

            if (state.combo > state.maxCombo) {
                state.maxCombo = state.combo;
            }
            if (state.combo >= 8) {
                achievementSystem.unlock('combo_master');
            }
            if (state.combo % 3 === 0) {
                confettiEffect.trigger();
            }
        } else {
            audioService.playWrong();
            state.combo = 1;
            state.score = applyWrongPenalty(state.score);
            state.errors.push({
                q: question.questionText,
                correct: question.correctAnswer,
                user: selectedOption,
                justification: shouldPause ? question.justification : null,
            });
        }

        state.awaitingContinue = shouldPause;

        this.handlers.onAnswerEvaluated?.({
            isCorrect,
            selectedOption,
            question,
            gainedPoints,
            event,
            state,
            awaitingContinue: shouldPause,
            isLastQuestion,
        });

        if (!shouldPause) {
            this.nextTimeoutId = setTimeout(() => this.nextQuestion(), NEXT_QUESTION_DELAY_MS);
        }
    }

    handleTimeout() {
        if (state.isAnswering) return;
        const question = this.getCurrentQuestion();
        if (!question) return;

        state.isAnswering = true;
        state.combo = 1;
        state.score = applyTimeoutPenalty(state.score);
        audioService.playWrong();

        const shouldPause = this._shouldPauseForJustification(question);
        const isLastQuestion = state.currentQuestion >= state.totalQuestions;

        const locales = localizationService.getAllLocales();
        const timeoutAnswer = {};
        Object.keys(locales).forEach((lang) => {
            timeoutAnswer[lang] = localizationService.t('timeoutAnswer', lang);
        });

        state.errors.push({
            q: question.questionText,
            correct: question.correctAnswer,
            user: timeoutAnswer,
            justification: shouldPause ? question.justification : null,
        });

        state.awaitingContinue = shouldPause;

        this.handlers.onTimeout?.({
            question,
            state,
            awaitingContinue: shouldPause,
            isLastQuestion,
        });

        if (!shouldPause) {
            this.nextTimeoutId = setTimeout(() => this.nextQuestion(), NEXT_QUESTION_DELAY_MS);
        }
    }

    /**
     * Ativa o power-up 50/50 eliminando 2 alternativas incorretas.
     * @returns {number[]} Índices das opções que devem ser ocultadas
     */
    useFiftyFifty() {
        if (state.powerups.fiftyFifty <= 0 || state.isAnswering) return [];
        const question = this.getCurrentQuestion();
        if (!question) return [];

        state.powerups.fiftyFifty -= 1;
        state.used5050 = true;
        audioService.playPowerup();
        this._checkPowerUser();

        const wrongIndices = question.options
            .map((opt, index) => (isOptionEqual(opt, question.correctAnswer) ? -1 : index))
            .filter((index) => index !== -1);

        const indicesToHide = sampleUnique(wrongIndices, 2);
        this.handlers.onFiftyFifty?.(indicesToHide);
        return indicesToHide;
    }

    /**
     * Ativa o power-up Congelar por 5 segundos.
     * @returns {boolean}
     */
    useFreeze() {
        if (state.powerups.freeze <= 0 || state.isAnswering) return false;

        state.powerups.freeze -= 1;
        state.usedFreeze = true;
        state.isFrozen = true;
        audioService.playPowerup();
        this._checkPowerUser();

        gameTimer.freeze(5);
        this.handlers.onFreezeStart?.();
        return true;
    }

    _checkPowerUser() {
        if (state.used5050 && state.usedFreeze) {
            achievementSystem.unlock('power_user');
        }
    }

    finish() {
        this.stop();

        const accuracy = calculateAccuracy(state.correctAnswers, state.totalQuestions);

        if (accuracy === 100 && this.modeConfig?.perfectAchievement) {
            achievementSystem.unlock(this.modeConfig.perfectAchievement);
        }

        if (accuracy > 50) {
            confettiEffect.trigger();
        }

        this.handlers.onGameEnd?.({
            score: state.score,
            accuracy,
            maxCombo: state.maxCombo,
            errors: state.errors,
            modeConfig: this.modeConfig,
        });
    }
}

export const quizGameEngine = new QuizGameEngine();
