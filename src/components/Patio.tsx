import React, { useState } from 'react';
import { 
  Car, 
  Plus, 
  Search, 
  Clock, 
  ArrowRightLeft, 
  Trash2, 
  Phone,
  FileText
} from 'lucide-react';
import { PatioVehicle, Client } from '../types';

interface PatioProps {
  patio: PatioVehicle[];
  clients: Client[];
  onAddPatioVehicle: (vehicle: Omit<PatioVehicle, 'id' | 'entryDate'>) => void;
  onUpdatePatioStatus: (id: string, status: PatioVehicle['status'], notes?: string) => void;
  onRemovePatioVehicle: (id: string) => void;
  onSelectClientForOS?: (client: Client, plate: string) => void;
}

export default function Patio({
  patio,
  clients,
  onAddPatioVehicle,
  onUpdatePatioStatus,
  onRemovePatioVehicle,
  onSelectClientForOS
}: PatioProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<PatioVehicle | null>(null);
  
  // Form fields for new vehicle entry
  const [plate, setPlate] = useState('');
  const [brand, setBrand] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [notes, setNotes] = useState('');
  
  // Status modal edits
  const [editStatus, setEditStatus] = useState<PatioVehicle['status']>('Aguardando Diagnóstico');
  const [editNotes, setEditNotes] = useState('');

  // Handle Select Existing Client for autofill
  const handleSelectClient = (client: Client) => {
    setOwnerName(client.name);
    setOwnerPhone(client.phone);
    if (client.vehicles.length > 0) {
      setPlate(client.vehicles[0].plate);
      setBrand(client.vehicles[0].brand);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate) {
      alert('Por favor informe a placa do veículo.');
      return;
    }
    onAddPatioVehicle({
      plate: plate.toUpperCase().trim(),
      brand: brand.trim() || 'Veículo',
      ownerName: ownerName.trim() || 'Cliente Avulso',
      ownerPhone: ownerPhone.trim(),
      status: 'Aguardando Diagnóstico',
      notes: notes.trim()
    });

    // Reset and close
    setPlate('');
    setBrand('');
    setOwnerName('');
    setOwnerPhone('');
    setNotes('');
    setShowAddModal(false);
  };

  const openStatusEdit = (v: PatioVehicle) => {
    setSelectedVehicle(v);
    setEditStatus(v.status);
    setEditNotes(v.notes);
    setShowStatusModal(true);
  };

  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVehicle) {
      onUpdatePatioStatus(selectedVehicle.id, editStatus, editNotes);
      setShowStatusModal(false);
      setSelectedVehicle(null);
    }
  };

  // Filter patio vehicles
  const filteredVehicles = patio.filter(vehicle => {
    const matchesSearch = 
      vehicle.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.ownerName.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' 
      ? vehicle.status !== 'Entregue' // default to active vehicles
      : statusFilter === 'Histórico' 
        ? vehicle.status === 'Entregue'
        : vehicle.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Car className="h-7 w-7 text-blue-600" />
            Controle de Pátio
          </h1>
          <p className="text-slate-500 text-sm">Gerencie o fluxo de entrada, manutenção e entrega de veículos.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0"
        >
          <Plus className="h-5 w-5" />
          Dar Entrada no Pátio
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por placa, marca ou cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <Search className="absolute left-3 top-2.5 text-slate-400 h-4.5 w-4.5" />
        </div>
        
        {/* Filter buttons */}
        <div className="flex overflow-x-auto gap-1.5 pb-1 md:pb-0 scrollbar-none">
          {[
            { label: 'Ativos', val: 'all' },
            { label: 'Aguardando', val: 'Aguardando Diagnóstico' },
            { label: 'Em Manutenção', val: 'Em Manutenção' },
            { label: 'Pronto p/ Entrega', val: 'Pronto para Entrega' },
            { label: 'Entregues (Histórico)', val: 'Histórico' }
          ].map((btn) => (
            <button
              key={btn.val}
              onClick={() => setStatusFilter(btn.val)}
              className={`text-xs px-3 py-2 rounded-lg font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                statusFilter === btn.val
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Vehicles */}
      {filteredVehicles.length === 0 ? (
        <div className="bg-white py-16 text-center border border-slate-200 rounded-2xl">
          <Car className="h-16 w-16 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium text-lg">Nenhum veículo encontrado</p>
          <p className="text-slate-400 text-sm mt-1">Experimente alterar os filtros ou registrar um novo veículo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVehicles.map((vehicle) => (
            <div 
              key={vehicle.id} 
              className={`bg-white rounded-2xl border ${
                vehicle.status === 'Pronto para Entrega' ? 'border-emerald-200 shadow-emerald-50/50' : 'border-slate-200/80'
              } shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between`}
            >
              {/* Card Header */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="font-mono bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-md font-bold tracking-wider border border-blue-200">
                      {vehicle.plate}
                    </span>
                    <h3 className="font-bold text-slate-800 text-base pt-1.5 leading-snug">
                      {vehicle.brand}
                    </h3>
                  </div>
                  
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                    vehicle.status === 'Aguardando Diagnóstico' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                    vehicle.status === 'Em Manutenção' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                    vehicle.status === 'Pronto para Entrega' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                    'bg-slate-100 text-slate-800 border-slate-200'
                  }`}>
                    {vehicle.status}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 space-y-4">
                {/* Client info */}
                <div className="text-sm">
                  <span className="text-slate-400 text-xs uppercase font-semibold">Cliente Proprietário</span>
                  <div className="font-semibold text-slate-800 flex items-center justify-between mt-0.5">
                    <span>{vehicle.ownerName}</span>
                    {vehicle.ownerPhone && (
                      <a 
                        href={`https://wa.me/55${vehicle.ownerPhone.replace(/\D/g, '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 text-xs"
                      >
                        <Phone className="h-3 w-3 fill-emerald-600" />
                        {vehicle.ownerPhone}
                      </a>
                    )}
                  </div>
                </div>

                {/* Entry Date & Duration */}
                <div className="flex justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    Entrada: {new Date(vehicle.entryDate).toLocaleDateString('pt-BR')} às {new Date(vehicle.entryDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {vehicle.exitDate && (
                    <span className="flex items-center gap-1">
                      Saída: {new Date(vehicle.exitDate).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>

                {/* Problems/Notes */}
                {vehicle.notes && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600">
                    <span className="font-semibold text-slate-700 block mb-1">Notas / Reclamação:</span>
                    <p className="line-clamp-2">{vehicle.notes}</p>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0">
                <button
                  onClick={() => openStatusEdit(vehicle)}
                  className="text-xs bg-white text-slate-700 hover:text-blue-600 border border-slate-200 hover:border-blue-300 font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ArrowRightLeft className="h-3 w-3" />
                  Mudar Status
                </button>

                {vehicle.status !== 'Entregue' && onSelectClientForOS && (
                  <button
                    onClick={() => {
                      const matchedClient = clients.find(c => c.name.toLowerCase() === vehicle.ownerName.toLowerCase() || c.phone === vehicle.ownerPhone);
                      const fallbackClient: Client = matchedClient || {
                        id: 'quick-new',
                        name: vehicle.ownerName,
                        phone: vehicle.ownerPhone,
                        vehicles: [{ plate: vehicle.plate, brand: vehicle.brand, year: '' }]
                      };
                      onSelectClientForOS(fallbackClient, vehicle.plate);
                    }}
                    className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 hover:border-blue-200 font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <FileText className="h-3 w-3" />
                    Gerar OS/Orçamento
                  </button>
                )}

                <button
                  onClick={() => {
                    if (confirm('Tem certeza de que deseja remover este veículo do pátio?')) {
                      onRemovePatioVehicle(vehicle.id);
                    }
                  }}
                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Excluir Registro"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal - Entrada no Pátio */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-200 overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Car className="h-5.5 w-5.5 text-blue-600" />
                Nova Entrada de Veículo
              </h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold cursor-pointer"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {/* Optional Client Autofill Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Vincular Cliente Cadastrado (Opcional)</label>
                <select
                  onChange={(e) => {
                    const client = clients.find(c => c.id === e.target.value);
                    if (client) handleSelectClient(client);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Selecione para preencher dados do cliente --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Placa *</label>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    placeholder="ABC1D23"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Marca / Modelo</label>
                  <input
                    type="text"
                    placeholder="Fiat Uno, Corolla, Onix..."
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Proprietário (Nome)</label>
                  <input
                    type="text"
                    placeholder="Nome do cliente"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Celular</label>
                  <input
                    type="text"
                    placeholder="DDD + Número"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Observações / Reclamações</label>
                <textarea
                  rows={3}
                  placeholder="Barulho na suspensão, trocar óleo, vazamento de água..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors cursor-pointer"
                >
                  Registrar Entrada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Mudar Status */}
      {showStatusModal && selectedVehicle && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-base font-bold text-slate-900">
                Mudar Status: {selectedVehicle.plate}
              </h2>
              <button 
                onClick={() => setShowStatusModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold cursor-pointer"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleStatusSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Novo Status</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { label: 'Aguardando Diagnóstico', desc: 'Carro aguardando análise técnica', val: 'Aguardando Diagnóstico' },
                    { label: 'Em Manutenção', desc: 'Mecânico executando os serviços', val: 'Em Manutenção' },
                    { label: 'Pronto para Entrega', desc: 'Serviço concluído e pronto para retirada', val: 'Pronto para Entrega' },
                    { label: 'Dar Saída (Entregue)', desc: 'Carro retirado pelo cliente', val: 'Entregue' }
                  ].map((st) => (
                    <label 
                      key={st.val} 
                      className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                        editStatus === st.val 
                          ? 'border-blue-500 bg-blue-50/50 text-blue-900' 
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="status-radio"
                        value={st.val}
                        checked={editStatus === st.val}
                        onChange={() => setEditStatus(st.val as any)}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-bold text-xs">{st.label}</div>
                        <div className="text-[10px] text-slate-500">{st.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Notas / Diagnóstico Atual</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl cursor-pointer"
                >
                  Confirmar Alteração
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
