/**
 * Camada de visualização do Banco de Dados:
 * - Grid simultâneo dos 20 aminoácidos
 * - Barra de filtros multi-seleção e contador
 * - Painel lateral recolhível (aparece só ao selecionar um card)
 * - Visualização detalhada focada (+ Mais Detalhes)
 * - Modal de Zoom da estrutura química
 */

import { localizationService } from '../services/localizationService.js';
import { formatCodonsList, formatFormula } from '../utils/formatters.js';

const GROUP_COLOR_MAP = {
    nonpolar: '#64748B',
    polar: '#0D9488',
    aromatic: '#7C3AED',
    acidic: '#C026D3',
    basic: '#3B82F6',
};

function getGroupColor(aa) {
    return GROUP_COLOR_MAP[aa?.groupKey] || '#6C5CE7';
}

const GROUP_TAG_MAP = {
    nonpolar: 'tag-apolar',
    polar: 'tag-polar',
    acidic: 'tag-acid',
    basic: 'tag-basic',
    aromatic: 'tag-aromatic',
};

const POLARITY_CLASS_MAP = {
    nonpolar: 'pol-nonpolar',
    polar: 'pol-polar',
    negative: 'pol-negative',
    positive: 'pol-positive',
};

function renderBadgesHTML(aa, lang) {
    const groupClass = GROUP_TAG_MAP[aa.groupKey] || 'tag-aromatic';
    const polClass = POLARITY_CLASS_MAP[aa.polarityKey] || 'pol-nonpolar';
    const polarityLabel = aa.polarityTag?.[lang] || aa.group[lang];

    return `
        <span class="aa-group ${groupClass}">${aa.group[lang]}</span>
        <span class="aa-polarity-pill ${polClass}">${polarityLabel}</span>
    `;
}

function setStructureImage(imgEl, placeholderEl, aa, lang) {
    if (!imgEl || !placeholderEl) return;
    if (aa?.image) {
        imgEl.onerror = () => {
            imgEl.hidden = true;
            placeholderEl.hidden = false;
        };
        imgEl.src = aa.image;
        imgEl.alt = aa.name[lang];
        imgEl.hidden = false;
        placeholderEl.hidden = true;
    } else {
        imgEl.src = '';
        imgEl.hidden = true;
        placeholderEl.hidden = false;
    }
}

/**
 * Atualiza o estado ativo dos chips de filtro, o contador e o botão de limpar busca.
 */
export function renderFilterBar({ activeGroups, filteredCount, totalCount, searchQuery }) {
    const filtersEl = document.getElementById('dbFilters');
    const counterEl = document.getElementById('dbCounter');
    const clearBtn = document.getElementById('dbSearchClear');

    if (filtersEl) {
        filtersEl.querySelectorAll('.db-filter-chip').forEach((chip) => {
            const group = chip.dataset.group;
            const isActive =
                group === 'all' ? activeGroups.size === 0 : activeGroups.has(group);
            chip.classList.toggle('active', isActive);
            chip.setAttribute('aria-pressed', String(isActive));
        });
    }

    if (counterEl) {
        const showing = localizationService.t('dbShowing');
        counterEl.textContent = `${showing}: ${filteredCount} / ${totalCount}`;
    }

    if (clearBtn) {
        clearBtn.hidden = !searchQuery;
    }
}

/**
 * Renderiza o grid de cards filtrados e destaca o aminoácido selecionado (se houver).
 */
