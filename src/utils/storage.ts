import { Client, Product, Service, PatioVehicle, ServiceOrder, FinancialTransaction } from '../types';

const STORAGE_KEY = 'oficina_360_data_v2';

export function getInitialState(): any {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Basic validation to ensure all required fields are present
      if (parsed.clients && parsed.products && parsed.services && parsed.patio && parsed.orders && parsed.transactions) {
        return parsed;
      }
    } catch (e) {
      console.error('Error parsing saved data, resetting to initial', e);
    }
  }

  // Fallback to empty production-ready clean state for first-time use
  const state = {
    clients: [],
    products: [],
    services: [],
    patio: [],
    orders: [],
    transactions: [],
    cashRegister: {
      isOpen: false,
      openedAt: null,
      closedAt: null,
      initialAmount: 0,
      currentAmount: 0
    }
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

export function saveState(state: any): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
