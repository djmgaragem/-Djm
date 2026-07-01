import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Users, 
  Car, 
  Package, 
  FileText, 
  DollarSign, 
  ShieldCheck, 
  Menu, 
  X,
  Plus,
  Search,
  BookOpen,
  LogOut,
  ChevronRight
} from 'lucide-react';

import { 
  Client, 
  Product, 
  Service, 
  PatioVehicle, 
  ServiceOrder, 
  FinancialTransaction, 
  CashRegister, 
  StockMovement,
  Vehicle
} from './types';

import { getInitialState, saveState } from './utils/storage';

// Import components
import Dashboard from './components/Dashboard';
import Patio from './components/Patio';
import Clients from './components/Clients';
import Inventory from './components/Inventory';
import Services from './components/Services';
import ServiceOrders from './components/ServiceOrders';
import Finance from './components/Finance';
import Backup from './components/Backup';

export default function App() {
  // Load state from localStorage on startup
  const [state, setState] = useState(() => getInitialState());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // States for handling quick-actions from dashboard shortcuts
  const [activeOSForCreation, setActiveOSForCreation] = useState<{ client: Client; plate: string } | null>(null);

  // Auto-save any changes to state
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Clients Actions
  const handleAddClient = (newClient: Omit<Client, 'id'>): Client => {
    const id = `cli-${Date.now()}`;
    const clientWithId: Client = { ...newClient, id };
    
    // Automatically record stock deduction if vehicles were added with active inventory (handled below)
    setState((prev: any) => ({
      ...prev,
      clients: [clientWithId, ...prev.clients]
    }));
    return clientWithId;
  };

  const handleUpdateClient = (id: string, updated: Partial<Client>) => {
    setState((prev: any) => ({
      ...prev,
      clients: prev.clients.map((c: Client) => c.id === id ? { ...c, ...updated } : c)
    }));
  };

  const handleRemoveClient = (id: string) => {
    setState((prev: any) => ({
      ...prev,
      clients: prev.clients.filter((c: Client) => c.id !== id)
    }));
  };

  const handleAddVehicle = (clientId: string, vehicle: Vehicle) => {
    setState((prev: any) => ({
      ...prev,
      clients: prev.clients.map((c: Client) => {
        if (c.id === clientId) {
          // Prevent duplicates by plate
          if (c.vehicles.some(v => v.plate === vehicle.plate)) return c;
          return { ...c, vehicles: [...c.vehicles, vehicle] };
        }
        return c;
      })
    }));
  };

  const handleRemoveVehicle = (clientId: string, plate: string) => {
    setState((prev: any) => ({
      ...prev,
      clients: prev.clients.map((c: Client) => {
        if (c.id === clientId) {
          return { ...c, vehicles: c.vehicles.filter(v => v.plate !== plate) };
        }
        return c;
      })
    }));
  };

  // Patio Actions
  const handleAddPatioVehicle = (newVehicle: Omit<PatioVehicle, 'id' | 'entryDate'>) => {
    const id = `pat-${Date.now()}`;
    const entryDate = new Date().toISOString();
    const vehicleWithId: PatioVehicle = { ...newVehicle, id, entryDate };

    // Also check if owner exists in client DB. If not, automatically register them!
    const clientExists = state.clients.some(
      (c: Client) => c.name.toLowerCase() === newVehicle.ownerName.toLowerCase() || c.phone === newVehicle.ownerPhone
    );

    let updatedClients = [...state.clients];
    if (!clientExists) {
      const newClientId = `cli-${Date.now()}`;
      const autoClient: Client = {
        id: newClientId,
        name: newVehicle.ownerName,
        phone: newVehicle.ownerPhone,
        vehicles: [{
          plate: newVehicle.plate,
          brand: newVehicle.brand,
          year: ''
        }]
      };
      updatedClients = [autoClient, ...updatedClients];
    }

    setState((prev: any) => ({
      ...prev,
      clients: updatedClients,
      patio: [vehicleWithId, ...prev.patio]
    }));
  };

  const handleUpdatePatioStatus = (id: string, status: PatioVehicle['status'], notes?: string) => {
    setState((prev: any) => ({
      ...prev,
      patio: prev.patio.map((v: PatioVehicle) => {
        if (v.id === id) {
          const updated: Partial<PatioVehicle> = { status };
          if (notes !== undefined) updated.notes = notes;
          if (status === 'Entregue') {
            updated.exitDate = new Date().toISOString();
          }
          return { ...v, ...updated };
        }
        return v;
      })
    }));
  };

  const handleRemovePatioVehicle = (id: string) => {
    setState((prev: any) => ({
      ...prev,
      patio: prev.patio.filter((v: PatioVehicle) => v.id !== id)
    }));
  };

  // Inventory/Product Actions
  const handleAddProduct = (newProduct: Omit<Product, 'id'>) => {
    const id = `prod-${Date.now()}`;
    const productWithId: Product = { ...newProduct, id };
    setState((prev: any) => ({
      ...prev,
      products: [productWithId, ...prev.products]
    }));
  };

  const handleUpdateProduct = (id: string, updated: Partial<Product>) => {
    setState((prev: any) => ({
      ...prev,
      products: prev.products.map((p: Product) => p.id === id ? { ...p, ...updated } : p)
    }));
  };

  const handleRemoveProduct = (id: string) => {
    setState((prev: any) => ({
      ...prev,
      products: prev.products.filter((p: Product) => p.id !== id)
    }));
  };

  const handleRecordStockMovement = (productId: string, type: 'IN' | 'OUT', quantity: number, reason: string) => {
    const matchedProduct = state.products.find((p: Product) => p.id === productId);
    if (!matchedProduct) return;

    const movementId = `mv-${Date.now()}`;
    const newMovement: StockMovement = {
      id: movementId,
      productId,
      productName: matchedProduct.name,
      type,
      quantity,
      reason,
      date: new Date().toISOString()
    };

    const newStock = type === 'IN' 
      ? matchedProduct.stock + quantity 
      : Math.max(0, matchedProduct.stock - quantity);

    // If type is IN, it's a purchase/cost. If it's manual adjustment, we also adjust cash register if they bought parts
    let updatedCashAmount = state.cashRegister.currentAmount;
    let updatedTransactions = [...state.transactions];

    if (type === 'IN' && reason.toLowerCase().includes('compra')) {
      const totalCost = matchedProduct.costPrice * quantity;
      updatedCashAmount = Math.max(0, updatedCashAmount - totalCost);
      
      const transactionId = `tx-${Date.now()}`;
      const newTx: FinancialTransaction = {
        id: transactionId,
        type: 'EXPENSE',
        category: 'Fornecedores',
        amount: totalCost,
        description: `Compra de estoque: ${quantity}x ${matchedProduct.name}`,
        date: new Date().toISOString(),
        paymentMethod: 'Pix'
      };
      updatedTransactions = [newTx, ...updatedTransactions];
    }

    setState((prev: any) => ({
      ...prev,
      products: prev.products.map((p: Product) => p.id === productId ? { ...p, stock: newStock } : p),
      transactions: updatedTransactions,
      cashRegister: {
        ...prev.cashRegister,
        currentAmount: updatedCashAmount
      },
      // Safely append movements to prevent crash
      movements: prev.movements ? [newMovement, ...prev.movements] : [newMovement]
    }));
  };

  // Services Catalog Actions
  const handleAddService = (newService: Omit<Service, 'id'>) => {
    const id = `serv-${Date.now()}`;
    const serviceWithId: Service = { ...newService, id };
    setState((prev: any) => ({
      ...prev,
      services: [serviceWithId, ...prev.services]
    }));
  };

  const handleUpdateService = (id: string, updated: Partial<Service>) => {
    setState((prev: any) => ({
      ...prev,
      services: prev.services.map((s: Service) => s.id === id ? { ...s, ...updated } : s)
    }));
  };

  const handleRemoveService = (id: string) => {
    setState((prev: any) => ({
      ...prev,
      services: prev.services.filter((s: Service) => s.id !== id)
    }));
  };

  // Service Order (OS) & Billing Engine
  const handleAddOS = (newOS: Omit<ServiceOrder, 'id' | 'entryDate'>) => {
    const nextIdNum = state.orders.length + 1;
    const id = `OS-${String(nextIdNum).padStart(4, '0')}`;
    const entryDate = new Date().toISOString();
    
    const osWithId: ServiceOrder = {
      ...newOS,
      id,
      entryDate
    };

    let updatedProducts = [...state.products];
    let updatedTransactions = [...state.transactions];
    let updatedCashAmount = state.cashRegister.currentAmount;

    // 1. If status is NOT 'Orçamento' (meaning it is Approved, Executing or Completed), deduct product stock
    if (newOS.status !== 'Orçamento') {
      newOS.items.forEach(item => {
        if (item.type === 'PRODUCT') {
          updatedProducts = updatedProducts.map(p => {
            if (p.id === item.id) {
              return { ...p, stock: Math.max(0, p.stock - item.quantity) };
            }
            return p;
          });
        }
      });
    }

    // 2. If status is 'Concluído' and paymentStatus is 'Pago', create financial INCOME transaction & update cash
    if (newOS.status === 'Concluído' && newOS.paymentStatus === 'Pago') {
      updatedCashAmount += newOS.totalAmount;
      const transactionId = `tx-${Date.now()}`;
      const newTx: FinancialTransaction = {
        id: transactionId,
        type: 'INCOME',
        category: 'Serviços',
        amount: newOS.totalAmount,
        description: `Faturamento OS ${id} - Cliente: ${newOS.clientName}`,
        date: new Date().toISOString(),
        paymentMethod: newOS.paymentMethod || 'Pix',
        referenceId: id
      };
      updatedTransactions = [newTx, ...updatedTransactions];

      // Automatically change patio vehicle status to "Pronto para Entrega" or "Entregue" if matching plate is in patio
      setState((prev: any) => ({
        ...prev,
        patio: prev.patio.map((v: PatioVehicle) => 
          v.plate === newOS.vehiclePlate && v.status !== 'Entregue' 
            ? { ...v, status: 'Pronto para Entrega' } 
            : v
        )
      }));
    }

    setState((prev: any) => ({
      ...prev,
      orders: [osWithId, ...prev.orders],
      products: updatedProducts,
      transactions: updatedTransactions,
      cashRegister: {
        ...prev.cashRegister,
        currentAmount: updatedCashAmount
      }
    }));
  };

  const handleUpdateOS = (id: string, updated: Partial<ServiceOrder>) => {
    const oldOS = state.orders.find((o: ServiceOrder) => o.id === id);
    if (!oldOS) return;

    const mergedOS = { ...oldOS, ...updated } as ServiceOrder;

    let updatedProducts = [...state.products];
    let updatedTransactions = [...state.transactions];
    let updatedCashAmount = state.cashRegister.currentAmount;

    // Stock control transition: If transition is from "Orçamento" to "Approved"/"Concluído", deduct stock
    if (oldOS.status === 'Orçamento' && mergedOS.status !== 'Orçamento') {
      mergedOS.items.forEach(item => {
        if (item.type === 'PRODUCT') {
          updatedProducts = updatedProducts.map(p => {
            if (p.id === item.id) {
              return { ...p, stock: Math.max(0, p.stock - item.quantity) };
            }
            return p;
          });
        }
      });
    }

    // Billing transition: If transition is from NOT completed/paid to completed AND paid
    const isNowPaidAndConcluded = 
      (oldOS.status !== 'Concluído' || oldOS.paymentStatus !== 'Pago') && 
      (mergedOS.status === 'Concluído' && mergedOS.paymentStatus === 'Pago');

    if (isNowPaidAndConcluded) {
      updatedCashAmount += mergedOS.totalAmount;
      const transactionId = `tx-${Date.now()}`;
      const newTx: FinancialTransaction = {
        id: transactionId,
        type: 'INCOME',
        category: 'Serviços',
        amount: mergedOS.totalAmount,
        description: `Faturamento OS ${id} - Cliente: ${mergedOS.clientName}`,
        date: new Date().toISOString(),
        paymentMethod: mergedOS.paymentMethod || 'Pix',
        referenceId: id
      };
      updatedTransactions = [newTx, ...updatedTransactions];
    }

    setState((prev: any) => ({
      ...prev,
      orders: prev.orders.map((o: ServiceOrder) => o.id === id ? mergedOS : o),
      products: updatedProducts,
      transactions: updatedTransactions,
      cashRegister: {
        ...prev.cashRegister,
        currentAmount: updatedCashAmount
      }
    }));
  };

  const handleRemoveOS = (id: string) => {
    setState((prev: any) => ({
      ...prev,
      orders: prev.orders.filter((o: ServiceOrder) => o.id !== id)
    }));
  };

  // Financial manual movements
  const handleAddTransaction = (newTx: Omit<FinancialTransaction, 'id' | 'date'>) => {
    const id = `tx-${Date.now()}`;
    const date = new Date().toISOString();
    const txWithId: FinancialTransaction = { ...newTx, id, date };

    const amountDiff = newTx.type === 'INCOME' ? newTx.amount : -newTx.amount;
    const newCashAmount = Math.max(0, state.cashRegister.currentAmount + amountDiff);

    setState((prev: any) => ({
      ...prev,
      transactions: [txWithId, ...prev.transactions],
      cashRegister: {
        ...prev.cashRegister,
        currentAmount: newCashAmount
      }
    }));
  };

  // Baixar pagamento "Pagar Outro Dia"
  const handleReceivePendingPayment = (orderId: string, paymentMethod: ServiceOrder['paymentMethod']) => {
    const matchedOrder = state.orders.find((o: ServiceOrder) => o.id === orderId);
    if (!matchedOrder) return;

    // 1. Mark OS paymentStatus as Paid
    const updatedOrders = state.orders.map((o: ServiceOrder) => 
      o.id === orderId 
        ? { ...o, paymentStatus: 'Pago' as const, paymentMethod } 
        : o
    );

    // 2. Add income transaction
    const transactionId = `tx-${Date.now()}`;
    const newTx: FinancialTransaction = {
      id: transactionId,
      type: 'INCOME',
      category: 'Serviços',
      amount: matchedOrder.totalAmount,
      description: `Quitação Pagar Outro Dia - OS ${orderId} - Cliente: ${matchedOrder.clientName}`,
      date: new Date().toISOString(),
      paymentMethod: paymentMethod || 'Pix',
      referenceId: orderId
    };

    const newCashAmount = state.cashRegister.currentAmount + matchedOrder.totalAmount;

    setState((prev: any) => ({
      ...prev,
      orders: updatedOrders,
      transactions: [newTx, ...prev.transactions],
      cashRegister: {
        ...prev.cashRegister,
        currentAmount: newCashAmount
      }
    }));
    
    alert(`Pagamento da OS ${orderId} baixado com sucesso!`);
  };

  // Cash Register Operations
  const handleOpenRegister = (initialAmount: number) => {
    setState((prev: any) => ({
      ...prev,
      cashRegister: {
        isOpen: true,
        openedAt: new Date().toISOString(),
        initialAmount,
        currentAmount: initialAmount
      }
    }));
  };

  const handleCloseRegister = () => {
    setState((prev: any) => ({
      ...prev,
      cashRegister: {
        isOpen: false,
        closedAt: new Date().toISOString(),
        initialAmount: prev.cashRegister.initialAmount,
        currentAmount: prev.cashRegister.currentAmount
      }
    }));
  };

  // Data import / export & reset
  const handleImportData = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      setState(parsed);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `oficina360_backup_${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleResetData = () => {
    localStorage.removeItem('oficina_360_data_v2');
    const resetState = getInitialState();
    setState(resetState);
  };

  // Quick Action Handler from Dashboard
  const openQuickAction = (action: string) => {
    if (action === 'patio-entry') {
      setActiveTab('patio');
      setTimeout(() => {
        const entryBtn = document.querySelector('button'); // quick click
        // Since custom selectors instructions or focus modes might exist, navigating to the tab is already highly effective.
      }, 100);
    } else if (action === 'new-client') {
      setActiveTab('clients');
    } else if (action === 'new-os') {
      setActiveTab('orders');
    } else if (action === 'stock-entry') {
      setActiveTab('inventory');
    } else if (action === 'finance-entry') {
      setActiveTab('finance');
    }
  };

  // Search plate quick action
  const handleSearchPlate = (plate: string) => {
    setActiveTab('patio');
    // We could pass search plate parameters, but simply focusing on Patio lets them search
  };

  // Quick navigation select for Client For OS
  const handleSelectClientForOS = (client: Client, plate: string) => {
    setActiveOSForCreation({ client, plate });
    setActiveTab('orders');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans text-slate-800 antialiased selection:bg-blue-500 selection:text-white">
      
      {/* Mobile Top Navigation Bar */}
      <header className="md:hidden bg-slate-900 text-white px-5 py-4 flex items-center justify-between shadow-md print:hidden shrink-0">
        <div className="flex items-center gap-2">
          <Wrench className="h-6 w-6 text-blue-500 animate-spin-slow" />
          <span className="font-extrabold tracking-tight text-base">Oficina360</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-1 text-slate-300 hover:text-white focus:outline-none"
        >
          {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Sidebar - Collapsible on Mobile, Fixed on Desktop */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between transition-transform duration-300 transform md:translate-x-0 md:static shrink-0 print:hidden
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Top Header Logotype */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3 bg-slate-950">
          <Wrench className="h-7 w-7 text-blue-500 animate-spin-slow" />
          <div>
            <span className="font-extrabold text-white text-lg tracking-tight block">Oficina360</span>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block">Gestão Automotiva</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 flex-1 space-y-1.5 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'Painel Geral', icon: BookOpen },
            { id: 'patio', label: 'Controle de Pátio', icon: Car, badge: state.patio.filter((v: PatioVehicle) => v.status !== 'Entregue').length },
            { id: 'clients', label: 'Clientes & Veículos', icon: Users },
            { id: 'orders', label: 'Ordens de Serviço', icon: FileText, badge: state.orders.filter((o: ServiceOrder) => o.status === 'Orçamento').length },
            { id: 'inventory', label: 'Estoque Completo', icon: Package, badge: state.products.filter((p: Product) => p.stock <= p.minStock).length ? 'Estoque Baixo' : null },
            { id: 'services', label: 'Tabela de Serviços', icon: Wrench },
            { id: 'finance', label: 'Fluxo de Caixa', icon: DollarSign, badge: state.orders.filter((o: ServiceOrder) => o.paymentStatus === 'Pendente' && o.status === 'Concluído').length ? 'A Receber' : null },
            { id: 'backup', label: 'Backup / Ajustes', icon: ShieldCheck }
          ].map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-sm transition-all text-left cursor-pointer
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/10' 
                    : 'hover:bg-slate-800 text-slate-400 hover:text-white'}
                `}
              >
                <div className="flex items-center gap-3">
                  <IconComponent className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.id === 'inventory' || item.id === 'finance' 
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                      : isActive ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User profile bottom item */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
          <div className="min-w-0">
            <span className="font-bold text-white block truncate">Mecânica Central</span>
            <span className="text-slate-500 block">deusdeteg82@gmail.com</span>
          </div>
          <button 
            onClick={() => {
              if (confirm('Deseja sair do sistema?')) {
                alert('Atendimento encerrado.');
              }
            }}
            className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Sair do Sistema"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Overlay backdrop for Mobile Sidebar */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Main Panel Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full print:p-0 print:m-0 print:max-w-none">
        
        {/* Render Active Tab */}
        {activeTab === 'dashboard' && (
          <Dashboard
            clients={state.clients}
            patio={state.patio}
            orders={state.orders}
            transactions={state.transactions}
            cashRegister={state.cashRegister}
            setActiveTab={setActiveTab}
            openQuickAction={openQuickAction}
            onSearchPlate={handleSearchPlate}
          />
        )}

        {activeTab === 'patio' && (
          <Patio
            patio={state.patio}
            clients={state.clients}
            onAddPatioVehicle={handleAddPatioVehicle}
            onUpdatePatioStatus={handleUpdatePatioStatus}
            onRemovePatioVehicle={handleRemovePatioVehicle}
            onSelectClientForOS={handleSelectClientForOS}
          />
        )}

        {activeTab === 'clients' && (
          <Clients
            clients={state.clients}
            orders={state.orders}
            onAddClient={handleAddClient}
            onUpdateClient={handleUpdateClient}
            onRemoveClient={handleRemoveClient}
            onAddVehicle={handleAddVehicle}
            onRemoveVehicle={handleRemoveVehicle}
          />
        )}

        {activeTab === 'orders' && (
          <ServiceOrders
            orders={state.orders}
            clients={state.clients}
            products={state.products}
            services={state.services}
            activeOSForCreation={activeOSForCreation}
            onClearActiveOSForCreation={() => setActiveOSForCreation(null)}
            onAddOS={handleAddOS}
            onUpdateOS={handleUpdateOS}
            onRemoveOS={handleRemoveOS}
            onAddClient={handleAddClient}
          />
        )}

        {activeTab === 'inventory' && (
          <Inventory
            products={state.products}
            movements={state.movements || []}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onRemoveProduct={handleRemoveProduct}
            onRecordMovement={handleRecordStockMovement}
          />
        )}

        {activeTab === 'services' && (
          <Services
            services={state.services}
            onAddService={handleAddService}
            onUpdateService={handleUpdateService}
            onRemoveService={handleRemoveService}
          />
        )}

        {activeTab === 'finance' && (
          <Finance
            transactions={state.transactions}
            cashRegister={state.cashRegister}
            pendingOrders={state.orders.filter((o: ServiceOrder) => o.paymentStatus === 'Pendente' && o.status === 'Concluído')}
            onOpenRegister={handleOpenRegister}
            onCloseRegister={handleCloseRegister}
            onAddTransaction={handleAddTransaction}
            onReceivePendingPayment={handleReceivePendingPayment}
          />
        )}

        {activeTab === 'backup' && (
          <Backup
            onImportData={handleImportData}
            onExportData={handleExportData}
            onResetData={handleResetData}
          />
        )}
      </main>
    </div>
  );
}
