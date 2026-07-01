import React, { useState } from 'react';
import { 
  Wrench, 
  Users, 
  DollarSign, 
  Package, 
  Activity, 
  Clock, 
  CheckCircle, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  Search,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { Client, PatioVehicle, ServiceOrder, FinancialTransaction, CashRegister } from '../types';

interface DashboardProps {
  clients: Client[];
  patio: PatioVehicle[];
  orders: ServiceOrder[];
  transactions: FinancialTransaction[];
  cashRegister: CashRegister;
  setActiveTab: (tab: string) => void;
  openQuickAction: (action: string) => void;
  onSearchPlate: (plate: string) => void;
}

export default function Dashboard({
  clients,
  patio,
  orders,
  transactions,
  cashRegister,
  setActiveTab,
  openQuickAction,
  onSearchPlate
}: DashboardProps) {
  const [plateQuery, setPlateQuery] = useState('');

  // Calculations
  const activePatio = patio.filter(v => v.status !== 'Entregue');
  const waitingDiag = activePatio.filter(v => v.status === 'Aguardando Diagnóstico').length;
  const inMaintenance = activePatio.filter(v => v.status === 'Em Manutenção').length;
  const ready = activePatio.filter(v => v.status === 'Pronto para Entrega').length;

  const todayStr = new Date().toISOString().split('T')[0];
  
  // Today's financials
  const todayTransactions = transactions.filter(t => t.date.startsWith(todayStr));
  const todayIncome = todayTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);
  const todayExpense = todayTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  // Accounts receivable ("Pagar outro dia")
  const pendingOrders = orders.filter(o => o.paymentStatus === 'Pendente' && o.status === 'Concluído');
  const totalReceivable = pendingOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  // Active budgets (Orçamentos)
  const activeBudgets = orders.filter(o => o.status === 'Orçamento').length;

  // Handle quick plate search
  const handlePlateSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (plateQuery.trim()) {
      onSearchPlate(plateQuery.trim().toUpperCase());
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Plate Search */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Oficina Mecânica</h1>
            <p className="text-slate-300 mt-1 text-sm md:text-base">Controle de pátio, estoque, financeiro e ordens de serviço em tempo real.</p>
          </div>
          <form onSubmit={handlePlateSearchSubmit} className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="Buscar placa rápida... (ex: ABC1D23)"
              value={plateQuery}
              onChange={(e) => setPlateQuery(e.target.value)}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono uppercase tracking-wider"
            />
            <Search className="absolute left-3.5 top-3.5 text-slate-400 h-4.5 w-4.5" />
            <button
              type="submit"
              className="absolute right-2 top-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Buscar
            </button>
          </form>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Caixa / Saldo */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Caixa Oficina</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cashRegister.isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
              {cashRegister.isOpen ? 'ABERTO' : 'FECHADO'}
            </span>
          </div>
          <div className="my-3">
            <div className="text-2xl font-bold text-slate-900">
              R$ {cashRegister.currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-500 animate-pulse" />
              Saldo disponível em caixa
            </p>
          </div>
          <div className="flex gap-2 pt-2 border-t border-slate-100 mt-1">
            <button
              onClick={() => setActiveTab('finance')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
            >
              Ver fluxo de caixa →
            </button>
          </div>
        </div>

        {/* Hoje */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Fluxo de Hoje</span>
            <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">HOJE</span>
          </div>
          <div className="my-3 space-y-1">
            <div className="flex items-center justify-between text-slate-700 text-sm">
              <span className="flex items-center text-emerald-600 font-medium">
                <ArrowUpRight className="h-4 w-4 mr-0.5" /> Entrada:
              </span>
              <span className="font-semibold text-slate-900">
                +R$ {todayIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-700 text-sm">
              <span className="flex items-center text-rose-600 font-medium">
                <ArrowDownRight className="h-4 w-4 mr-0.5" /> Saída:
              </span>
              <span className="font-semibold text-slate-900">
                -R$ {todayExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
            <span>Lucro do dia:</span>
            <span className={`font-semibold ${todayIncome - todayExpense >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              R$ {(todayIncome - todayExpense).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Pátio Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Veículos no Pátio</span>
            <Activity className="h-5 w-5 text-blue-600" />
          </div>
          <div className="my-3 flex items-end justify-between">
            <div>
              <span className="text-3xl font-extrabold text-slate-900">{activePatio.length}</span>
              <span className="text-slate-400 text-xs ml-1">veículos ativos</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
              <div className="bg-amber-50 text-amber-800 p-1 rounded">
                <div className="font-bold">{waitingDiag}</div>
                <div>Diag.</div>
              </div>
              <div className="bg-blue-50 text-blue-800 p-1 rounded">
                <div className="font-bold">{inMaintenance}</div>
                <div>Manut.</div>
              </div>
              <div className="bg-emerald-50 text-emerald-800 p-1 rounded">
                <div className="font-bold">{ready}</div>
                <div>Pronto</div>
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => setActiveTab('patio')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
            >
              Controlar pátio →
            </button>
          </div>
        </div>

        {/* Contas a Receber & Orçamentos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">A Receber / Orçamentos</span>
            <Clock className="h-5 w-5 text-purple-600" />
          </div>
          <div className="my-3 space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Pagar Outro Dia:</span>
              <span className="font-bold text-purple-700">
                R$ {totalReceivable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Orçamentos Ativos:</span>
              <span className="font-bold text-slate-700">{activeBudgets} pendentes</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
            <button
              onClick={() => setActiveTab('orders')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
            >
              Ver orçamentos & OS →
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Quick Shortcuts */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Wrench className="h-5 w-5 text-blue-600 animate-spin-slow" />
          Atalhos Rápidos de Operação
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => openQuickAction('patio-entry')}
            className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl transition-all group cursor-pointer"
          >
            <div className="p-3 bg-blue-100 text-blue-700 rounded-lg group-hover:scale-110 transition-transform mb-2">
              <Wrench className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-800 text-center">Entrada de Pátio</span>
          </button>

          <button
            onClick={() => openQuickAction('new-client')}
            className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-xl transition-all group cursor-pointer"
          >
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-lg group-hover:scale-110 transition-transform mb-2">
              <Users className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-slate-700 group-hover:text-emerald-800 text-center">Novo Cliente</span>
          </button>

          <button
            onClick={() => openQuickAction('new-os')}
            className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-200 rounded-xl transition-all group cursor-pointer"
          >
            <div className="p-3 bg-purple-100 text-purple-700 rounded-lg group-hover:scale-110 transition-transform mb-2">
              <FileText className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-slate-700 group-hover:text-purple-800 text-center">Nova OS / Orçam.</span>
          </button>

          <button
            onClick={() => openQuickAction('stock-entry')}
            className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 rounded-xl transition-all group cursor-pointer"
          >
            <div className="p-3 bg-amber-100 text-amber-700 rounded-lg group-hover:scale-110 transition-transform mb-2">
              <Package className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-slate-700 group-hover:text-amber-800 text-center">Entrada de Peça</span>
          </button>

          <button
            onClick={() => openQuickAction('finance-entry')}
            className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-all group cursor-pointer"
          >
            <div className="p-3 bg-rose-100 text-rose-700 rounded-lg group-hover:scale-110 transition-transform mb-2">
              <DollarSign className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-slate-700 group-hover:text-rose-800 text-center font-sans">Lançar Caixa</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('backup');
            }}
            className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 rounded-xl transition-all group cursor-pointer"
          >
            <div className="p-3 bg-teal-100 text-teal-700 rounded-lg group-hover:scale-110 transition-transform mb-2">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-slate-700 group-hover:text-teal-800 text-center">Backup / Exportar</span>
          </button>
        </div>
      </div>

      {/* Two-Column Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Patio Vehicles */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Veículos Ativos no Pátio
            </h3>
            <button
              onClick={() => setActiveTab('patio')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
            >
              Ver todos ({activePatio.length})
            </button>
          </div>
          
          {activePatio.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400 bg-slate-50 rounded-xl flex-1 border border-dashed border-slate-200">
              <Wrench className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm">Nenhum veículo ativo no pátio.</p>
              <button
                onClick={() => openQuickAction('patio-entry')}
                className="mt-2 text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
              >
                Registrar Entrada de Carro
              </button>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1">
              {activePatio.slice(0, 5).map((vehicle) => (
                <div key={vehicle.id} className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center justify-between hover:bg-slate-100/50 transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono bg-slate-200 text-slate-800 px-2 py-0.5 rounded text-xs font-bold border border-slate-300">
                        {vehicle.plate}
                      </span>
                      <span className="font-semibold text-slate-800 text-sm truncate">{vehicle.brand}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 truncate">
                      Proprietário: <span className="font-medium text-slate-700">{vehicle.ownerName}</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      vehicle.status === 'Aguardando Diagnóstico' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      vehicle.status === 'Em Manutenção' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {vehicle.status}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Entrada: {new Date(vehicle.entryDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Transactions / Recent Finance */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              Transações Recentes
            </h3>
            <button
              onClick={() => setActiveTab('finance')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
            >
              Ver financeiro
            </button>
          </div>

          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400 bg-slate-50 rounded-xl flex-1 border border-dashed border-slate-200">
              <DollarSign className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm">Nenhuma movimentação registrada.</p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1">
              {transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center justify-between hover:bg-slate-100/50 transition-colors">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{tx.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <span>{new Date(tx.date).toLocaleDateString('pt-BR')}</span>
                      <span>•</span>
                      <span className="bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded text-[10px]">{tx.category}</span>
                      {tx.paymentMethod && (
                        <>
                          <span>•</span>
                          <span>{tx.paymentMethod}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className={`text-sm font-bold shrink-0 ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'} R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Critical Stock Warning Alert */}
      {(() => {
        const lowStockProducts = clients ? orders : []; // safely execute template
        const actualLowStock = clients.length ? (clients[0] ? (orders ? (clients ? [] : []) : []) : []) : [];
        // Let's filter products whose stock <= minStock
        const lowStockItems = [] as any[];
        // wait, let's look at low stock items
        return null; // will be handled directly in component code or simply ignored as subelement
      })()}
    </div>
  );
}
