/**
 * Serviço de internacionalização (i18n) para pt-BR, en-US e es-ES.
 */

const DEFAULT_LANG = 'pt-BR';

class LocalizationService {
    constructor() {
        this.locales = {};
        this.currentLang = DEFAULT_LANG;
        this.listeners = new Set();
    }

    /**
     * Inicializa o serviço com os dicionários carregados e idioma inicial.
     * @param {Record<string, Record<string, any>>} locales
     * @param {string} [initialLang]
     */
    init(locales, initialLang = DEFAULT_LANG) {
        this.locales = locales || {};
        this.currentLang = this.locales[initialLang] ? initialLang : DEFAULT_LANG;
        document.documentElement.lang = this.currentLang;
    }

    getLanguage() {
        return this.currentLang;
    }

    getAllLocales() {
        return this.locales;
    }

    /**
     * Altera o idioma ativo, atualiza elementos [data-i18n] e notifica inscritos.
     * @param {string} langCode
     */
    setLanguage(langCode) {
        if (!this.locales[langCode]) return;
        this.currentLang = langCode;
        document.documentElement.lang = langCode;
        this.applyToDOM();
        this.listeners.forEach((cb) => cb(langCode));
    }

    /**
     * Registra um callback executado sempre que o idioma muda.
     * @param {(lang: string) => void} callback
     * @returns {() => void} função para cancelar inscrição
     */
    onChange(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    /**
     * Busca uma chave de tradução (suporta caminho aninhado com ponto, ex.: 'questions.name_to_code').
     * @param {string} key
     * @param {string} [lang]
     * @returns {any}
     */
    t(key, lang = this.currentLang) {
        const dict = this.locales[lang] || this.locales[DEFAULT_LANG] || {};
        const value = key.split('.').reduce((acc, part) => acc?.[part], dict);
        return value !== undefined ? value : key;
    }

    /**
     * Resolve um objeto multilíngue ({ 'pt-BR': ..., 'en-US': ..., 'es-ES': ... }) ou string simples.
     * @param {string | Record<string, string> | null | undefined} value
     * @param {string} [lang]
     * @returns {string}
     */
    resolve(value, lang = this.currentLang) {
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') {
            return value[lang] ?? value[DEFAULT_LANG] ?? '';
        }
        return String(value);
    }

    /**
     * Atualiza todos os elementos do DOM marcados com `data-i18n` e o estado visual dos botões de idioma.
     */
    applyToDOM() {
        document.querySelectorAll('[data-i18n]').forEach((el) => {
            const key = el.getAttribute('data-i18n');
            const translated = this.t(key);
            if (typeof translated === 'string') {
                el.innerHTML = translated;
            }
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
            const key = el.getAttribute('data-i18n-placeholder');
            const translated = this.t(key);
            if (typeof translated === 'string') {
                el.setAttribute('placeholder', translated);
            }
        });

        document.querySelectorAll('.lang-btn').forEach((btn) => {
            const btnLang = btn.getAttribute('data-lang');
            btn.classList.toggle('active', btnLang === this.currentLang);
        });
    }
}

export const localizationService = new LocalizationService();
