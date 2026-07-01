import React, { useState } from 'react';
import { 
  DollarSign, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  Briefcase, 
  TrendingUp, 
  Lock, 
  Unlock, 
  FileText, 
  CheckCircle,
  HelpCircle,
  Activity
} from 'lucide-react';
import { FinancialTransaction, CashRegister, ServiceOrder } from '../types';

interface FinanceProps {
  transactions: FinancialTransaction[];
  cashRegister: CashRegister;
  pendingOrders: ServiceOrder[];
  onOpenRegister: (initialAmount: number) => void;
  onCloseRegister: () => void;
  onAddTransaction: (tx: Omit<FinancialTransaction, 'id' | 'date'>) => void;
  onReceivePendingPayment: (orderId: string, paymentMethod: ServiceOrder['paymentMethod']) => void;
}

export default function Finance({
  transactions,
  cashRegister,
  pendingOrders,
  onOpenRegister,
  onCloseRegister,
  onAddTransaction,
  onReceivePendingPayment
}: FinanceProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedPendingOS, setSelectedPendingOS] = useState<ServiceOrder | null>(null);

  // Form Fields
  const [txType, setTxType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [category, setCategory] = useState('Serviços');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Pix');

  // Open Register Form
  const [initialFloat, setInitialFloat] = useState<number>(100);

  // Receive Form
  const [receiveMethod, setReceiveMethod] = useState<'Pix' | 'Débito' | 'Crédito'>('Pix');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !description) {
      alert('Valor e Descrição são obrigatórios.');
      return;
    }

    onAddTransaction({
      type: txType,
      category,
      amount: Number(amount),
      description: description.trim(),
      paymentMethod
    });

    setAmount(0);
    setDescription('');
    setShowAddModal(false);
  };

  const handleOpenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenRegister(Number(initialFloat));
    setShowOpenModal(false);
  };

  const handleReceiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPendingOS) {
      onReceivePendingPayment(selectedPendingOS.id, receiveMethod);
      setShowReceiveModal(false);
      setSelectedPendingOS(null);
    }
  };

  // Summary Metrics
  const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const totalReceivable = pendingOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <DollarSign className="h-7 w-7 text-blue-600" />
            Controle Financeiro & Caixa
          </h1>
          <p className="text-slate-500 text-sm">Gerencie o saldo em caixa, despesas, faturamento e contas a receber pendentes.</p>
        </div>
        <div className="flex gap-2">
          {cashRegister.isOpen ? (
            <button
              onClick={() => {
                if (confirm('Deseja realmente FECHAR o caixa hoje? Isso registrará o fechamento.')) {
                  onCloseRegister();
                }
              }}
              className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm transition-colors cursor-pointer"
            >
              <Lock className="h-4.5 w-4.5" />
              Fechar Caixa
            </button>
          ) : (
            <button
              onClick={() => setShowOpenModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm transition-colors cursor-pointer"
            >
              <Unlock className="h-4.5 w-4.5" />
              Abrir Caixa
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm transition-colors cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            Nova Transação
          </button>
        </div>
      </div>

      {/* Cash register overview banner */}
      <div className={`p-6 rounded-2xl border ${
        cashRegister.isOpen ? 'bg-gradient-to-r from-emerald-800 to-teal-900 border-emerald-700/50' : 'bg-gradient-to-r from-slate-800 to-slate-900 border-slate-700/50'
      } text-white shadow-sm`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
              cashRegister.isOpen ? 'bg-emerald-100/20 text-emerald-200 border border-emerald-500/30' : 'bg-slate-700 text-slate-300'
            }`}>
              CAIXA {cashRegister.isOpen ? 'ABERTO EM EXECUÇÃO' : 'FECHADO'}
            </span>
            <p className="text-slate-200 text-xs">
              {cashRegister.isOpen && cashRegister.openedAt 
                ? `Iniciado em: ${new Date(cashRegister.openedAt).toLocaleDateString('pt-BR')} às ${new Date(cashRegister.openedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                : 'Caixa fechado. Abra para começar as vendas de hoje.'}
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight">
              R$ {cashRegister.currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h2>
            <p className="text-slate-300 text-xs">Saldo físico atualizado em tempo real.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center md:border-l md:border-white/15 md:pl-8">
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-slate-300 text-[10px] uppercase font-bold tracking-wider">Troco Inicial</span>
              <p className="text-lg font-bold mt-1">
                R$ {cashRegister.initialAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-slate-300 text-[10px] uppercase font-bold tracking-wider">Previsão Entradas</span>
              <p className="text-lg font-bold mt-1 text-emerald-300">
                +R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main KPI metrics grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-400 font-semibold uppercase">Total Receitas</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1 flex items-center">
            <ArrowUpRight className="h-6 w-6 text-emerald-500 mr-1 shrink-0" />
            R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-400 mt-1">Vendas de peças e mão de obra</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-400 font-semibold uppercase">Total Despesas</span>
          <div className="text-2xl font-bold text-rose-600 mt-1 flex items-center">
            <ArrowDownRight className="h-6 w-6 text-rose-500 mr-1 shrink-0" />
            R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-400 mt-1">Peças fornecedores, despesas fixas</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-400 font-semibold uppercase">Saldo Acumulado</span>
          <div className="text-2xl font-bold text-slate-800 mt-1 flex items-center">
            <TrendingUp className="h-5.5 w-5.5 text-blue-500 mr-1.5 shrink-0" />
            R$ {netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-400 mt-1">Lucratividade líquida geral</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns: Transactions List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
            <Activity className="h-5 w-5 text-blue-600" />
            Fluxo de Caixa Recente (Histórico)
          </h2>
          
          <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
            {transactions.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-12">Nenhuma transação lançada.</p>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between hover:bg-slate-100/50 transition-colors">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-xs sm:text-sm truncate">{tx.description}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-slate-400 font-medium">
                      <span>{new Date(tx.date).toLocaleDateString('pt-BR')} • {new Date(tx.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>•</span>
                      <span className="bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded">{tx.category}</span>
                      {tx.paymentMethod && (
                        <>
                          <span>•</span>
                          <span>{tx.paymentMethod}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className={`text-xs sm:text-sm font-extrabold shrink-0 ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'} R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Contas a Receber ("Pagar Outro Dia") */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="h-5 w-5 text-purple-600" />
              Contas a Receber (Pagar Outro Dia)
            </h2>
            <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 text-xs text-purple-900 font-semibold flex items-center justify-between">
              <span>A Receber Acumulado:</span>
              <span className="text-sm font-extrabold font-sans">
                R$ {totalReceivable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
              {pendingOrders.length === 0 ? (
                <p className="text-slate-400 text-xs text-center py-8">Nenhum pagamento pendente no "Pagar outro dia".</p>
              ) : (
                pendingOrders.map((o) => (
                  <div key={o.id} className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-800 block leading-snug">{o.clientName}</span>
                        <span className="text-[10px] text-slate-400">OS {o.id} • Placa: {o.vehiclePlate}</span>
                      </div>
                      <span className="font-extrabold text-purple-700 font-sans">
                        R$ {o.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          setSelectedPendingOS(o);
                          setReceiveMethod('Pix');
                          setShowReceiveModal(true);
                        }}
                        className="bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold px-2 py-1 rounded text-[10px] transition-colors cursor-pointer"
                      >
                        Baixar Pagamento
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal - Nova Transação Manual */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
                <DollarSign className="h-5 w-5 text-blue-600" />
                Lançar Movimento de Caixa
              </h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold cursor-pointer"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Tipo de Movimento *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setTxType('INCOME'); setCategory('Serviços'); }}
                    className={`p-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      txType === 'INCOME' 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800' 
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    Entrada / Receita
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTxType('EXPENSE'); setCategory('Fornecedores'); }}
                    className={`p-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      txType === 'EXPENSE' 
                        ? 'bg-rose-50 border-rose-500 text-rose-800' 
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <ArrowDownRight className="h-4 w-4" />
                    Saída / Despesa
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {txType === 'INCOME' ? (
                      <>
                        <option value="Serviços">Serviços</option>
                        <option value="Peças">Venda de Peças</option>
                        <option value="Outros">Ajustes / Outros</option>
                      </>
                    ) : (
                      <>
                        <option value="Fornecedores">Fornecedores (Peças)</option>
                        <option value="Infraestrutura">Infraestrutura (Luz/Água)</option>
                        <option value="Aluguel">Aluguel / IPVA / Oficina</option>
                        <option value="Salários">Salários / Comissões</option>
                        <option value="Outros">Ajustes / Outros</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Forma de Pag.</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                  >
                    <option value="Pix">Pix</option>
                    <option value="Débito">Débito</option>
                    <option value="Crédito">Crédito</option>
                    <option value="Dinheiro">Dinheiro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Valor do Lançamento (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Descrição do Movimento *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Compra de filtro de óleo Bosch, Aluguel do mês..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl cursor-pointer"
                >
                  Confirmar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Abrir Caixa */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <Unlock className="h-5 w-5 text-emerald-600" />
                Abertura do Caixa Diário
              </h2>
              <button 
                onClick={() => setShowOpenModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold cursor-pointer"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleOpenSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Troco / Valor Inicial em Caixa (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={initialFloat}
                  onChange={(e) => setInitialFloat(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-400 block mt-1">Este é o valor físico para dar troco disponível na gaveta.</span>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => setShowOpenModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl cursor-pointer"
                >
                  Abrir Caixa Agora
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Baixar Pagamento "Pagar Outro Dia" */}
      {showReceiveModal && selectedPendingOS && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-base font-bold text-slate-900">
                Dar Baixa de Pagamento
              </h2>
              <button 
                onClick={() => setShowReceiveModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold cursor-pointer"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleReceiveSubmit} className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-500">Registrar recebimento de valor referente à pendência:</p>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mt-2">
                  <span className="font-bold text-slate-700 block">{selectedPendingOS.clientName}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">OS: {selectedPendingOS.id} | Placa: {selectedPendingOS.vehiclePlate}</span>
                  <span className="text-sm font-extrabold text-slate-900 block mt-1.5">
                    Valor: R$ {selectedPendingOS.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Método de Quitação *</label>
                <select
                  value={receiveMethod}
                  onChange={(e) => setReceiveMethod(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Pix">Pix</option>
                  <option value="Débito">Débito</option>
                  <option value="Crédito">Crédito</option>
                  <option value="Dinheiro">Dinheiro</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => setShowReceiveModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl cursor-pointer"
                >
                  Confirmar Quitação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
