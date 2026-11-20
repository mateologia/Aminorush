/**
 * Camada de visualização da tela de Quiz (HUD, barra de tempo, questões, power-ups,
 * painel de justificativa bioquímica com pausa e feedback).
 */

import { quizGameEngine } from '../core/gameEngine.js';
import { isOptionEqual } from '../core/questionEngine.js';
import { localizationService } from '../services/localizationService.js';

function getElements() {
    return {
        card: document.getElementById('gameCard'),
        levelIndicator: document.getElementById('levelIndicator'),
        questionProgress: document.getElementById('questionProgress'),
        timerPill: document.getElementById('timerPill'),
        timerDisplay: document.getElementById('timerDisplay'),
        scoreDisplay: document.getElementById('scoreDisplay'),
        comboPill: document.getElementById('comboPill'),
        comboDisplay: document.getElementById('comboDisplay'),
        timerBar: document.getElementById('timerBar'),
        questionImg: document.getElementById('gameQuestionImage'),
        questionSpan: document.getElementById('questionSpan'),
        optionsGrid: document.getElementById('optionsGrid'),
        justificationPanel: document.getElementById('justificationPanel'),
        justificationStatus: document.getElementById('justificationStatus'),
        justificationAAPill: document.getElementById('justificationAAPill'),
        justificationText: document.getElementById('justificationText'),
        btnContinue: document.getElementById('btnContinueQuestion'),
        btnContinueLabel: document.getElementById('btnContinueLabel'),
        btnFiftyFifty: document.getElementById('btnFiftyFifty'),
        btnFreeze: document.getElementById('btnFreeze'),
        feedbackOverlay: document.getElementById('feedbackOverlay'),
    };
}

class QuizGameView {
    constructor() {
        this.currentModeConfig = null;
        this.feedbackTimeoutId = null;
        this.activeJustification = null;
    }

    onStart({ modeConfig, state: currentState }) {
        this.currentModeConfig = modeConfig;
        this.activeJustification = null;
        const el = getElements();

        if (el.btnFiftyFifty) el.btnFiftyFifty.disabled = false;
        if (el.btnFreeze) {
            el.btnFreeze.disabled = false;
            el.btnFreeze.classList.remove('freeze-active');
        }

        this._hideJustification();
        this._applyModeBadge(modeConfig);
        this.updateHUD(currentState);
    }

    renderQuestion({ question, index, total, state: currentState }) {
        const el = getElements();
        const lang = localizationService.getLanguage();

        this.activeJustification = null;
        this._hideJustification();
        el.card?.classList.remove('danger-mode');
        el.btnFreeze?.classList.remove('freeze-active');

        if (el.questionProgress) {
            el.questionProgress.textContent = `${index} / ${total}`;
        }

        if (el.questionSpan) {
            el.questionSpan.innerHTML = localizationService.resolve(question.questionText, lang);
        }

        if (el.questionImg) {
            if (question.questionImage) {
                el.questionImg.onerror = () => {
                    el.questionImg.hidden = true;
                };
                el.questionImg.src = question.questionImage;
                el.questionImg.alt = question.correctAA?.name?.[lang] || 'Estrutura';
                el.questionImg.hidden = false;
            } else {
                el.questionImg.src = '';
                el.questionImg.hidden = true;
            }
        }

        if (el.optionsGrid) {
            el.optionsGrid.innerHTML = '';
            question.options.forEach((opt, idx) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn';
                btn.dataset.optionIndex = String(idx);
                btn.innerHTML = localizationService.resolve(opt, lang);
                btn.addEventListener('click', (event) => {
                    quizGameEngine.submitAnswer(opt, event);
                });
                el.optionsGrid.appendChild(btn);
            });
        }

