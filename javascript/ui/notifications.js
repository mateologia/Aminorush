/**
 * Sistema de notificações flutuantes (Toasts) para conquistas e ações de save.
 */

import { audioService } from '../services/audioService.js';

const TOAST_LIFETIME_MS = 3500;
const TOAST_FADEOUT_MS = 400;

/**
 * Exibe um toast no canto superior direito com som opcional.
 * @param {string} icon
 * @param {string} title
 * @param {string} desc
 */
export function showToast(icon, title, desc) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">
            <h4>${title}</h4>
            <p>${desc}</p>
        </div>
    `;

    container.appendChild(toast);
    audioService.playToast();

    setTimeout(() => {
        toast.style.animation = `fadeOutRight ${TOAST_FADEOUT_MS}ms ease forwards`;
        setTimeout(() => toast.remove(), TOAST_FADEOUT_MS);
    }, TOAST_LIFETIME_MS);
}
