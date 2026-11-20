/**
 * Carregador assíncrono de dados JSON com cache em memória.
 */

const SUPPORTED_LOCALES = ['pt-BR', 'en-US', 'es-ES'];

const cache = {
    aminoAcids: null,
    achievements: null,
    locales: null,
};

/**
 * Realiza fetch de um arquivo JSON com tratamento de erro descritivo.
 * @param {string} url
 * @returns {Promise<any>}
 */
async function fetchJSON(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Falha ao carregar ${url} (HTTP ${response.status})`);
    }
    return response.json();
}

/**
 * Carrega em paralelo o banco de aminoácidos, conquistas e os 3 pacotes de idioma.
 * @returns {Promise<{ aminoAcids: Array, achievements: Object, locales: Object }>}
 */
export async function loadAllGameData() {
    if (cache.aminoAcids && cache.achievements && cache.locales) {
        return cache;
    }

    const [aminoAcids, achievements, ...localeEntries] = await Promise.all([
        fetchJSON('./data/database/aminoAcids.json'),
        fetchJSON('./data/achievements.json'),
        ...SUPPORTED_LOCALES.map(async (lang) => [
            lang,
            await fetchJSON(`./data/locales/${lang}.json`),
        ]),
    ]);

    cache.aminoAcids = aminoAcids;
    cache.achievements = achievements;
    cache.locales = Object.fromEntries(localeEntries);

    return cache;
}

export function getSupportedLocales() {
    return [...SUPPORTED_LOCALES];
}
