import { $subscriptions, removeSubscription, updateSubscriptionStatus } from '../../store/subscriptions';

const VIEW_STORAGE_KEY = 'subtrack_view_mode';

let unsubscribe: (() => void) | null = null;

function getSavedView(): 'grid' | 'list' {
  try {
    const saved = localStorage.getItem(VIEW_STORAGE_KEY);
    if (saved === 'grid' || saved === 'list') return saved;
  } catch {}
  return 'grid';
}

function saveView(mode: 'grid' | 'list') {
  try { localStorage.setItem(VIEW_STORAGE_KEY, mode); } catch {}
}

const initGrid = () => {
    const container = document.getElementById('subs-container');
    const dynamicContainer = document.getElementById('grid-dynamic-container');
    const gridAddBtn = document.getElementById('grid-add-btn');
    const btnGrid = document.getElementById('grid-view');
    const btnList = document.getElementById('list-view');

    if (!container || !dynamicContainer) return;

    const savedView = getSavedView();
    container.className = `subs-container ${savedView}-layout`;
    if (btnGrid) btnGrid.classList.toggle('active', savedView === 'grid');
    if (btnList) btnList.classList.toggle('active', savedView === 'list');

    if (btnList) btnList.onclick = () => {
        container.className = 'subs-container list-layout';
        btnList.classList.add('active');
        btnGrid?.classList.remove('active');
        saveView('list');
    };

    if (btnGrid) btnGrid.onclick = () => {
        container.className = 'subs-container grid-layout';
        btnGrid.classList.add('active');
        btnList?.classList.remove('active');
        saveView('grid');
    };

    if (gridAddBtn) gridAddBtn.onclick = () => {
        window.dispatchEvent(new CustomEvent('abrir-modal-suscripcion'));
    };

    if (unsubscribe) unsubscribe();

    unsubscribe = $subscriptions.subscribe((subs: any[]) => {
        const emptyEl = container.querySelector('.empty-state');
        if (emptyEl) emptyEl.remove();

        if (subs.length === 0) {
            dynamicContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <p>No tienes suscripciones</p>
                    <span>Agrega tu primer servicio para empezar a monitorear tus gastos.</span>
                </div>
            `;
            window.dispatchEvent(new CustomEvent('subs-renderizadas'));
            return;
        }

        dynamicContainer.innerHTML = subs.map((sub) => {
            const status = sub.status || 'Activo';
            const statusClass = status.toLowerCase();
            const initials = sub.name
                .split(' ')
                .slice(0, 2)
                .map((w: string) => w[0])
                .join('');

            return `
            <div class="flip-card dynamic-item">
                <div class="detailed-card">
                    <div class="card-content">
                        <div class="service-icon ${sub.serviceClass || 'blue'}">${initials}</div>
                        <div class="text-info">
                            <h3>${sub.name}</h3>
                            <p>$${parseFloat(sub.price).toFixed(2)} / mes</p>
                            <div class="tag-label-simple">${sub.tag || 'General'}</div>
                        </div>
                        <div class="meta-info">
                            <div class="status-dropdown" data-id="${sub.id}">
                                <div class="badge ${statusClass}">
                                    <span class="arrow">▾</span> ${status}
                                </div>
                                <div class="dropdown-menu">
                                    <div class="option" data-value="Activo">✓ Activo</div>
                                    <div class="option" data-value="Pausada">⏸ Pausada</div>
                                    <div class="option" data-value="Vencida">✕ Vencida</div>
                                </div>
                            </div>
                            <div class="date">${sub.date ? `📅 ${sub.date}` : 'Sin fecha'}</div>
                        </div>
                        <button class="delete-sub-btn" data-id="${sub.id}" title="Eliminar suscripción">
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                    </div>
                </div>
            </div>
        `}).join('');

        const cards = dynamicContainer.querySelectorAll('.delete-sub-btn');
        cards.forEach(btn => {
            (btn as HTMLElement).onclick = (e) => {
                e.stopPropagation();
                const id = (e.currentTarget as HTMLElement).getAttribute('data-id') || '';
                if (id && confirm(`¿Estás seguro de eliminar esta suscripción?`)) {
                    removeSubscription(id);
                }
            };
        });

        const dropdowns = dynamicContainer.querySelectorAll('.status-dropdown');
        dropdowns.forEach(dropdown => {
            const badge = dropdown.querySelector('.badge') as HTMLElement;
            const id = dropdown.getAttribute('data-id') || '';

            if (badge) badge.onclick = (e) => {
                e.stopPropagation();
                document.querySelectorAll('.status-dropdown').forEach(d => {
                    if (d !== dropdown) {
                        d.classList.remove('is-open');
                        const otherCard = d.closest('.flip-card');
                        if (otherCard) otherCard.classList.remove('has-open-dropdown');
                    }
                });
                dropdown.classList.toggle('is-open');
                const parentCard = dropdown.closest('.flip-card');
                if (parentCard) {
                    parentCard.classList.toggle('has-open-dropdown', dropdown.classList.contains('is-open'));
                }
            };

            dropdown.querySelectorAll('.option').forEach(opt => {
                (opt as HTMLElement).onclick = (e) => {
                    e.stopPropagation();
                    const newValue = (opt as HTMLElement).getAttribute('data-value');
                    if (newValue && id) {
                        updateSubscriptionStatus(id, newValue);
                    }
                    dropdown.classList.remove('is-open');
                };
            });
        });

        window.dispatchEvent(new CustomEvent('subs-renderizadas'));
    });
};

if (!(window as any).__clickDropdownListenerAdded) {
    document.addEventListener('click', () => {
        document.querySelectorAll('.status-dropdown').forEach(d => d.classList.remove('is-open'));
        document.querySelectorAll('.flip-card.has-open-dropdown').forEach(c => c.classList.remove('has-open-dropdown'));
    });
    (window as any).__clickDropdownListenerAdded = true;
}

initGrid();
document.addEventListener('astro:after-swap', initGrid);
