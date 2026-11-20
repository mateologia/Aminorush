/**
 * Filtragem multi-seleção por grupo químico e busca textual precisa no Banco de Dados.
 * Prioriza correspondência exata em siglas (1 e 3 letras), códons e nomes completos,
 * usando correspondência por prefixo (startsWith) para evitar falsos positivos
 * (ex.: "ALA" -> "Fenilalanina", "Leucina" -> "Isoleucina", "Asp" -> "Asparagina", "Glu" -> "Glutamina").
 */

/**
 * Remove acentos e normaliza texto para comparação insensível a maiúsculas/diacríticos.
 * @param {string} text
 * @returns {string}
 */
function normalizeText(text) {
    return String(text || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

/**
 * Filtra a lista de aminoácidos por grupos químicos selecionados (OR entre grupos)
 * e pela busca textual com precedência de correspondência exata.
 * @param {Array<any>} aminoAcids
 * @param {{ activeGroups: Set<string>, searchQuery: string, lang: string }} criteria
 * @returns {Array<any>}
 */
export function filterAminoAcids(aminoAcids, { activeGroups, searchQuery, lang }) {
    const byGroup =
        activeGroups.size > 0
            ? aminoAcids.filter((aa) => activeGroups.has(aa.groupKey))
            : aminoAcids;

    const query = normalizeText(searchQuery);
    if (!query) return byGroup;

    // 1. Letra única: correspondência exata pela sigla de 1 letra (code1)
    if (query.length === 1) {
        return byGroup.filter((aa) => normalizeText(aa.code1) === query);
    }

    // 2. Exatamente 3 caracteres: prioridade para sigla de 3 letras (ex.: ALA, LEU, ASP, GLU) ou códon exato (ex.: AUG, GGU)
    if (query.length === 3) {
        const exactCode3 = byGroup.filter((aa) => normalizeText(aa.code3) === query);
        if (exactCode3.length > 0) {
            return exactCode3;
        }

        const exactCodon = byGroup.filter((aa) =>
            (aa.codons || []).some((codon) => normalizeText(codon) === query)
        );
        if (exactCodon.length > 0) {
            return exactCodon;
        }
    }

    // 3. Correspondência exata pelo nome completo em qualquer idioma suportado
    const exactName = byGroup.filter((aa) =>
        [aa.name?.[lang], aa.name?.['pt-BR'], aa.name?.['en-US'], aa.name?.['es-ES']].some(
            (name) => normalizeText(name) === query
        )
    );
    if (exactName.length > 0) {
        return exactName;
    }

    // 4. Correspondência por prefixo (startsWith) nos campos principais
    return byGroup.filter((aa) => {
        const prefixFields = [
            aa.name?.[lang],
            aa.name?.['pt-BR'],
            aa.name?.['en-US'],
            aa.name?.['es-ES'],
            aa.code3,
            aa.formula,
            aa.group?.[lang],
            aa.polarityTag?.[lang],
            ...(aa.codons || []),
        ];

        return prefixFields.some((field) => field && normalizeText(field).startsWith(query));
    });
}
