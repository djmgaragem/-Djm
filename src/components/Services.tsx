import React, { useState } from 'react';
import { 
  Wrench, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  DollarSign, 
  Activity 
} from 'lucide-react';
import { Service } from '../types';

interface ServicesProps {
  services: Service[];
  onAddService: (service: Omit<Service, 'id'>) => void;
  onUpdateService: (id: string, updated: Partial<Service>) => void;
  onRemoveService: (id: string) => void;
}

export default function Services({
  services,
  onAddService,
  onUpdateService,
  onRemoveService
}: ServicesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  
  // New Service Form
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [description, setDescription] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || price <= 0) {
      alert('Nome do serviço e valor do preço de venda sugerido são obrigatórios.');
      return;
    }

    onAddService({
      name: name.trim(),
      price: Number(price),
      description: description.trim()
    });

    // Reset
    setName('');
    setPrice(0);
    setDescription('');
    setShowAddModal(false);
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Wrench className="h-7 w-7 text-blue-600 animate-spin-slow" />
            Cartela de Serviços (Mão de Obra)
          </h1>
          <p className="text-slate-500 text-sm">Gerencie o portfólio de serviços de manutenção e tabela de preços da oficina.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0"
        >
          <Plus className="h-5 w-5" />
          Cadastrar Novo Serviço
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar por serviço ou descrição da mão de obra..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-xs"
        />
        <Search className="absolute left-4 top-3.5 text-slate-400 h-5 w-5" />
      </div>

      {/* Grid of Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredServices.length === 0 ? (
          <div className="bg-white py-12 text-center border border-slate-200 rounded-2xl col-span-full">
            <Wrench className="h-12 w-12 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 font-medium">Nenhum serviço catalogado ou encontrado.</p>
          </div>
        ) : (
          filteredServices.map((service) => (
            <div key={service.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-800 text-base leading-snug">{service.name}</h3>
                  <button
                    onClick={() => {
                      if (confirm(`Tem certeza de que deseja deletar o serviço "${service.name}"?`)) {
                        onRemoveService(service.id);
                      }
                    }}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                    title="Deletar serviço"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                {service.description && (
                  <p className="text-slate-500 text-xs mt-2 line-clamp-3 leading-relaxed">
                    {service.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4">
                <span className="text-xs text-slate-400 font-medium uppercase">Valor Mão de Obra</span>
                <span className="text-lg font-extrabold text-blue-600 font-sans">
                  R$ {service.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal - Cadastrar Serviço */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="h-5.5 w-5.5 text-blue-600 animate-spin-slow" />
                Novo Serviço no Catálogo
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
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nome do Serviço *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Alinhamento 3D e Balanceamento"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Preço de Venda Sugerido (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Descrição do Serviço</label>
                <textarea
                  rows={3}
                  placeholder="Descreva detalhes como ferramentas necessárias, itens avaliados ou escopo do serviço."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  Cadastrar Serviço
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
