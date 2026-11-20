/**
 * Serviço de persistência no localStorage, exportação e importação de save (.json).
 * Mantém compatibilidade com o formato legado (Array) e atual (Object com timestamps).
 */

const ACHIEVEMENTS_KEY = 'aminoAchievements';
const PREFERENCES_KEY = 'aminoRushPreferences';

/**
 * Normaliza conquistas para o formato { [id]: timestampMs }.
 * @param {unknown} raw
 * @returns {Record<string, number>}
 */
export function normalizeAchievements(raw) {
    const normalized = {};
    if (Array.isArray(raw)) {
        raw.forEach((id) => {
            if (typeof id === 'string') {
                normalized[id] = Date.now();
            }
        });
    } else if (raw && typeof raw === 'object') {
        Object.entries(raw).forEach(([id, ts]) => {
            normalized[id] = typeof ts === 'number' ? ts : Date.now();
        });
    }
    return normalized;
}

/**
 * Carrega conquistas salvas e migra automaticamente se estiver no formato legado.
 * @returns {Record<string, number>}
 */
export function loadAchievements() {
    try {
        const rawText = localStorage.getItem(ACHIEVEMENTS_KEY);
        if (!rawText) return {};
        const parsed = JSON.parse(rawText);
        const normalized = normalizeAchievements(parsed);
        if (Array.isArray(parsed)) {
            saveAchievements(normalized);
        }
        return normalized;
    } catch {
        return {};
    }
}

/**
 * Salva o objeto de conquistas no localStorage.
 * @param {Record<string, number>} achievements
 */
export function saveAchievements(achievements) {
    try {
        localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
    } catch {
        // Ignora falhas de quota/modo privado
    }
}

/**
 * Remove todas as conquistas do localStorage.
 */
export function clearAchievements() {
    try {
        localStorage.removeItem(ACHIEVEMENTS_KEY);
    } catch {
        // Ignora falhas de acesso ao storage
    }
}

/**
 * Carrega preferências do usuário (idioma e som).
 * @returns {{ lang?: string, soundOn?: boolean }}
 */
export function loadPreferences() {
    try {
        const raw = localStorage.getItem(PREFERENCES_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

/**
 * Persiste preferências do usuário.
 * @param {{ lang: string, soundOn: boolean }} prefs
 */
export function savePreferences(prefs) {
    try {
        localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
    } catch {
        // Ignora falhas de acesso ao storage
    }
}

/**
 * Gera download do arquivo AminoRush_Save.json com as conquistas atuais.
 * @param {Record<string, number>} achievements
 * @returns {boolean}
 */
export function exportSaveFile(achievements) {
    try {
        const payload = { achievements };
        const json = JSON.stringify(payload, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.style.display = 'none';
        link.href = url;
        link.download = 'AminoRush_Save.json';

        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }, 200);

        return true;
    } catch {
        return false;
    }
}

/**
 * Lê e valida um arquivo .json de save selecionado pelo usuário.
 * @param {File} file
 * @returns {Promise<Record<string, number>>}
 */
export function importSaveFile(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('Nenhum arquivo selecionado.'));
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(String(event.target?.result ?? ''));
                if (!parsed || typeof parsed !== 'object' || !parsed.achievements) {
                    reject(new Error('Formato de save inválido.'));
                    return;
                }
                const normalized = normalizeAchievements(parsed.achievements);
                saveAchievements(normalized);
                resolve(normalized);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error('Falha ao ler arquivo.'));
        reader.readAsText(file);
    });
}
