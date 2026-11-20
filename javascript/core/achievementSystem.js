/**
 * Sistema de conquistas: desbloqueio, persistência, platina (ultimate_rush) e notificação via callback.
 */

import {
    clearAchievements,
    exportSaveFile,
    importSaveFile,
    loadAchievements,
    saveAchievements,
} from '../services/storageService.js';

class AchievementSystem {
    constructor() {
        this.meta = {};
        this.unlocked = {};
        this.listeners = new Set();
    }

    /**
     * Inicializa com os metadados de achievements.json e carrega o save do localStorage.
     * @param {Record<string, any>} achievementsMeta
     */
    init(achievementsMeta) {
        this.meta = achievementsMeta || {};
        this.unlocked = loadAchievements();
    }

    getAllMeta() {
        return this.meta;
    }

    getUnlockedMap() {
        return { ...this.unlocked };
    }

    isUnlocked(id) {
        return Object.prototype.hasOwnProperty.call(this.unlocked, id);
    }

    getUnlockTimestamp(id) {
        return this.unlocked[id] ?? null;
    }

    /**
     * Registra ouvinte chamado sempre que uma nova conquista é desbloqueada.
     * @param {(id: string, meta: any) => void} callback
     * @returns {() => void}
     */
    onUnlock(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    /**
     * Desbloqueia uma conquista caso ainda não tenha sido obtida.
     * Verifica automaticamente a conquista platina `ultimate_rush`.
     * @param {string} id
     * @returns {boolean}
     */
    unlock(id) {
        if (!this.meta[id] || this.isUnlocked(id)) {
            return false;
        }

        this.unlocked[id] = Date.now();
        saveAchievements(this.unlocked);

        const data = this.meta[id];
        this.listeners.forEach((cb) => cb(id, data));

        if (id !== 'ultimate_rush') {
            const requiredIds = Object.keys(this.meta).filter((key) => key !== 'ultimate_rush');
            const hasAll = requiredIds.every((key) => this.isUnlocked(key));
            if (hasAll) {
                setTimeout(() => this.unlock('ultimate_rush'), 1500);
            }
        }

        return true;
    }

    /**
     * Exporta o save atual como arquivo JSON.
     * @returns {boolean}
     */
    exportSave() {
        return exportSaveFile(this.unlocked);
    }

    /**
     * Importa um arquivo JSON de save e atualiza o estado em memória.
     * @param {File} file
     * @returns {Promise<Record<string, number>>}
     */
    async importSave(file) {
        const imported = await importSaveFile(file);
        this.unlocked = imported;
        return this.getUnlockedMap();
    }

    /**
     * Zera todas as conquistas desbloqueadas.
     */
    resetAll() {
        this.unlocked = {};
        clearAchievements();
    }
}

export const achievementSystem = new AchievementSystem();
