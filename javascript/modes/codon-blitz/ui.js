/**
 * Camada de visualização (DOM) exclusiva do modo Codon Blitz.
 */

import { localizationService } from '../../services/localizationService.js';

function getElements() {
    return {
        card: document.getElementById('arcadeCard'),
        levelDisplay: document.getElementById('arcadeLevelDisplay'),
        timerPill: document.getElementById('arcadeTimerPill'),
        timerDisplay: document.getElementById('arcadeTimerDisplay'),
        scoreDisplay: document.getElementById('arcadeScoreDisplay'),
        livesDisplay: document.getElementById('arcadeLivesDisplay'),
        timerBar: document.getElementById('arcadeTimerBar'),
        sequenceBox: document.getElementById('arcadeSequenceBox'),
        grid: document.getElementById('arcadeGrid'),
        btnRadar: document.getElementById('btnArcadeRadar'),
        btnFreeze: document.getElementById('btnArcadeFreeze'),
    };
}

class CodonBlitzUI {
    constructor() {
        this.dangerTimeoutId = null;
        this.radarTimeoutId = null;
    }

    resetControls() {
        const el = getElements();
        if (el.btnRadar) el.btnRadar.disabled = false;
        if (el.btnFreeze) {
            el.btnFreeze.disabled = false;
            el.btnFreeze.classList.remove('freeze-active');
        }
        el.card?.classList.remove('danger-mode');
        this.clearTransientEffects();
    }

    clearTransientEffects() {
        if (this.dangerTimeoutId !== null) {
            clearTimeout(this.dangerTimeoutId);
            this.dangerTimeoutId = null;
        }
        if (this.radarTimeoutId !== null) {
            clearTimeout(this.radarTimeoutId);
            this.radarTimeoutId = null;
        }
    }

    updateStats({ level, maxLevel, score, lives }) {
        const el = getElements();
        const levelLabel = localizationService.t('levelLabel');
        if (el.levelDisplay) {
            el.levelDisplay.textContent = `${levelLabel} ${level} / ${maxLevel}`;
        }
        if (el.scoreDisplay) {
            el.scoreDisplay.textContent = String(score);
        }
        if (el.livesDisplay) {
            el.livesDisplay.textContent = String(lives);
        }
    }

    renderRound({ sequence, gridOptions, level, maxLevel, score, lives, onOptionClick }) {
        const el = getElements();
        const lang = localizationService.getLanguage();

        if (el.sequenceBox) {
            el.sequenceBox.innerHTML = sequence
                .map(
                    (aa, idx) => `
                        <div class="seq-item ${idx === 0 ? 'active' : ''}" id="seq-${idx}">
                            <div class="seq-tres">${aa.code3}</div>
                            <div class="seq-uma">${aa.code1}</div>
                        </div>
                    `
                )
                .join('');
        }

        if (el.grid) {
            el.grid.innerHTML = '';
            gridOptions.forEach((aa) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn btn-secondary';
                btn.dataset.aaId = aa.id;
                btn.textContent = aa.name[lang];
                btn.addEventListener('click', () => onOptionClick(aa, btn));
                el.grid.appendChild(btn);
            });
        }

        this.updateStats({ level, maxLevel, score, lives });
    }

    refreshTranslations({ level, maxLevel, aminoAcids }) {
        const el = getElements();
        const lang = localizationService.getLanguage();
        const levelLabel = localizationService.t('levelLabel');

        if (el.levelDisplay) {
            el.levelDisplay.textContent = `${levelLabel} ${level} / ${maxLevel}`;
        }

        if (el.grid) {
            el.grid.querySelectorAll('.btn').forEach((btn) => {
                const aa = aminoAcids.find((item) => item.id === btn.dataset.aaId);
                if (aa) {
                    btn.textContent = aa.name[lang];
                }
            });
        }
    }

    markStepCorrect(stepIndex, nextStepIndex, buttonEl) {
        if (buttonEl) {
            buttonEl.classList.add('correct');
            buttonEl.classList.remove('radar-glow');
            buttonEl.disabled = true;
        }

        const currentSeqEl = document.getElementById(`seq-${stepIndex}`);
        if (currentSeqEl) {
            currentSeqEl.classList.remove('active');
            currentSeqEl.classList.add('completed');
        }

        if (nextStepIndex !== null) {
            const nextSeqEl = document.getElementById(`seq-${nextStepIndex}`);
            nextSeqEl?.classList.add('active');
        }
    }

    markWrong(buttonEl) {
        if (buttonEl) {
            buttonEl.classList.add('wrong');
            setTimeout(() => buttonEl.classList.remove('wrong'), 500);
        }
        this.pulseDanger(400);
    }

    disableGrid() {
        const el = getElements();
        el.grid?.querySelectorAll('.btn').forEach((btn) => {
            btn.disabled = true;
        });
    }

    pulseDanger(durationMs = 400) {
        const el = getElements();
        if (!el.card) return;
        el.card.classList.add('danger-mode');
        if (this.dangerTimeoutId !== null) clearTimeout(this.dangerTimeoutId);
        this.dangerTimeoutId = setTimeout(() => {
            el.card?.classList.remove('danger-mode');
            this.dangerTimeoutId = null;
        }, durationMs);
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

        if (timeLeft <= 5) {
            el.timerBar.className = 'timer-bar-fill timer-danger';
            el.timerPill.classList.add('urgent');
            el.card.classList.add('danger-mode');
        } else if (timeLeft <= 10) {
            el.timerBar.className = 'timer-bar-fill timer-warn';
            el.timerPill.classList.remove('urgent');
            if (this.dangerTimeoutId === null) {
                el.card.classList.remove('danger-mode');
            }
        } else {
            el.timerBar.className = 'timer-bar-fill timer-safe';
            el.timerPill.classList.remove('urgent');
            if (this.dangerTimeoutId === null) {
                el.card.classList.remove('danger-mode');
            }
        }
    }

    highlightRadar(expectedIds, durationMs = 3000) {
        const el = getElements();
        if (el.btnRadar) el.btnRadar.disabled = true;
        if (!el.grid) return;

        const targetSet = new Set(expectedIds);
        const highlighted = [];

        el.grid.querySelectorAll('.btn').forEach((btn) => {
            if (targetSet.has(btn.dataset.aaId) && !btn.disabled) {
                btn.classList.add('radar-glow');
                highlighted.push(btn);
            }
        });

        if (this.radarTimeoutId !== null) clearTimeout(this.radarTimeoutId);
        this.radarTimeoutId = setTimeout(() => {
            highlighted.forEach((btn) => btn.classList.remove('radar-glow'));
            this.radarTimeoutId = null;
        }, durationMs);
    }

    setFreezeActive(active) {
        const el = getElements();
        if (active) {
            if (el.btnFreeze) {
                el.btnFreeze.disabled = true;
                el.btnFreeze.classList.add('freeze-active');
            }
            if (el.timerBar) {
                el.timerBar.className = 'timer-bar-fill timer-frozen';
            }
            el.card?.classList.remove('danger-mode');
        } else {
            el.btnFreeze?.classList.remove('freeze-active');
            el.timerBar?.classList.remove('timer-frozen');
        }
    }
}

export const codonBlitzUI = new CodonBlitzUI();
