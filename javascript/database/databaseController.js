/**
 * Controlador completo do Banco de Dados:
 * - Grid simultâneo com 20 cards
 * - Filtros multi-seleção por grupo químico + busca textual
 * - Painel lateral recolhível (só abre quando um card é clicado)
 * - Visualização detalhada focada (+ Mais Detalhes)
 * - Modal de Zoom na estrutura química
 */

import { achievementSystem } from '../core/achievementSystem.js';
import { state } from '../core/gameState.js';
import { localizationService } from '../services/localizationService.js';
import { screenManager } from '../ui/screenManager.js';
import { filterAminoAcids } from './databaseFilters.js';
import {
    renderDatabaseGrid,
    renderFilterBar,
    renderFullDetailView,
    renderSidePanel,
    renderZoomModal,
} from './databaseView.js';

const ALL_GROUPS = ['nonpolar', 'polar', 'aromatic', 'acidic', 'basic'];

class DatabaseController {
    constructor() {
        this.activeGroups = new Set();
        this.searchQuery = '';
        this.selectedId = null;
        this.isFullDetailOpen = false;
        this.isZoomOpen = false;
    }

    /**
     * Abre o Banco de Dados na visão inicial limpa (grid completo sem painel lateral aberto).
     */
    open() {
        achievementSystem.unlock('bookworm');
        this.activeGroups.clear();
        this.searchQuery = '';
        this.selectedId = null;
        this.isFullDetailOpen = false;
        this.isZoomOpen = false;

        const searchInput = document.getElementById('dbSearchInput');
        if (searchInput) searchInput.value = '';

        this.render();
    }

    /**
     * Fecha modais/estados transitórios ao sair do Banco de Dados.
     */
    closeOverlays() {
        this.isZoomOpen = false;
        this.isFullDetailOpen = false;
        renderZoomModal(null, false);
    }

    getFilteredItems() {
        return filterAminoAcids(state.aminoAcids, {
            activeGroups: this.activeGroups,
            searchQuery: this.searchQuery,
            lang: localizationService.getLanguage(),
        });
    }

    getSelectedAminoAcid() {
        if (!this.selectedId) return null;
        return state.aminoAcids.find((aa) => aa.id === this.selectedId) || null;
    }

    selectAminoAcid(aaId) {
        if (this.selectedId === aaId && !this.isFullDetailOpen) {
            this.selectedId = null;
        } else {
            this.selectedId = aaId;
        }
        this.render();
    }

    closeSidePanel() {
        this.selectedId = null;
        this.isFullDetailOpen = false;
        this.isZoomOpen = false;
        this.render();
    }

    openFullDetail() {
        if (!this.selectedId) return;
        this.isFullDetailOpen = true;
        this.render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    closeFullDetail() {
        this.isFullDetailOpen = false;
        this.isZoomOpen = false;
        this.render();
    }

    openZoom() {
        const aa = this.getSelectedAminoAcid();
        if (!aa || !aa.image) return;
        this.isZoomOpen = true;
        renderZoomModal(aa, true);
    }

    closeZoom() {
        this.isZoomOpen = false;
        renderZoomModal(null, false);
    }

    toggleGroupFilter(groupKey) {
        if (groupKey === 'all') {
            this.activeGroups.clear();
        } else {
            if (this.activeGroups.has(groupKey)) {
                this.activeGroups.delete(groupKey);
            } else {
                this.activeGroups.add(groupKey);
            }

            // Se todos os 5 grupos forem marcados, equivale a "Todos"
            if (this.activeGroups.size === ALL_GROUPS.length) {
                this.activeGroups.clear();
            }
        }
        this.render();
    }

    setSearchQuery(query) {
        this.searchQuery = query;
        this.render();
    }

    clearSearch() {
        this.searchQuery = '';
        const searchInput = document.getElementById('dbSearchInput');
        if (searchInput) {
            searchInput.value = '';
            searchInput.focus();
        }
        this.render();
    }

    clearAllFilters() {
        this.activeGroups.clear();
        this.searchQuery = '';
        const searchInput = document.getElementById('dbSearchInput');
        if (searchInput) searchInput.value = '';
        this.render();
    }

    /**
     * Navega para o próximo aminoácido dentro da lista filtrada atual.
     */
    next() {
        const items = this.getFilteredItems();
        if (!items.length) return;
        const currentIdx = items.findIndex((aa) => aa.id === this.selectedId);
        const nextIdx = currentIdx === -1 ? 0 : (currentIdx + 1) % items.length;
        this.selectedId = items[nextIdx].id;
        this.render();
    }

    /**
     * Navega para o aminoácido anterior dentro da lista filtrada atual.
     */
    prev() {
        const items = this.getFilteredItems();
        if (!items.length) return;
        const currentIdx = items.findIndex((aa) => aa.id === this.selectedId);
        const prevIdx =
            currentIdx === -1
                ? items.length - 1
                : (currentIdx - 1 + items.length) % items.length;
        this.selectedId = items[prevIdx].id;
        this.render();
    }

    /**
     * Trata tecla Escape em cascata: fecha Zoom -> sai do + Detalhes -> fecha Painel Lateral.
     */
    handleEscape() {
        if (this.isZoomOpen) {
            this.closeZoom();
        } else if (this.isFullDetailOpen) {
            this.closeFullDetail();
        } else if (this.selectedId) {
            this.closeSidePanel();
        }
    }

    /**
     * Alias mantido para compatibilidade com main.js ao trocar idioma.
     */
    renderCurrent() {
        this.render();
    }

    render() {
        const items = this.getFilteredItems();

        // Se o aminoácido selecionado não está mais nos filtros atuais, fecha o painel
        if (this.selectedId && !items.some((aa) => aa.id === this.selectedId)) {
            this.selectedId = null;
            this.isFullDetailOpen = false;
            this.isZoomOpen = false;
        }

        const selectedAA = this.getSelectedAminoAcid();

        if (state.screen === 'studyScreen') {
            screenManager.setLayoutMode(this.isFullDetailOpen ? 'detail' : 'wide');
        }

        renderFilterBar({
            activeGroups: this.activeGroups,
            filteredCount: items.length,
            totalCount: state.aminoAcids.length,
            searchQuery: this.searchQuery,
        });

        renderDatabaseGrid({
            items,
            selectedId: this.selectedId,
            onSelect: (aaId) => this.selectAminoAcid(aaId),
        });

        renderSidePanel(this.isFullDetailOpen ? null : selectedAA);
        renderFullDetailView(selectedAA, this.isFullDetailOpen);
        renderZoomModal(selectedAA, this.isZoomOpen);
    }
}

export const databaseController = new DatabaseController();
