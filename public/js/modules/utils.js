// ============================================
// TOAST NOTIFICATIONS
// ============================================

export function toast(msg, type = 'info') {
    const t = document.createElement('div');
    t.className = 'toast toast-' + type;
    t.textContent = msg;
    const container = document.getElementById('toastContainer');
    if (container) {
        container.appendChild(t);
        setTimeout(() => t.remove(), 2500);
    }
}
