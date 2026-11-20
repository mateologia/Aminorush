/**
 * Ponto de entrada principal do AminoRush (ES Modules).
 * Carrega dados JSON, inicializa serviços, conecta motores de jogo à UI e delega eventos do DOM.
 */

import { achievementSystem } from './core/achievementSystem.js';
import { quizGameEngine } from './core/gameEngine.js';
import { state } from './core/gameState.js';
import { databaseController } from './database/databaseController.js';
import { codonBlitzMode, getQuizMode } from './modes/index.js';
import { loadAllGameData } from './services/dataLoader.js';
import { localizationService } from './services/localizationService.js';
import { loadPreferences } from './services/storageService.js';
import { quizGameView } from './ui/gameView.js';
import {
    applySound,
    handleExportSave,
    handleImportSave,
    handleResetAchievements,
    persistUserPreferences,
    renderAchievementsGrid,
    toggleSound,
} from './ui/menuView.js';
import { showToast } from './ui/notifications.js';
import { resultsView } from './ui/resultsView.js';
import { screenManager } from './ui/screenManager.js';

function stopAllModes() {
    quizGameEngine.stop();
    codonBlitzMode.stop();
    quizGameView.clearFeedback();
    databaseController.closeOverlays();
}

function goHome() {
    stopAllModes();
    screenManager.show('homeScreen');
}

function startQuizMode(modeId, options = {}) {
    stopAllModes();
    const mode = getQuizMode(modeId);
    mode.start(options);
}

function startCodonBlitz() {
    stopAllModes();
    codonBlitzMode.start();
}

function restartCurrentMode() {
    if (state.gameMode === 'arcade') {
        startCodonBlitz();
    } else {
        startQuizMode(state.gameMode, state.gameModeOptions);
    }
}

function bindEnginesToViews() {
    // Quiz normal
    quizGameEngine.setHandlers({
        onStart: (payload) => {
            screenManager.show('gameScreen');
            quizGameView.onStart(payload);
        },
        onQuestionReady: (payload) => quizGameView.renderQuestion(payload),
        onTimerTick: (snapshot) => quizGameView.updateTimer(snapshot),
        onFreezeEnd: () => quizGameView.onFreezeEnd(),
        onAnswerEvaluated: (payload) => quizGameView.onAnswerEvaluated(payload),
        onTimeout: (payload) => quizGameView.onTimeout(payload),
        onFiftyFifty: (indices) => quizGameView.onFiftyFifty(indices),
        onFreezeStart: () => quizGameView.onFreezeStart(),
        onGameEnd: (result) => {
            screenManager.show('resultScreen');
            resultsView.renderQuizResult(result);
        },
    });

    // Codon Blitz (Arcade)
    codonBlitzMode.setHandlers({
        onStart: () => {
            screenManager.show('arcadeScreen');
        },
        onEnd: (result) => {
            screenManager.show('resultScreen');
            resultsView.renderArcadeResult(result);
        },
    });

    // Notificações de conquistas
    achievementSystem.onUnlock((_id, meta) => {
        const lang = localizationService.getLanguage();
        showToast(meta.icon, localizationService.t('toastTitle'), meta.title[lang]);
    });

    // Re-renderização reativa ao trocar de idioma
    localizationService.onChange((langCode) => {
        state.lang = langCode;
        persistUserPreferences();

        switch (state.screen) {
            case 'gameScreen':
                quizGameView.refreshLanguage();
                break;
            case 'arcadeScreen':
                codonBlitzMode.refreshLanguage();
                break;
            case 'studyScreen':
                databaseController.renderCurrent();
                break;
            case 'achievementsScreen':
                renderAchievementsGrid();
                break;
            case 'resultScreen':
                resultsView.refreshResultLanguage();
                break;
            case 'reviewScreen':
                resultsView.renderReviewList();
                break;
            default:
                break;
        }
    });
}

