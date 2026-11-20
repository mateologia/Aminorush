/**
 * Camada de visualização das telas de Resultado Final e Revisão de Erros.
 */

import { state } from '../core/gameState.js';
import { localizationService } from '../services/localizationService.js';

class ResultsView {
    constructor() {
        this.lastResult = null;
    }

    /**
     * Renderiza o resultado final de uma partida do Quiz.
     * @param {{ score: number, accuracy: number, maxCombo: number, errors: Array<any> }} data
     */
    renderQuizResult(data) {
        this.lastResult = { type: 'quiz', ...data };

        const titleEl = document.getElementById('resultTitle');
        const scoreEl = document.getElementById('resultScore');
        const accLabelEl = document.getElementById('resultAccLabel');
        const accEl = document.getElementById('resultAccuracy');
        const comboItemEl = document.getElementById('comboDetailItem');
        const maxComboEl = document.getElementById('resultMaxCombo');
        const errorCountEl = document.getElementById('errorCount');
        const reviewBtn = document.getElementById('reviewBtn');

        if (titleEl) titleEl.textContent = localizationService.t('resultTitle');
        if (scoreEl) scoreEl.textContent = String(data.score);
        if (accLabelEl) accLabelEl.textContent = localizationService.t('resultAcc');
        if (accEl) accEl.textContent = `${data.accuracy}%`;
        if (comboItemEl) comboItemEl.hidden = false;
        if (maxComboEl) maxComboEl.textContent = String(data.maxCombo);
        if (errorCountEl) errorCountEl.textContent = String(data.errors.length);
        if (reviewBtn) reviewBtn.hidden = data.errors.length === 0;
    }

    /**
     * Renderiza o resultado final de uma partida do Codon Blitz.
     * @param {{ score: number, levelReached: number, completedAllLevels: boolean }} data
     */
    renderArcadeResult(data) {
        this.lastResult = { type: 'arcade', ...data };

        const titleEl = document.getElementById('resultTitle');
        const scoreEl = document.getElementById('resultScore');
        const accLabelEl = document.getElementById('resultAccLabel');
        const accEl = document.getElementById('resultAccuracy');
        const comboItemEl = document.getElementById('comboDetailItem');
        const reviewBtn = document.getElementById('reviewBtn');

        if (titleEl) {
            titleEl.textContent = data.completedAllLevels
                ? localizationService.t('blitzComplete')
                : localizationService.t('resultTitle');
        }
        if (scoreEl) scoreEl.textContent = String(data.score);
        if (accLabelEl) accLabelEl.textContent = localizationService.t('levelLabel');
        if (accEl) accEl.textContent = String(data.levelReached);
        if (comboItemEl) comboItemEl.hidden = true;
        if (reviewBtn) reviewBtn.hidden = true;
    }

    /**
     * Reaplica traduções dinâmicas na tela de resultado após troca de idioma.
     */
    refreshResultLanguage() {
        if (!this.lastResult) return;
        if (this.lastResult.type === 'quiz') {
            this.renderQuizResult(this.lastResult);
        } else {
            this.renderArcadeResult(this.lastResult);
        }
    }

    /**
     * Renderiza a lista de erros cometidos na última rodada do Quiz.
     */
    renderReviewList() {
        const list = document.getElementById('reviewList');
        if (!list) return;

        const lang = localizationService.getLanguage();
        const yourAnswerLabel = localizationService.t('yourAnswer');
        const correctAnswerLabel = localizationService.t('correctAnswer');
        const justLabel = localizationService.t('reviewJustLabel');

        list.innerHTML = state.errors
            .map((err) => {
                const qText = localizationService.resolve(err.q, lang);
                const cText = localizationService.resolve(err.correct, lang);
                const uText = localizationService.resolve(err.user, lang);
                const justText = err.justification
                    ? localizationService.resolve(err.justification, lang)
                    : '';
                const justHtml = justText
                    ? `<div class="review-justification">💡 <strong>${justLabel}:</strong> ${justText}</div>`
                    : '';

                return `
                    <div class="review-item">
                        <span class="review-question">${qText}</span>
                        <div class="review-user-answer">${yourAnswerLabel}: <span>${uText}</span></div>
                        <div class="review-correct-answer">${correctAnswerLabel}: <span>${cText}</span></div>
                        ${justHtml}
                    </div>
                `;
            })
            .join('');
    }
}

export const resultsView = new ResultsView();
