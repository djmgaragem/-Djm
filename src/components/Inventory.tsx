import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertTriangle, 
  TrendingUp, 
  History, 
  Trash2,
  ListFilter
} from 'lucide-react';
import { Product, StockMovement } from '../types';

interface InventoryProps {
  products: Product[];
  movements: StockMovement[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (id: string, updated: Partial<Product>) => void;
  onRemoveProduct: (id: string) => void;
  onRecordMovement: (productId: string, type: 'IN' | 'OUT', quantity: number, reason: string) => void;
}

export default function Inventory({
  products,
  movements,
  onAddProduct,
  onUpdateProduct,
  onRemoveProduct,
  onRecordMovement
}: InventoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low'>('all');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // New Product Form
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(2);

  // Movement Form
  const [moveType, setMoveType] = useState<'IN' | 'OUT'>('IN');
  const [moveQty, setMoveQty] = useState<number>(1);
  const [moveReason, setMoveReason] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) {
      alert('Nome e Código do produto são obrigatórios.');
      return;
    }

    onAddProduct({
      name: name.trim(),
      code: code.toUpperCase().trim(),
      category: category.trim() || 'Sem Categoria',
      costPrice: Number(costPrice),
      sellPrice: Number(sellPrice),
      stock: Number(stock),
      minStock: Number(minStock)
    });