function bindGlobalEvents() {
    // Delegação central para todos os botões com data-action
    document.addEventListener('click', (event) => {
        const actionEl = event.target.closest('[data-action]');
        if (!actionEl) return;

        const action = actionEl.dataset.action;

        switch (action) {
            case 'set-lang':
                localizationService.setLanguage(actionEl.dataset.lang);
                break;
            case 'toggle-sound':
                toggleSound();
                break;
            case 'show-screen':
                screenManager.show(actionEl.dataset.target);
                break;
            case 'go-home':
                goHome();
                break;
            case 'open-study':
                stopAllModes();
                screenManager.show('studyScreen');
                databaseController.open();
                break;
            case 'open-achievements':
                stopAllModes();
                screenManager.show('achievementsScreen');
                renderAchievementsGrid();
                break;
            case 'export-data':
                handleExportSave();
                break;
            case 'reset-achievements':
                handleResetAchievements();
                break;
            case 'select-mode':
                startQuizMode(actionEl.dataset.mode);
                break;
            case 'select-nomenclature-variant':
                startQuizMode('nom', { variant: actionEl.dataset.variant });
                break;
            case 'continue-question':
                quizGameEngine.continueToNext();
                break;
            case 'start-arcade':
                startCodonBlitz();
                break;
            case 'restart-mode':
                restartCurrentMode();
                break;
            case 'prev-card':
                databaseController.prev();
                break;
            case 'next-card':
                databaseController.next();
                break;
            case 'db-filter':
                databaseController.toggleGroupFilter(actionEl.dataset.group);
                break;
            case 'db-clear-search':
                databaseController.clearSearch();
                break;
            case 'db-clear-filters':
                databaseController.clearAllFilters();
                break;
            case 'db-close-panel':
                databaseController.closeSidePanel();
                break;
            case 'db-open-full-detail':
                databaseController.openFullDetail();
                break;
            case 'db-close-full-detail':
                databaseController.closeFullDetail();
                break;
            case 'db-open-zoom':
                databaseController.openZoom();
                break;
            case 'db-close-zoom':
                databaseController.closeZoom();
                break;
            case 'use-5050':
                quizGameEngine.useFiftyFifty();
                break;
            case 'use-freeze':
                quizGameEngine.useFreeze();
                break;
            case 'use-arcade-radar':
                codonBlitzMode.useRadar();
                break;
            case 'use-arcade-freeze':
                codonBlitzMode.useFreeze();
                break;
            case 'review-errors':
                screenManager.show('reviewScreen');
                resultsView.renderReviewList();
                break;
            default:
                break;
        }
    });

    // Busca em tempo real no Banco de Dados
    const searchInput = document.getElementById('dbSearchInput');
    searchInput?.addEventListener('input', (event) => {
        databaseController.setSearchQuery(event.target.value);
    });

    // Importação de save (.json)
    const importInput = document.getElementById('importFile');
    importInput?.addEventListener('change', handleImportSave);

    // Atalhos de teclado globais (Banco de Dados + Continuar na Justificativa do Quiz)
    document.addEventListener('keydown', (event) => {
        if (state.screen === 'gameScreen' && state.awaitingContinue) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                quizGameEngine.continueToNext();
            }
            return;
        }

        if (state.screen !== 'studyScreen') return;

        if (event.key === 'Escape') {
            databaseController.handleEscape();
            return;
        }

        const isTyping =
            document.activeElement?.tagName === 'INPUT' ||
            document.activeElement?.tagName === 'TEXTAREA';
        if (isTyping) return;

        if (event.key === 'ArrowRight' && databaseController.getSelectedAminoAcid()) {
            databaseController.next();
        } else if (event.key === 'ArrowLeft' && databaseController.getSelectedAminoAcid()) {
            databaseController.prev();
        }
    });
}

async function bootstrap() {
    try {
        const [{ aminoAcids, achievements, locales }, savedPrefs] = await Promise.all([
            loadAllGameData(),
            Promise.resolve(loadPreferences()),
        ]);

        state.aminoAcids = aminoAcids;
        state.achievementsMeta = achievements;

        const initialLang = savedPrefs.lang || 'pt-BR';
        state.lang = initialLang;

        localizationService.init(locales, initialLang);
        achievementSystem.init(achievements);

        applySound(savedPrefs.soundOn ?? true, false);

        bindEnginesToViews();
        bindGlobalEvents();

        localizationService.applyToDOM();
    } catch (error) {
        console.error('Erro ao inicializar o AminoRush:', error);
        showToast(
            '❌',
            'Erro ao carregar dados',
            'Execute o projeto via servidor local (ex.: Live Server no VS Code).'
        );
    }
}

document.addEventListener('DOMContentLoaded', bootstrap);
