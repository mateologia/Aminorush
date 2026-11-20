/**
 * Camada de visualização do Menu Inicial, Galeria de Conquistas, Opções e Controles Globais.
 */

import { achievementSystem } from '../core/achievementSystem.js';
import { state } from '../core/gameState.js';
import { audioService } from '../services/audioService.js';
import { localizationService } from '../services/localizationService.js';
import { savePreferences } from '../services/storageService.js';
import { formatAchievementDate } from '../utils/formatters.js';
import { showToast } from './notifications.js';

/**
 * Sincroniza o estado do som no serviço de áudio e o ícone do botão.
 * @param {boolean} enabled
 * @param {boolean} [persist=true]
 */
export function applySound(enabled, persist = true) {
    state.soundOn = Boolean(enabled);
    audioService.setEnabled(state.soundOn);

    const soundBtn = document.getElementById('soundBtn');
    if (soundBtn) {
        soundBtn.textContent = state.soundOn ? '🔊' : '🔇';
    }

    if (persist) {
        persistUserPreferences();
    }
}

export function toggleSound() {
    applySound(!state.soundOn, true);
}

export function persistUserPreferences() {
    savePreferences({
        lang: state.lang,
        soundOn: state.soundOn,
    });
}

/**
 * Renderiza todos os cards da Galeria de Conquistas com datas localizadas.
 */
export function renderAchievementsGrid() {
    const grid = document.getElementById('achievementsGrid');
    if (!grid) return;

    const lang = localizationService.getLanguage();
    const meta = achievementSystem.getAllMeta();

    grid.innerHTML = Object.keys(meta)
        .map((id) => {
            const isUnlocked = achievementSystem.isUnlocked(id);
            const data = meta[id];
            const timestamp = achievementSystem.getUnlockTimestamp(id);

            const dateHtml =
                isUnlocked && timestamp
                    ? `<div class="achiev-date">${formatAchievementDate(timestamp, lang)}</div>`
                    : '';

            return `
                <div class="achiev-card ${isUnlocked ? 'unlocked' : 'locked'}">
                    <div class="achiev-icon">${isUnlocked ? data.icon : '🔒'}</div>
                    <div class="achiev-title">${data.title[lang]}</div>
                    <div class="achiev-desc">${data.desc[lang]}</div>
                    ${dateHtml}
                </div>
            `;
        })
        .join('');
}

/**
 * Aciona exportação de save com feedback via Toast.
 */
export function handleExportSave() {
    const ok = achievementSystem.exportSave();
    if (ok) {
        showToast(
            '💾',
            localizationService.t('sysSuccess'),
            localizationService.t('exportSuccess')
        );
    } else {
        showToast(
            '❌',
            localizationService.t('sysError'),
            localizationService.t('exportError')
        );
    }
}

/**
 * Processa importação de arquivo .json selecionado no input #importFile.
 * @param {Event} event
 */
export async function handleImportSave(event) {
    const input = event.target;
    const file = input?.files?.[0];
    if (!file) return;

    try {
        await achievementSystem.importSave(file);
        showToast(
            '📂',
            localizationService.t('sysSuccess'),
            localizationService.t('importSuccess')
        );
        if (state.screen === 'achievementsScreen') {
            renderAchievementsGrid();
        }
    } catch {
        showToast(
            '❌',
            localizationService.t('sysError'),
            localizationService.t('importError')
        );
    } finally {
        input.value = '';
    }
}

/**
 * Solicita confirmação e zera todas as conquistas do jogador.
 */
export function handleResetAchievements() {
    if (!window.confirm(localizationService.t('confirmReset'))) return;

    achievementSystem.resetAll();
    showToast(
        '🗑️',
        localizationService.t('sysSuccess'),
        localizationService.t('resetSuccess')
    );

    if (state.screen === 'achievementsScreen') {
        renderAchievementsGrid();
    }
}
