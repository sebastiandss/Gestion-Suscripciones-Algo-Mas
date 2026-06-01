import { persistentAtom } from '@nanostores/persistent';
import { computed } from 'nanostores';
import { $subscriptions } from './subscriptions';
import type { BudgetLimit, Budget } from '../types';

export const $budgetLimits = persistentAtom<BudgetLimit[]>('presupuestos_data', [], {
  encode: JSON.stringify,
  decode: JSON.parse,
});

export const $budgets = computed([$budgetLimits, $subscriptions], (limits, subs) => {
  const budgets: Budget[] = limits.map(limit => {
    const spent = subs
      .filter(s => s.tag.toLowerCase() === limit.category.toLowerCase())
      .reduce((acc, s) => acc + (parseFloat(s.price) || 0), 0);
    return { ...limit, currentSpent: spent };
  });

  const totalLimit = budgets.reduce((acc, b) => acc + b.limit, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.currentSpent, 0);

  budgets.push({
    id: 'total-static-id',
    category: 'Presupuesto Total',
    limit: totalLimit,
    currentSpent: totalSpent,
    isTotal: true,
  });

  return budgets;
});

export function addBudget(limit: BudgetLimit) {
  $budgetLimits.set([...$budgetLimits.get(), limit]);
}

export function removeBudget(id: string) {
  $budgetLimits.set($budgetLimits.get().filter(b => b.id !== id));
}