export function renderDatabaseGrid({ items, selectedId, onSelect }) {
    const grid = document.getElementById('dbGrid');
    const emptyEl = document.getElementById('dbEmpty');
    if (!grid) return;

    const lang = localizationService.getLanguage();
    grid.innerHTML = '';

    if (items.length === 0) {
        grid.hidden = true;
        if (emptyEl) emptyEl.hidden = false;
        return;
    }

    grid.hidden = false;
    if (emptyEl) emptyEl.hidden = true;

    items.forEach((aa) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = `db-card${aa.id === selectedId ? ' is-selected' : ''}`;
        card.style.setProperty('--amino-color', getGroupColor(aa));
        card.dataset.aaId = aa.id;

        const tagClass = GROUP_TAG_MAP[aa.groupKey] || 'tag-aromatic';

        card.innerHTML = `
            <span class="db-card-tag ${tagClass}">${aa.group[lang]}</span>
            <div class="db-card-name">${aa.name[lang]}</div>
            <div class="db-card-structure">
                <img src="${aa.image}" alt="${aa.name[lang]}" loading="lazy">
            </div>
            <div class="db-card-codes">${aa.code3} | ${aa.code1}</div>
        `;

        const img = card.querySelector('img');
        if (img) {
            img.onerror = () => {
                img.hidden = true;
            };
        }

        card.addEventListener('click', () => onSelect(aa.id));
        grid.appendChild(card);
    });
}

/**
 * Abre ou oculta o painel lateral de resumo do aminoácido selecionado.
 */
export function renderSidePanel(aa) {
    const workspace = document.getElementById('dbWorkspace');
    const panel = document.getElementById('dbSidePanel');
    if (!workspace || !panel) return;

    if (!aa) {
        panel.hidden = true;
        workspace.classList.remove('has-panel');
        return;
    }

    const lang = localizationService.getLanguage();
    panel.hidden = false;
    workspace.classList.add('has-panel');
    panel.style.setProperty('--amino-color', getGroupColor(aa));

    const badgesEl = document.getElementById('sideBadges');
    const nameEl = document.getElementById('sideName');
    const imgEl = document.getElementById('sideStructure');
    const placeholderEl = document.getElementById('sideStructurePlaceholder');
    const codesEl = document.getElementById('sideCodes');
    const detailsEl = document.getElementById('sideDetails');
    const tipEl = document.getElementById('sideTip');

    if (badgesEl) badgesEl.innerHTML = renderBadgesHTML(aa, lang);
    if (nameEl) nameEl.textContent = aa.name[lang];
    setStructureImage(imgEl, placeholderEl, aa, lang);
    if (codesEl) codesEl.textContent = `${aa.code3.toUpperCase()} | ${aa.code1}`;

    if (detailsEl) {
        const propsText = aa.properties.map((p) => p[lang]).join(', ');
        const codonsText = formatCodonsList(aa.codons, localizationService.t('andWord'));

        detailsEl.innerHTML = `
            <ul>
                <li><strong>${localizationService.t('lblChemClass')}:</strong> ${aa.classification[lang]}</li>
                <li><strong>${localizationService.t('lblPolarity')}:</strong> ${aa.polarity[lang]}</li>
                <li><strong>${localizationService.t('lblFormula')}:</strong> ${formatFormula(aa.formula)}</li>
                <li><strong>${localizationService.t('lblCodon')}:</strong> ${codonsText}.</li>
                <li><strong>${localizationService.t('lblMass')}:</strong> ${aa.molarMass} g/mol</li>
                <li><strong>${localizationService.t('lblProps')}:</strong> ${propsText}.</li>
            </ul>
        `;
    }

    if (tipEl) {
        tipEl.innerHTML = `${localizationService.t('studyTipPrefix')}${aa.tip[lang]}`;
    }
}

/**
 * Alterna entre a visão de Grid (com painel lateral) e a Visualização Detalhada (+ Mais Detalhes).
 */
