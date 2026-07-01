export interface Vehicle {
  plate: string;
  brand: string;
  year: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  vehicles: Vehicle[];
}

export interface Service {
  id: string;
  name: string;
  price: number;
  description: string;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  costPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  category: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'IN' | 'OUT';
  quantity: number;
  reason: string;
  date: string;
}

export interface PatioVehicle {
  id: string;
  plate: string;
  brand: string;
  ownerName: string;
  ownerPhone: string;
  entryDate: string;
  exitDate?: string;
  status: 'Aguardando Diagnóstico' | 'Em Manutenção' | 'Pronto para Entrega' | 'Entregue';
  notes: string;
}

export interface OSItem {
  id: string; // Product ID or Service ID or generated ID for custom items
  type: 'PRODUCT' | 'SERVICE';
  name: string;
  quantity: number;
  price: number;
  costPrice?: number; // to track profits
}

export interface ServiceOrder {
  id: string; // e.g. "OS-0001"
  clientId: string;
  clientName: string;
  clientPhone: string;
  vehiclePlate: string;
  status: 'Orçamento' | 'Aprovado' | 'Em Execução' | 'Concluído' | 'Cancelado';
  items: OSItem[];
  discount: number;
  totalAmount: number;
  paymentMethod?: 'Pix' | 'Débito' | 'Crédito' | 'Pagar outro dia';
  paymentStatus: 'Pendente' | 'Pago';
  entryDate: string;
  finishDate?: string;
  notes: string;
}

export interface FinancialTransaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  amount: number;
  description: string;
  date: string;
  paymentMethod?: string;
  referenceId?: string; // OS ID or other reference
}

export interface CashRegister {
  isOpen: boolean;
  openedAt?: string;
  closedAt?: string;
  initialAmount: number;
  currentAmount: number;
}
