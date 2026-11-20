/**
 * Controlador principal do modo Codon Blitz (Corrida de Síntese Peptídica).
 * Preserva a mecânica original de 7 níveis, 3 vidas, power-ups (Radar/Congelar)
 * e janela de 5 segundos de graça ao zerar o temporizador antes de perder mais corações.
 */

import { achievementSystem } from '../../core/achievementSystem.js';
import { resetArcadeState, state } from '../../core/gameState.js';
import { calculateArcadeStepPoints } from '../../core/scoreSystem.js';
import { gameTimer } from '../../core/timer.js';
import { audioService } from '../../services/audioService.js';
import { sampleUnique, shuffle } from '../../utils/random.js';
import { CODON_BLITZ_CONFIG, getSequenceLengthForLevel } from './config.js';
import { codonBlitzUI } from './ui.js';

class CodonBlitzMode {
    constructor() {
        this.roundTimeoutId = null;
        this.isTransitioning = false;
        this.handlers = {
            onStart: null,
            onEnd: null,
        };
    }

    setHandlers(handlers) {
        this.handlers = { ...this.handlers, ...handlers };
    }

    start() {
        this.stop();
        audioService.init();

        resetArcadeState({
            initialTime: CODON_BLITZ_CONFIG.initialTime,
            maxTime: CODON_BLITZ_CONFIG.maxTime,
            lives: CODON_BLITZ_CONFIG.lives,
            maxLevel: CODON_BLITZ_CONFIG.maxLevel,
        });

        this.isTransitioning = false;
        codonBlitzUI.resetControls();

        this.handlers.onStart?.();
        this._generateRound();
        this._startTimer(state.timeLeft);
    }

    stop() {
        gameTimer.stop();
        if (this.roundTimeoutId !== null) {
            clearTimeout(this.roundTimeoutId);
            this.roundTimeoutId = null;
        }
        codonBlitzUI.clearTransientEffects();
    }

    refreshLanguage() {
        codonBlitzUI.refreshTranslations({
            level: state.arcade.level,
            maxLevel: state.arcade.maxLevel,
            aminoAcids: state.aminoAcids,
        });
    }

    useRadar() {
        if (
            state.powerups.radar <= 0 ||
            state.arcade.lives <= 0 ||
            state.timeLeft <= 0 ||
            this.isTransitioning
        ) {
            return;
        }

        state.powerups.radar -= 1;
        state.usedRadar = true;
        audioService.playPowerup();
        this._checkPowerUser();

        const remainingIds = state.arcade.sequence
            .slice(state.arcade.currentStep)
            .map((aa) => aa.id);

        codonBlitzUI.highlightRadar(remainingIds, CODON_BLITZ_CONFIG.radarDurationMs);
    }

    useFreeze() {
        if (
            state.powerups.freeze <= 0 ||
            state.arcade.lives <= 0 ||
            state.timeLeft <= 0
        ) {
            return;
        }

        state.powerups.freeze -= 1;
        state.usedFreeze = true;
        state.isFrozen = true;
        audioService.playPowerup();
        this._checkPowerUser();

        codonBlitzUI.setFreezeActive(true);
        gameTimer.freeze(CODON_BLITZ_CONFIG.freezeSeconds);
    }

    _generateRound() {
        const arcade = state.arcade;
        arcade.currentStep = 0;
        arcade.targetLength = getSequenceLengthForLevel(arcade.level);

        arcade.sequence = sampleUnique(state.aminoAcids, arcade.targetLength);

        const sequenceIds = new Set(arcade.sequence.map((aa) => aa.id));
        const distractorsPool = state.aminoAcids.filter((aa) => !sequenceIds.has(aa.id));
        const distractors = sampleUnique(
            distractorsPool,
            CODON_BLITZ_CONFIG.gridSize - arcade.targetLength
        );

        arcade.gridOptions = shuffle([...arcade.sequence, ...distractors]);
        this.isTransitioning = false;

        codonBlitzUI.renderRound({
            sequence: arcade.sequence,
            gridOptions: arcade.gridOptions,
            level: arcade.level,
            maxLevel: arcade.maxLevel,
            score: state.score,
            lives: arcade.lives,
            onOptionClick: (aa, btnEl) => this._handleOptionClick(aa, btnEl),
        });
    }