export function renderFullDetailView(aa, isFullDetailOpen) {
    const overviewEl = document.getElementById('dbOverview');
    const fullEl = document.getElementById('dbFullDetail');
    const cardEl = document.getElementById('dbDetailCard');

    if (!overviewEl || !fullEl) return;

    if (!isFullDetailOpen || !aa) {
        overviewEl.hidden = false;
        fullEl.hidden = true;
        return;
    }

    const lang = localizationService.getLanguage();
    overviewEl.hidden = true;
    fullEl.hidden = false;

    if (cardEl) {
        cardEl.style.setProperty('--amino-color', getGroupColor(aa));
    }

    const badgesEl = document.getElementById('fullBadges');
    const nameEl = document.getElementById('fullName');
    const imgEl = document.getElementById('fullStructure');
    const placeholderEl = document.getElementById('fullStructurePlaceholder');
    const codesEl = document.getElementById('fullCodes');
    const sheetEl = document.getElementById('fullSheetDetails');
    const tipEl = document.getElementById('fullTip');
    const extraEl = document.getElementById('fullExtraDetails');

    if (badgesEl) badgesEl.innerHTML = renderBadgesHTML(aa, lang);
    if (nameEl) nameEl.textContent = aa.name[lang];
    setStructureImage(imgEl, placeholderEl, aa, lang);
    if (codesEl) codesEl.textContent = `${aa.code3.toUpperCase()} | ${aa.code1}`;

    if (sheetEl) {
        const propsText = aa.properties.map((p) => p[lang]).join(', ');
        const codonsText = formatCodonsList(aa.codons, localizationService.t('andWord'));

        sheetEl.innerHTML = `
            <ul>
                <li><strong>${localizationService.t('lblChemClass')}:</strong> ${aa.classification[lang]}</li>
                <li><strong>${localizationService.t('lblPolarity')}:</strong> ${aa.polarity[lang]}</li>
                <li><strong>${localizationService.t('lblPhysiology')}:</strong> ${aa.essentiality[lang]}</li>
                <li><strong>${localizationService.t('lblFormula')}:</strong> ${formatFormula(aa.formula)}</li>
                <li><strong>${localizationService.t('lblCodon')}:</strong> ${codonsText}.</li>
                <li><strong>${localizationService.t('lblMass')}:</strong> ${aa.molarMass} g/mol</li>
                <li><strong>${localizationService.t('lblProps')}:</strong> ${propsText}.</li>
            </ul>
        `;
    }

    if (tipEl) {
        tipEl.innerHTML = `${localizationService.t('studyTipPrefix')}${aa.tip[lang]}`;
    }

    if (extraEl) {
        const phys = aa.physicochemical || {};
        const pkaPills = [
            phys.pKa1 ? `<span class="db-pka-pill">pKa₁ (α-COOH): ${phys.pKa1}</span>` : '',
            phys.pKa2 ? `<span class="db-pka-pill">pKa₂ (α-NH₃⁺): ${phys.pKa2}</span>` : '',
            phys.pKr ? `<span class="db-pka-pill">pK<sub>R</sub>: ${phys.pKr}</span>` : '',
            phys.pI ? `<span class="db-pka-pill">pI: ${phys.pI}</span>` : '',
        ]
            .filter(Boolean)
            .join('');

        extraEl.innerHTML = `
            <div class="db-extra-block">
                <h5>${localizationService.t('lblSideChain')}</h5>
                <p>${aa.sideChain[lang]}</p>
            </div>
            <div class="db-extra-block">
                <h5>${localizationService.t('lblPhysChem')}</h5>
                <div class="db-pka-grid">${pkaPills}</div>
            </div>
            <div class="db-extra-block">
                <h5>${localizationService.t('lblBioRole')}</h5>
                <p>${aa.biologicalRole[lang]}</p>
            </div>
            <div class="db-extra-block">
                <h5>${localizationService.t('lblJustification')}</h5>
                <p>${aa.justification[lang]}</p>
            </div>
        `;
    }
}

/**
 * Abre ou fecha o modal de Zoom em tela cheia da estrutura química.
 */
export function renderZoomModal(aa, isOpen) {
    const modal = document.getElementById('dbZoomModal');
    if (!modal) return;

    if (!isOpen || !aa) {
        modal.hidden = true;
        return;
    }

    const lang = localizationService.getLanguage();
    const titleEl = document.getElementById('zoomTitle');
    const metaEl = document.getElementById('zoomMeta');
    const imgEl = document.getElementById('zoomImage');

    if (titleEl) titleEl.textContent = aa.name[lang];
    if (metaEl) {
        metaEl.innerHTML = `${aa.code3} | ${aa.code1} · ${formatFormula(aa.formula)}`;
    }
    if (imgEl) {
        imgEl.src = aa.image || '';
        imgEl.alt = aa.name[lang];
    }

    modal.hidden = false;
}