    // Reset fields
    setName('');
    setCode('');
    setCategory('');
    setCostPrice(0);
    setSellPrice(0);
    setStock(0);
    setMinStock(2);
    setShowAddModal(false);
  };

  const openMovementModal = (product: Product, type: 'IN' | 'OUT') => {
    setSelectedProduct(product);
    setMoveType(type);
    setMoveQty(1);
    setMoveReason(type === 'IN' ? 'Entrada manual para ajuste/compra' : 'Saída manual por descarte/perda');
    setShowMovementModal(true);
  };

  const handleMovementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || moveQty <= 0) {
      alert('Quantidade inválida.');
      return;
    }

    if (moveType === 'OUT' && selectedProduct.stock < moveQty) {
      alert('Quantidade de saída não pode ser maior que o estoque atual.');
      return;
    }

    onRecordMovement(selectedProduct.id, moveType, moveQty, moveReason);
    setShowMovementModal(false);
    setSelectedProduct(null);
  };

  // Get unique categories
  const categories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.code.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStock = stockFilter === 'all' || product.stock <= product.minStock;

    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="h-7 w-7 text-blue-600" />
            Controle de Estoque
          </h1>
          <p className="text-slate-500 text-sm">Controle de peças, lubrificantes, margens de lucro e alertas de estoque baixo.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0"
        >
          <Plus className="h-5 w-5" />
          Novo Produto / Peça
        </button>
      </div>

      {/* Stats Cards of Stock */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg shrink-0">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Total de Itens</p>
            <p className="text-xl font-bold text-slate-800">{products.length} cadastrados</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg shrink-0">
            <AlertTriangle className="h-6 w-6 text-rose-500" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Estoque Crítico</p>
            <p className="text-xl font-bold text-slate-800">
              {products.filter(p => p.stock <= p.minStock).length} abaixo do mínimo
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
            <TrendingUp className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Valor de Venda Total</p>
            <p className="text-xl font-bold text-slate-800 font-sans">
              R$ {products.reduce((acc, p) => acc + (p.sellPrice * p.stock), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por nome ou código da peça..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <Search className="absolute left-3 top-2.5 text-slate-400 h-4.5 w-4.5" />
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Category Filter */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 text-sm text-slate-700">
            <ListFilter className="h-4 w-4 text-slate-400 mr-1.5" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent py-1.5 pr-2 focus:outline-none cursor-pointer font-medium"
            >
              <option value="all">Todas Categorias</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Stock Filter (All vs Critical) */}
          <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs font-semibold text-slate-600">
            <button
              onClick={() => setStockFilter('all')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                stockFilter === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setStockFilter('low')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                stockFilter === 'low' ? 'bg-rose-50 text-rose-700 font-bold' : 'hover:text-slate-900'
              }`}
            >
              Baixo Estoque
            </button>
          </div>
        </div>
      </div>

      {/* Grid List or Table of Products */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="p-4 pl-6">Código / Peça</th>
                <th className="p-4">Categoria</th>
                <th className="p-4 text-right">Preço Custo</th>
                <th className="p-4 text-right">Preço Venda</th>
                <th className="p-4 text-right">Margem / Lucro</th>
                <th className="p-4 text-center">Quantidade</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Nenhuma peça encontrada com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const profit = p.sellPrice - p.costPrice;
                  const margin = p.costPrice > 0 ? (profit / p.costPrice) * 100 : 0;
                  const isLow = p.stock <= p.minStock;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="font-mono text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded inline-block">
                          {p.code}
                        </div>
                        <div className="font-semibold text-slate-800 mt-1">{p.name}</div>
                      </td>
                      <td className="p-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-medium">
                          {p.category}
                        </span>
                      </td>
                      <td className="p-4 text-right text-slate-600">
                        R$ {p.costPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-right text-slate-800 font-semibold">
                        R$ {p.sellPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-emerald-600 font-medium">R$ {profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <span className="text-slate-400 text-xs block mt-0.5">({margin.toFixed(0)}% mrg)</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-full text-xs ${
                          isLow 
                            ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse' 
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {p.stock} un.
                          {isLow && <AlertTriangle className="h-3 w-3 text-rose-600 shrink-0" />}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-1">mín: {p.minStock}</span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openMovementModal(p, 'IN')}
                            className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-800 font-bold px-2 py-1 rounded text-xs transition-colors cursor-pointer"
                            title="Dar entrada no estoque"
                          >
                            + Entrada
                          </button>
                          <button
                            onClick={() => openMovementModal(p, 'OUT')}
                            className="bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-800 font-bold px-2 py-1 rounded text-xs transition-colors cursor-pointer"
                            title="Dar saída (perda/ajuste)"
                          >
                            - Saída
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Deseja realmente deletar a peça "${p.name}"?`)) {
                                onRemoveProduct(p.id);
                              }
                            }}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Excluir produto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Movements Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <History className="h-4.5 w-4.5 text-slate-500" />
          Histórico de Movimentações de Estoque
        </h2>
        {movements.length === 0 ? (
          <p className="text-slate-400 text-xs text-center py-6">Nenhuma movimentação de estoque registrada.</p>
        ) : (
          <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1">
            {movements.slice(0, 15).map((m) => (
              <div key={m.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                <div className="min-w-0">
                  <span className={`inline-flex items-center gap-0.5 px-2 py-0.2 rounded-md font-bold text-[10px] mr-2 ${
                    m.type === 'IN' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {m.type === 'IN' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {m.type === 'IN' ? 'ENTRADA' : 'SAÍDA'}
                  </span>
                  <span className="font-semibold text-slate-800">{m.productName}</span>
                  <span className="text-slate-500 ml-1">({m.reason})</span>
                </div>
                <div className="flex items-center gap-4 text-right shrink-0">
                  <span className="font-bold text-slate-900">{m.quantity} un.</span>
                  <span className="text-slate-400 text-[10px]">
                    {new Date(m.date).toLocaleDateString('pt-BR')} às {new Date(m.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal - Cadastrar Produto */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-200 overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Package className="h-5.5 w-5.5 text-blue-600" />
                Novo Produto / Peça de Estoque
              </h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold cursor-pointer"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Código de Referência *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: PAST-82"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Categoria</label>
                  <input
                    type="text"
                    placeholder="Ex: Lubrificantes, Freios..."
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nome da Peça / Produto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Óleo Selènia 5W30 1L"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Preço de Custo (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Preço de Venda (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={sellPrice}
                    onChange={(e) => setSellPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Quantidade em Estoque Inicial</label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Estoque Mínimo Alerta</label>
                  <input
                    type="number"
                    min="1"
                    value={minStock}
                    onChange={(e) => setMinStock(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
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
                  Confirmar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Movimentar Estoque */}
      {showMovementModal && selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-base font-bold text-slate-900">
                Registrar {moveType === 'IN' ? 'Entrada' : 'Saída'} manual: {selectedProduct.name}
              </h2>
              <button 
                onClick={() => setShowMovementModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold cursor-pointer"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleMovementSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Quantidade ({moveType === 'IN' ? 'Adicionar' : 'Remover'}) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={moveQty}
                  onChange={(e) => setMoveQty(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-400 block mt-1">Estoque atual: {selectedProduct.stock} un.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Motivo / Observação *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Compra com fornecedor X, perda por validade, etc."
                  value={moveReason}
                  onChange={(e) => setMoveReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-xs font-semibold text-white rounded-xl cursor-pointer ${
                    moveType === 'IN' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  Registrar {moveType === 'IN' ? 'Entrada' : 'Saída'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
