import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Car, 
  Phone, 
  Mail, 
  FileText, 
  Trash2, 
  PlusCircle,
  X 
} from 'lucide-react';
import { Client, Vehicle, ServiceOrder } from '../types';

interface ClientsProps {
  clients: Client[];
  orders: ServiceOrder[];
  onAddClient: (client: Omit<Client, 'id'>) => void;
  onUpdateClient: (id: string, updated: Partial<Client>) => void;
  onRemoveClient: (id: string) => void;
  onAddVehicle: (clientId: string, vehicle: Vehicle) => void;
  onRemoveVehicle: (clientId: string, plate: string) => void;
}

export default function Clients({
  clients,
  orders,
  onAddClient,
  onUpdateClient,
  onRemoveClient,
  onAddVehicle,
  onRemoveVehicle
}: ClientsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // New Client Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Optional first vehicle
  const [hasVehicle, setHasVehicle] = useState(false);
  const [plate, setPlate] = useState('');
  const [brand, setBrand] = useState('');
  const [year, setYear] = useState('');

  // Add vehicle modal state
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [vPlate, setVPlate] = useState('');
  const [vBrand, setVBrand] = useState('');
  const [vYear, setVYear] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      alert('O nome do cliente é obrigatório.');
      return;
    }

    const vehicles: Vehicle[] = [];
    if (hasVehicle && plate) {
      vehicles.push({
        plate: plate.toUpperCase().trim(),
        brand: brand.trim() || 'Veículo',
        year: year.trim()
      });
    }

    onAddClient({
      name: name.trim(),
      phone: phone.trim(),
      vehicles
    });

    // Reset fields
    setName('');
    setPhone('');
    setHasVehicle(false);
    setPlate('');
    setBrand('');
    setYear('');
    
    setShowAddModal(false);
  };

  const handleAddVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !vPlate) {
      alert('Placa é obrigatória para vincular um veículo.');
      return;
    }

    const newVehicle: Vehicle = {
      plate: vPlate.toUpperCase().trim(),
      brand: vBrand.trim() || 'Veículo',
      year: vYear.trim()
    };

    onAddVehicle(selectedClient.id, newVehicle);

    // Update active client reference to show added vehicle immediately
    setSelectedClient({
      ...selectedClient,
      vehicles: [...selectedClient.vehicles, newVehicle]
    });

    // Reset vehicle fields
    setVPlate('');
    setVBrand('');
    setVYear('');
    setShowVehicleModal(false);
  };

  // Filter clients
  const filteredClients = clients.filter(client => {
    const query = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(query) ||
      client.phone.includes(query) ||
      client.vehicles.some(v => v.plate.toLowerCase().includes(query) || v.brand.toLowerCase().includes(query))
    );
  });

  // Find orders related to the selected client
  const clientOrders = selectedClient 
    ? orders.filter(o => o.clientId === selectedClient.id)
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Columns - Client List */}
      <div className="lg:col-span-2 space-y-4 flex flex-col">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="h-7 w-7 text-blue-600" />
              Cartela de Clientes
            </h1>
            <p className="text-slate-500 text-sm">Cadastre clientes e vincule veículos para gerar orçamentos rápidos.</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0"
          >
            <Plus className="h-5 w-5" />
            Novo Cliente
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nome, telefone ou placa do carro..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-xs"
          />
          <Search className="absolute left-4 top-3.5 text-slate-400 h-5 w-5" />
        </div>

        {/* Client List */}
        <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1">
          {filteredClients.length === 0 ? (
            <div className="bg-white py-12 text-center border border-slate-200 rounded-2xl">
              <Users className="h-12 w-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 font-medium">Nenhum cliente cadastrado ou encontrado.</p>
            </div>
          ) : (
            filteredClients.map((client) => (
              <div 
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className={`p-4 bg-white border rounded-xl flex items-center justify-between shadow-xs hover:shadow-md transition-all cursor-pointer ${
                  selectedClient?.id === client.id 
                    ? 'border-blue-500 ring-2 ring-blue-50' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-800 text-base">{client.name}</h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                    {client.phone && (
                      <span className="flex items-center gap-1 font-sans">
                        <Phone className="h-3.5 w-3.5" /> {client.phone}
                      </span>
                    )}
                    {!client.phone && <span className="italic text-slate-400">Sem telefone</span>}
                  </div>
                  
                  {/* Client Vehicles */}
                  {client.vehicles.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                      {client.vehicles.map((v) => (
                        <span key={v.plate} className="inline-flex items-center gap-1 font-mono text-[10px] bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                          <Car className="h-3 w-3 text-slate-500" />
                          {v.plate} • {v.brand}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-slate-400 font-semibold text-xs whitespace-nowrap bg-slate-50 px-2 py-1 rounded">
                  {client.vehicles.length} {client.vehicles.length === 1 ? 'Veículo' : 'Veículos'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Column - Client Detail & History */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
        {selectedClient ? (
          <div className="space-y-6 flex-1 flex flex-col justify-between">
            {/* Contact details */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 leading-tight">{selectedClient.name}</h2>
                  <p className="text-slate-400 text-xs mt-0.5">ID: {selectedClient.id}</p>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Deseja realmente excluir este cliente do sistema?')) {
                      onRemoveClient(selectedClient.id);
                      setSelectedClient(null);
                    }
                  }}
                  className="text-slate-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Excluir Cliente"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <hr className="border-slate-100" />

              <div className="space-y-2.5 text-sm">
                {selectedClient.phone && (
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                    <a 
                      href={`https://wa.me/55${selectedClient.phone.replace(/\D/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="hover:underline text-blue-600 font-medium"
                    >
                      {selectedClient.phone}
                    </a>
                  </div>
                )}
                {!selectedClient.phone && (
                  <p className="text-xs italic text-slate-400">Nenhum dado de contato cadastrado.</p>
                )}
              </div>
            </div>

            {/* Vehicles section */}
            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Car className="h-4.5 w-4.5 text-blue-500" />
                  Veículos ({selectedClient.vehicles.length})
                </h3>
                <button
                  onClick={() => setShowVehicleModal(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar Carro
                </button>
              </div>

              {selectedClient.vehicles.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center text-xs text-slate-500">
                  Nenhum veículo vinculado a este cliente.
                </div>
              ) : (
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {selectedClient.vehicles.map((v) => (
                    <div key={v.plate} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <span className="font-mono bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.2 rounded font-extrabold border border-slate-300">
                            {v.plate}
                          </span>
                          <span>{v.brand}</span>
                        </div>
                        {v.year && (
                          <p className="text-[10px] text-slate-500 mt-1">
                            Ano: {v.year}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          if (confirm(`Deseja desvincular o veículo de placa ${v.plate}?`)) {
                            onRemoveVehicle(selectedClient.id, v.plate);
                            setSelectedClient({
                              ...selectedClient,
                              vehicles: selectedClient.vehicles.filter(item => item.plate !== v.plate)
                            });
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 cursor-pointer"
                        title="Remover Veículo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Service Orders History */}
            <div className="space-y-3 mt-4 flex-1 flex flex-col">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <FileText className="h-4.5 w-4.5 text-blue-500" />
                Histórico de Ordens de Serviço
              </h3>

              {clientOrders.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center text-xs text-slate-400 flex-1 flex items-center justify-center">
                  Nenhuma Ordem de Serviço ou Orçamento registrado.
                </div>
              ) : (
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 flex-1">
                  {clientOrders.map((o) => (
                    <div key={o.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-700">{o.id}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {new Date(o.entryDate).toLocaleDateString('pt-BR')} • Placa: {o.vehiclePlate}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900">R$ {o.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                          o.status === 'Concluído' ? 'bg-emerald-100 text-emerald-800' :
                          o.status === 'Orçamento' ? 'bg-slate-100 text-slate-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {o.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 h-full">
            <Users className="h-16 w-16 text-slate-200 mb-3" />
            <h3 className="font-bold text-slate-700">Detalhes do Cliente</h3>
            <p className="text-sm text-slate-500 text-center max-w-xs mt-1">
              Selecione um cliente da lista para visualizar contatos, veículos e histórico.
            </p>
          </div>
        )}
      </div>

      {/* Modal - Novo Cliente */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-200 overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="h-5.5 w-5.5 text-blue-600" />
                Cadastrar Novo Cliente
              </h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold cursor-pointer"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider">Dados Pessoais</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: João da Silva"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Celular (WhatsApp)</label>
                  <input
                    type="text"
                    placeholder="(11) 99999-8888"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* No email field per request */}

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <input
                    type="checkbox"
                    checked={hasVehicle}
                    onChange={(e) => setHasVehicle(e.target.checked)}
                    className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-semibold text-slate-700 select-none">Cadastrar veículo junto com o cliente</span>
                </label>
              </div>

              {hasVehicle && (
                <div className="space-y-3 bg-blue-50/50 p-4 border border-blue-100 rounded-xl animate-fade-in">
                  <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                    <Car className="h-4 w-4" /> Dados do Veículo
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Placa *</label>
                      <input
                        type="text"
                        placeholder="ABC1D23"
                        maxLength={8}
                        value={plate}
                        onChange={(e) => setPlate(e.target.value.toUpperCase())}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Marca</label>
                      <input
                        type="text"
                        placeholder="Ex: Chevrolet"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Ano</label>
                    <input
                      type="text"
                      placeholder="2021"
                      maxLength={4}
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl cursor-pointer"
                >
                  Cadastrar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Adicionar Veículo */}
      {showVehicleModal && selectedClient && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <Car className="h-5 w-5 text-blue-600" />
                Vincular Carro para: {selectedClient.name}
              </h2>
              <button 
                onClick={() => setShowVehicleModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold cursor-pointer"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleAddVehicleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Placa *</label>
                  <input
                    type="text"
                    required
                    placeholder="ABC1D23"
                    maxLength={8}
                    value={vPlate}
                    onChange={(e) => setVPlate(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Marca</label>
                  <input
                    type="text"
                    placeholder="Ex: Fiat"
                    value={vBrand}
                    onChange={(e) => setVBrand(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Ano</label>
                <input
                  type="text"
                  placeholder="2015"
                  maxLength={4}
                  value={vYear}
                  onChange={(e) => setVYear(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => setShowVehicleModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl cursor-pointer"
                >
                  Cadastrar Carro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
