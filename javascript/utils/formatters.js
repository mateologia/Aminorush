/**
 * Funções puras de formatação (fórmulas químicas, listas de códons, datas e templates).
 */

/**
 * Converte números em fórmulas moleculares para subscritos HTML (ex.: C2H5NO2 -> C<sub>2</sub>H<sub>5</sub>NO<sub>2</sub>).
 * @param {string} formula
 * @returns {string}
 */
export function formatFormula(formula) {
    if (!formula) return '';
    return String(formula).replace(/\d+/g, '<sub>$&</sub>');
}

/**
 * Formata lista de códons com conjunção localizada ("e", "and", "y").
 * @param {string[]} codons
 * @param {string} andWord
 * @returns {string}
 */
export function formatCodonsList(codons, andWord = 'e') {
    if (!Array.isArray(codons) || codons.length === 0) return '';
    if (codons.length === 1) return codons[0];
    const copy = [...codons];
    const last = copy.pop();
    return `${copy.join(', ')} ${andWord} ${last}`;
}

/**
 * Formata um timestamp (ms) para exibição localizada na galeria de conquistas.
 * @param {number} timestamp
 * @param {string} locale
 * @returns {string}
 */
export function formatAchievementDate(timestamp, locale = 'pt-BR') {
    const dateObj = new Date(timestamp);
    return dateObj.toLocaleString(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Interpola placeholders no formato `{chave}` em uma string de template.
 * @param {string} template
 * @param {Record<string, string>} params
 * @returns {string}
 */
export function interpolate(template, params = {}) {
    if (!template) return '';
    return template.replace(/\{(\w+)\}/g, (_, key) =>
        params[key] !== undefined ? params[key] : `{${key}}`
    );
}