    _handleOptionClick(clickedAA, btnEl) {
        const arcade = state.arcade;
        if (this.isTransitioning || arcade.lives <= 0 || state.timeLeft <= 0) return;

        const expectedAA = arcade.sequence[arcade.currentStep];
        if (!expectedAA) return;

        if (clickedAA.id === expectedAA.id) {
            audioService.playCorrect();

            const completedIndex = arcade.currentStep;
            arcade.currentStep += 1;
            state.score += calculateArcadeStepPoints(arcade.level);

            const isRoundFinished = arcade.currentStep >= arcade.sequence.length;
            codonBlitzUI.markStepCorrect(
                completedIndex,
                isRoundFinished ? null : arcade.currentStep,
                btnEl
            );
            codonBlitzUI.updateStats({
                level: arcade.level,
                maxLevel: arcade.maxLevel,
                score: state.score,
                lives: arcade.lives,
            });

            if (isRoundFinished) {
                this.isTransitioning = true;
                gameTimer.addTime(CODON_BLITZ_CONFIG.roundBonusSeconds);
                state.timeLeft = gameTimer.timeLeft;
                arcade.level += 1;

                if (arcade.level > arcade.maxLevel) {
                    gameTimer.stop();
                    achievementSystem.unlock('codon_speedster');
                    this.roundTimeoutId = setTimeout(
                        () => this._finish(true),
                        CODON_BLITZ_CONFIG.roundTransitionMs
                    );
                } else {
                    codonBlitzUI.disableGrid();
                    this.roundTimeoutId = setTimeout(
                        () => this._generateRound(),
                        CODON_BLITZ_CONFIG.roundTransitionMs
                    );
                }
            }
        } else {
            audioService.playWrong();
            arcade.lives -= 1;

            codonBlitzUI.markWrong(btnEl);
            codonBlitzUI.updateStats({
                level: arcade.level,
                maxLevel: arcade.maxLevel,
                score: state.score,
                lives: arcade.lives,
            });

            if (arcade.lives <= 0) {
                this._finish(false);
            }
        }
    }

    _startTimer(duration) {
        gameTimer.start({
            duration,
            maxTime: state.maxTime,
            onTick: (snapshot) => {
                state.timeLeft = snapshot.timeLeft;
                state.isFrozen = snapshot.isFrozen;
                state.freezeTimer = snapshot.freezeRemaining;
                codonBlitzUI.updateTimer(snapshot);
            },
            onUrgentSecond: () => {
                audioService.playTick();
            },
            onFreezeEnd: () => {
                state.isFrozen = false;
                codonBlitzUI.setFreezeActive(false);
            },
            onTimeout: () => {
                this._handleTimeout();
            },
        });
    }

    /**
     * Ao esgotar o tempo, o jogador perde uma vida e recebe 5 segundos extras
     * para concluir antes de perder novos corações.
     */
    _handleTimeout() {
        audioService.playWrong();
        state.arcade.lives -= 1;

        codonBlitzUI.updateStats({
            level: state.arcade.level,
            maxLevel: state.arcade.maxLevel,
            score: state.score,
            lives: state.arcade.lives,
        });

        if (state.arcade.lives <= 0) {
            this._finish(false);
            return;
        }

        state.timeLeft = CODON_BLITZ_CONFIG.timeoutGraceSeconds;
        codonBlitzUI.pulseDanger(400);
        this._startTimer(CODON_BLITZ_CONFIG.timeoutGraceSeconds);
    }

    _checkPowerUser() {
        if (state.usedRadar && state.usedFreeze) {
            achievementSystem.unlock('power_user');
        }
    }

    _finish(completedAllLevels) {
        this.stop();
        this.handlers.onEnd?.({
            score: state.score,
            levelReached: Math.min(state.arcade.level, state.arcade.maxLevel),
            completedAllLevels,
        });
    }
}

export const codonBlitzMode = new CodonBlitzMode();
