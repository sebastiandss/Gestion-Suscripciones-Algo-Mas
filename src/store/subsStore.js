import { persistentAtom } from '@nanostores/persistent';
import { computed } from 'nanostores';

// --- Átomos Persistentes ---
export const $subscriptions = persistentAtom('suscripciones_data', [], {
    encode: JSON.stringify,
    decode: JSON.parse,
});

export const _rawBudgets = persistentAtom('presupuestos_data', [], {
    encode: JSON.stringify,
    decode: JSON.parse,
});

// --- Cálculos Computados ---
export const $budgets = computed([_rawBudgets, $subscriptions], (budgets, subs) => {
    const totalLimit = budgets.reduce((acc, b) => acc + (parseFloat(b.limit) || 0), 0);
    const totalSpent = budgets.reduce((acc, b) => acc + (parseFloat(b.currentSpent) || 0), 0);

    const totalBudget = {
        id: 'total-static-id',
        category: 'Presupuesto Total',
        limit: totalLimit.toFixed(2),
        currentSpent: totalSpent,
        isTotal: true 
    };

    return [...budgets, totalBudget];
});

export const $totalGastos = computed($subscriptions, (list) => {
    const total = list.reduce((acc, item) => acc + (parseFloat(item.price) || 0), 0);
    return total.toFixed(2);
});

// --- Funciones de Suscripciones ---

export function addSubscription(newSub) {
    const subs = $subscriptions.get();
    const priceNum = parseFloat(newSub.price) || 0;
    $subscriptions.set([...subs, newSub]);

    const budgets = _rawBudgets.get();
    const targetTag = newSub.tag.toLowerCase();
    
    let budgetIndex = budgets.findIndex(b => b.category.toLowerCase() === targetTag);
    if (budgetIndex === -1) budgetIndex = budgets.findIndex(b => b.category.toLowerCase() === 'general');

    if (budgetIndex !== -1) {
        const updated = [...budgets];
        updated[budgetIndex].currentSpent += priceNum;
        _rawBudgets.set(updated);
    } else {
        _rawBudgets.set([...budgets, {
            id: crypto.randomUUID(),
            category: 'General',
            limit: 0,
            currentSpent: priceNum
        }]);
    }
}

export function removeSubscription(index) {
    const subs = $subscriptions.get();
    const subToRemove = subs[index];
    if (!subToRemove) return;

    const priceNum = parseFloat(subToRemove.price) || 0;
    $subscriptions.set(subs.filter((_, i) => i !== index));

    const budgets = _rawBudgets.get();
    const targetTag = subToRemove.tag.toLowerCase();

    let budgetIndex = budgets.findIndex(b => b.category.toLowerCase() === targetTag);
    if (budgetIndex === -1) budgetIndex = budgets.findIndex(b => b.category.toLowerCase() === 'general');

    if (budgetIndex !== -1) {
        const updated = [...budgets];
        updated[budgetIndex].currentSpent = Math.max(0, updated[budgetIndex].currentSpent - priceNum);
        if (updated[budgetIndex].category.toLowerCase() === 'general' && updated[budgetIndex].currentSpent <= 0) {
            _rawBudgets.set(updated.filter((_, i) => i !== budgetIndex));
        } else {
            _rawBudgets.set(updated);
        }
    }
}

export function updateSubscriptionStatus(index, newStatus) {
    const current = $subscriptions.get();
    const updated = [...current];
    updated[index] = { ...updated[index], status: newStatus };
    $subscriptions.set(updated);
}

export function updateSubscriptionTag(index, newTag) {
    const subs = $subscriptions.get();
    const sub = subs[index];
    if (!sub || sub.tag === newTag) return;

    const oldTag = sub.tag;
    const price = parseFloat(sub.price) || 0;

    // 1. Actualizar la suscripción
    const updatedSubs = [...subs];
    updatedSubs[index] = { ...sub, tag: newTag };
    $subscriptions.set(updatedSubs);

    // 2. Mover el gasto
    const budgets = _rawBudgets.get();
    
    // Buscamos el índice del presupuesto destino (nuevo tag)
    let targetIndex = budgets.findIndex(b => b.category.toLowerCase() === newTag.toLowerCase());
    
    // Si no existe el presupuesto destino, lo mandaremos a "General"
    if (targetIndex === -1) {
        targetIndex = budgets.findIndex(b => b.category.toLowerCase() === 'general');
    }

    let updatedBudgets = [...budgets];

    // Restar del viejo
    const oldIndex = budgets.findIndex(b => b.category.toLowerCase() === oldTag.toLowerCase());
    if (oldIndex !== -1) {
        updatedBudgets[oldIndex] = { 
            ...updatedBudgets[oldIndex], 
            currentSpent: Math.max(0, updatedBudgets[oldIndex].currentSpent - price) 
        };
    }

    // Sumar al nuevo (o crear General si no hay nada)
    if (targetIndex !== -1) {
        updatedBudgets[targetIndex] = { 
            ...updatedBudgets[targetIndex], 
            currentSpent: updatedBudgets[targetIndex].currentSpent + price 
        };
    } else {
        // Si no existía ni el target ni General, creamos General
        updatedBudgets.push({
            id: crypto.randomUUID(),
            category: 'General',
            limit: 0,
            currentSpent: price
        });
    }

    // Limpieza de General vacío
    updatedBudgets = updatedBudgets.filter(b => 
        !(b.category.toLowerCase() === 'general' && b.currentSpent <= 0)
    );

    _rawBudgets.set(updatedBudgets);
}

// --- Funciones de Presupuestos ---

export function addBudget(newBudget) {
    const subs = $subscriptions.get();
    const budgets = _rawBudgets.get();
    
    const spentInCategory = subs
        .filter(s => s.tag.toLowerCase() === newBudget.category.toLowerCase())
        .reduce((acc, s) => acc + (parseFloat(s.price) || 0), 0);

    const updatedBudgets = budgets
        .map(b => {
            if (b.category.toLowerCase() === 'general') {
                return { ...b, currentSpent: Math.max(0, b.currentSpent - spentInCategory) };
            }
            return b;
        })
        .filter(b => !(b.category.toLowerCase() === 'general' && b.currentSpent <= 0));

    _rawBudgets.set([...updatedBudgets, { ...newBudget, currentSpent: spentInCategory }]);
}

export function removeBudget(index) {
    const budgets = _rawBudgets.get();
    if (index >= budgets.length) return; 
    _rawBudgets.set(budgets.filter((_, i) => i !== index));
}