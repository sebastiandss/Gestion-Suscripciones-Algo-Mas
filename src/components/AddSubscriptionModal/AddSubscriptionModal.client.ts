import { addSubscription } from '../../store/subscriptions';
import type { Subscription } from '../../types';

let currentModal: HTMLElement | null = null;
let isWindowListenerAdded = false;

const setupModal = () => {
  currentModal = document.getElementById('modal-overlay');
  const modal = currentModal;
  const closeBtn = document.getElementById('close-modal');
  const saveBtn = document.getElementById('save-sub-btn');
  const form = document.getElementById('sub-form') as HTMLFormElement;

  if (!isWindowListenerAdded) {
      window.addEventListener('abrir-modal-suscripcion', () => {
          currentModal?.classList.add('is-active');
      });
      isWindowListenerAdded = true;
  }

  if (closeBtn) closeBtn.onclick = () => modal?.classList.remove('is-active');

  if (saveBtn) saveBtn.onclick = () => {
    const name = (document.getElementById('sub-name') as HTMLInputElement).value;
    const tag = (document.getElementById('sub-tag') as HTMLInputElement).value;
    const price = (document.getElementById('sub-price') as HTMLInputElement).value;
    const date = (document.getElementById('sub-date') as HTMLInputElement).value;
    const colorInput = document.querySelector('input[name="color"]:checked') as HTMLInputElement;
    const color = colorInput ? colorInput.value : 'blue';

    if (!name || !price) {
        alert("Por favor completa nombre y precio");
        return;
    }

    const newSub: Subscription = {
      id: crypto.randomUUID(),
      name,
      tag: tag || 'General',
      price: price.replace('$', ''),
      date,
      serviceClass: color,
      status: 'Activo'
    };

    addSubscription(newSub);

    form.reset();
    modal?.classList.remove('is-active');
  };
};

setupModal();
document.addEventListener('astro:after-swap', setupModal);
