export interface Subscription {
  id: string;
  name: string;
  tag: string;
  price: string;
  date: string;
  serviceClass: string;
  status: string;
}

export interface BudgetLimit {
  id: string;
  category: string;
  limit: number;
}

export interface Budget extends BudgetLimit {
  currentSpent: number;
  isTotal?: boolean;
}
