import { persistentAtom } from '@nanostores/persistent';
import { computed } from 'nanostores';
import type { Subscription } from '../types';

export const $subscriptions = persistentAtom<Subscription[]>('suscripciones_data', [], {
  encode: JSON.stringify,
  decode: JSON.parse,
});

export const $totalGastos = computed($subscriptions, (list) => {
  const total = list.reduce((acc, item) => acc + (parseFloat(item.price) || 0), 0);
  return total.toFixed(2);
});

export function addSubscription(sub: Subscription) {
  $subscriptions.set([...$subscriptions.get(), sub]);
}

export function removeSubscription(id: string) {
  $subscriptions.set($subscriptions.get().filter(s => s.id !== id));
}

export function updateSubscriptionStatus(id: string, newStatus: string) {
  $subscriptions.set(
    $subscriptions.get().map(s => s.id === id ? { ...s, status: newStatus } : s)
  );
}

export function updateSubscriptionTag(id: string, newTag: string) {
  $subscriptions.set(
    $subscriptions.get().map(s => s.id === id ? { ...s, tag: newTag } : s)
  );
}