        this.updateHUD(currentState);
    }

    refreshLanguage() {
        const el = getElements();
        const lang = localizationService.getLanguage();

        if (this.currentModeConfig) {
            this._applyModeBadge(this.currentModeConfig);
        }

        const q = quizGameEngine.getCurrentQuestion();
        if (q) {
            if (el.questionSpan) {
                el.questionSpan.innerHTML = localizationService.resolve(q.questionText, lang);
            }

            if (el.optionsGrid) {
                const buttons = el.optionsGrid.querySelectorAll('.btn');
                buttons.forEach((btn, idx) => {
                    const opt = q.options[idx];
                    if (opt !== undefined) {
                        btn.innerHTML = localizationService.resolve(opt, lang);
                    }
                });
            }
        }

        if (this.activeJustification) {
            this._renderJustification(this.activeJustification);
        }
    }

    updateHUD(currentState) {
        const el = getElements();
        if (el.scoreDisplay) el.scoreDisplay.textContent = String(currentState.score);
        if (el.comboDisplay) el.comboDisplay.textContent = String(currentState.combo);
    }

    updateTimer({ timeLeft, maxTime, isFrozen }) {
        const el = getElements();
        if (!el.timerBar || !el.timerPill || !el.timerDisplay || !el.card) return;

        el.timerDisplay.textContent = String(Math.ceil(timeLeft));

        const percentage = maxTime > 0 ? (timeLeft / maxTime) * 100 : 0;
        el.timerBar.style.transform = `translateX(${percentage - 100}%)`;

        if (isFrozen) {
            el.timerBar.className = 'timer-bar-fill timer-frozen';
            el.timerPill.classList.remove('urgent');
            el.card.classList.remove('danger-mode');
            return;
        }

        if (timeLeft > 10) {
            el.timerBar.className = 'timer-bar-fill timer-safe';
            el.timerPill.classList.remove('urgent');
            el.card.classList.remove('danger-mode');
        } else if (timeLeft > 5) {
            el.timerBar.className = 'timer-bar-fill timer-warn';
            el.timerPill.classList.remove('urgent');
            el.card.classList.remove('danger-mode');
        } else {
            el.timerBar.className = 'timer-bar-fill timer-danger';
            el.timerPill.classList.add('urgent');
            el.card.classList.add('danger-mode');
        }
    }

    onAnswerEvaluated({
        isCorrect,
        selectedOption,
        question,
        gainedPoints,
        event,
        state: currentState,
        awaitingContinue,
        isLastQuestion,
    }) {
        const el = getElements();
        el.card?.classList.remove('danger-mode');

        this._revealOptions(question, selectedOption, isCorrect);
        this.updateHUD(currentState);

        if (isCorrect) {
            if (el.comboPill) {
                el.comboPill.style.animation = 'none';
                setTimeout(() => {
                    el.comboPill.style.animation = 'comboFlash 0.5s ease';
                }, 10);
            }
            this._showFloatingScore(gainedPoints, event);
        }

        if (awaitingContinue) {
            this.activeJustification = {
                status: isCorrect ? 'correct' : 'wrong',
                question,
                isLastQuestion,
            };
            this._renderJustification(this.activeJustification);
        } else {
            this._showFeedback(isCorrect, false);
        }
    }

    onTimeout({ question, state: currentState, awaitingContinue, isLastQuestion }) {
        const el = getElements();
        el.card?.classList.remove('danger-mode');

        this._revealOptions(question, null, false);
        this.updateHUD(currentState);

        if (awaitingContinue) {
            this.activeJustification = {
                status: 'timeout',
                question,
                isLastQuestion,
            };
            this._renderJustification(this.activeJustification);
        } else {
            this._showFeedback(false, true);
        }
    }

    onFiftyFifty(indicesToHide) {
        const el = getElements();
        if (el.btnFiftyFifty) el.btnFiftyFifty.disabled = true;
        if (!el.optionsGrid) return;

        const buttons = el.optionsGrid.querySelectorAll('.btn');
        indicesToHide.forEach((index) => {
            buttons[index]?.classList.add('hidden-option');
        });
    }

    onFreezeStart() {
        const el = getElements();
        if (el.btnFreeze) {
            el.btnFreeze.disabled = true;
            el.btnFreeze.classList.add('freeze-active');
        }
        if (el.timerBar) {
            el.timerBar.className = 'timer-bar-fill timer-frozen';
        }
        el.card?.classList.remove('danger-mode');
    }

    onFreezeEnd() {
        const el = getElements();
        el.btnFreeze?.classList.remove('freeze-active');
        el.timerBar?.classList.remove('timer-frozen');
    }

    clearFeedback() {
        const el = getElements();
        this.activeJustification = null;
        this._hideJustification();

        if (this.feedbackTimeoutId !== null) {
            clearTimeout(this.feedbackTimeoutId);
            this.feedbackTimeoutId = null;
        }
        if (el.feedbackOverlay) {
            el.feedbackOverlay.innerHTML = '';
        }
    }

    _renderJustification({ status, question, isLastQuestion }) {
        const el = getElements();
        if (!el.justificationPanel) return;

        const lang = localizationService.getLanguage();
        const statusKey =
            status === 'correct'
                ? 'justCorrectTitle'
                : status === 'timeout'
                  ? 'justTimeoutTitle'
                  : 'justWrongTitle';

        el.justificationPanel.className = `justification-panel is-${status}`;
        el.justificationPanel.hidden = false;

        if (el.justificationStatus) {
            el.justificationStatus.textContent = localizationService.t(statusKey);
        }

        if (el.justificationAAPill && question.correctAA) {
            const aa = question.correctAA;
            el.justificationAAPill.textContent = `${aa.name[lang]} · ${aa.code3} | ${aa.code1}`;
        }

        if (el.justificationText) {
            el.justificationText.textContent = localizationService.resolve(
                question.justification,
                lang
            );
        }

        if (el.btnContinueLabel) {
            const btnKey = isLastQuestion ? 'btnSeeResults' : 'btnContinue';
            el.btnContinueLabel.textContent = localizationService.t(btnKey);
        }

        // Garante que o painel de justificativa fique visível sem precisar rolar manualmente
        el.justificationPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    _hideJustification() {
        const el = getElements();
        if (el.justificationPanel) {
            el.justificationPanel.hidden = true;
            el.justificationPanel.className = 'justification-panel';
        }
    }

    _applyModeBadge(modeConfig) {
        const el = getElements();
        if (!el.levelIndicator || !modeConfig) return;

        el.levelIndicator.textContent = localizationService.t(modeConfig.labelKey);
        el.levelIndicator.style.background = modeConfig.badgeStyle.background;
        el.levelIndicator.style.color = modeConfig.badgeStyle.color;
    }

    _revealOptions(question, selectedOption, isCorrect) {
        const el = getElements();
        if (!el.optionsGrid) return;

        const buttons = el.optionsGrid.querySelectorAll('.btn');
        buttons.forEach((btn, idx) => {
            btn.disabled = true;
            const opt = question.options[idx];
            if (isOptionEqual(opt, question.correctAnswer)) {
                btn.classList.add('correct');
            } else if (selectedOption !== null && !isCorrect && isOptionEqual(opt, selectedOption)) {
                btn.classList.add('wrong');
            }
        });
    }

    _showFloatingScore(points, event) {
        try {
            const floatEl = document.createElement('div');
            floatEl.className = 'floating-score';
            floatEl.textContent = `+${points}`;

            const target = event?.currentTarget || event?.target;
            if (target && typeof target.getBoundingClientRect === 'function') {
                const rect = target.getBoundingClientRect();
                floatEl.style.left = `${rect.left + rect.width / 2 - 20}px`;
                floatEl.style.top = `${rect.top}px`;
            } else {
                floatEl.style.left = '50%';
                floatEl.style.top = '50%';
            }

            document.body.appendChild(floatEl);
            setTimeout(() => floatEl.remove(), 800);
        } catch {
            // Ignora erro caso elemento não esteja disponível
        }
    }

    _showFeedback(isCorrect, isTimeout) {
        const el = getElements();
        if (!el.feedbackOverlay) return;

        if (this.feedbackTimeoutId !== null) {
            clearTimeout(this.feedbackTimeoutId);
        }

        if (isTimeout) {
            el.feedbackOverlay.innerHTML = `<div class="feedback-text timeout">${localizationService.t('timeout')}</div>`;
        } else {
            el.feedbackOverlay.innerHTML = `<div class="feedback-text ${isCorrect ? 'correct' : 'wrong'}">${isCorrect ? '✅' : '❌'}</div>`;
        }

        this.feedbackTimeoutId = setTimeout(() => {
            if (el.feedbackOverlay) el.feedbackOverlay.innerHTML = '';
            this.feedbackTimeoutId = null;
        }, 1200);
    }
}

export const quizGameView = new QuizGameView();
