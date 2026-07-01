import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Printer, 
  MessageSquare, 
  Trash2, 
  Wrench, 
  Package, 
  X
} from 'lucide-react';
import { ServiceOrder, Client, Product, Service, OSItem, Vehicle } from '../types';

interface ServiceOrdersProps {
  orders: ServiceOrder[];
  clients: Client[];
  products: Product[];
  services: Service[];
  activeOSForCreation?: { client: Client; plate: string } | null;
  onClearActiveOSForCreation?: () => void;
  onAddOS: (os: Omit<ServiceOrder, 'id' | 'entryDate'>) => void;
  onUpdateOS: (id: string, updated: Partial<ServiceOrder>) => void;
  onRemoveOS: (id: string) => void;
  onAddClient: (client: Omit<Client, 'id'>) => Client;
}

export default function ServiceOrders({
  orders,
  clients,
  products,
  services,
  activeOSForCreation,
  onClearActiveOSForCreation,
  onAddOS,
  onUpdateOS,
  onRemoveOS,
  onAddClient
}: ServiceOrdersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedOS, setSelectedOS] = useState<ServiceOrder | null>(null);
  
  // Form Type: OS (Mecânica) vs BALCAO (Venda Direta)
  const [orderType, setOrderType] = useState<'OS' | 'BALCAO'>('OS');

  // Direct client fields (default)
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  // Other OS states
  const [osStatus, setOsStatus] = useState<ServiceOrder['status']>('Orçamento');
  const [osItems, setOsItems] = useState<OSItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<ServiceOrder['paymentMethod']>('Pix');
  const [paymentStatus, setPaymentStatus] = useState<ServiceOrder['paymentStatus']>('Pendente');
  const [notes, setNotes] = useState('');

  // Item Selector states
  const [selectedProdId, setSelectedProdId] = useState('');
  const [prodQty, setProdQty] = useState(1);
  const [selectedServId, setSelectedServId] = useState('');
  const [servQty, setServQty] = useState(1);

  // Custom Item inputs
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState(0);
  const [customItemType, setCustomItemType] = useState<'PRODUCT' | 'SERVICE'>('SERVICE');

  // Printing state
  const [printingOS, setPrintingOS] = useState<ServiceOrder | null>(null);

  // Auto-trigger OS creation if redirected from Patio
  useEffect(() => {
    if (activeOSForCreation) {
      setOrderType('OS');
      setClientName(activeOSForCreation.client.name);
      setClientPhone(activeOSForCreation.client.phone);
      setVehiclePlate(activeOSForCreation.plate);
      setSelectedClientId(activeOSForCreation.client.id);
      
      const matchedVeh = activeOSForCreation.client.vehicles.find(v => v.plate === activeOSForCreation.plate);
      setVehicleBrand(matchedVeh?.brand || '');

      setOsItems([]);
      setDiscount(0);
      setNotes('Entrada rápida via controle de pátio.');
      setShowAddModal(true);
      if (onClearActiveOSForCreation) onClearActiveOSForCreation();
    }
  }, [activeOSForCreation]);

  const handleImportClient = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setSelectedClientId(client.id);
      setClientName(client.name);
      setClientPhone(client.phone);
      if (client.vehicles.length > 0) {
        setVehiclePlate(client.vehicles[0].plate);
        setVehicleBrand(client.vehicles[0].brand);
      } else {
        setVehiclePlate('');
        setVehicleBrand('');
      }
    } else {
      setSelectedClientId('');
      setClientName('');
      setClientPhone('');
      setVehiclePlate('');
      setVehicleBrand('');
    }
  };

  const handleToggleOrderType = (type: 'OS' | 'BALCAO') => {
    setOrderType(type);
    if (type === 'BALCAO') {
      setOsStatus('Concluído');
      setPaymentStatus('Pago');
      setPaymentMethod('Pix');
      setClientName('Consumidor Balcão');
      setClientPhone('(00) 00000-0000');
      setVehiclePlate('BALCÃO');
      setVehicleBrand('Balcão');
    } else {
      setOsStatus('Orçamento');
      setPaymentStatus('Pendente');
      setPaymentMethod('Pix');
      setClientName('');
      setClientPhone('');
      setVehiclePlate('');
      setVehicleBrand('');
      setSelectedClientId('');
    }
  };

  const handleAddProductItem = () => {
    const prod = products.find(p => p.id === selectedProdId);
    if (!prod) return;
    
    const existing = osItems.find(item => item.id === prod.id && item.type === 'PRODUCT');
    if (existing) {
      setOsItems(osItems.map(item => 
        item.id === prod.id && item.type === 'PRODUCT'
          ? { ...item, quantity: item.quantity + prodQty }
          : item
      ));
    } else {
      setOsItems([...osItems, {
        id: prod.id,
        type: 'PRODUCT',
        name: prod.name,
        quantity: prodQty,
        price: prod.sellPrice,
        costPrice: prod.costPrice
      }]);
    }
    
    setSelectedProdId('');
    setProdQty(1);
  };

  const handleAddServiceItem = () => {
    const serv = services.find(s => s.id === selectedServId);
    if (!serv) return;

    const existing = osItems.find(item => item.id === serv.id && item.type === 'SERVICE');
    if (existing) {
      setOsItems(osItems.map(item => 
        item.id === serv.id && item.type === 'SERVICE'
          ? { ...item, quantity: item.quantity + servQty }
          : item
      ));
    } else {
      setOsItems([...osItems, {
        id: serv.id,
        type: 'SERVICE',
        name: serv.name,
        quantity: servQty,
        price: serv.price
      }]);
    }

    setSelectedServId('');
    setServQty(1);
  };

  const handleAddCustomItem = () => {
    if (!customItemName || customItemPrice <= 0) {
      alert('Informe a descrição e um preço válido.');
      return;
    }
    const generatedId = `custom-${Date.now()}`;
    setOsItems([...osItems, {
      id: generatedId,
      type: customItemType,
      name: customItemName,
      quantity: 1,
      price: customItemPrice
    }]);

    setCustomItemName('');
    setCustomItemPrice(0);
  };

  const handleRemoveItem = (index: number) => {
    setOsItems(osItems.filter((_, i) => i !== index));
  };

  const itemsSubtotal = osItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const orderTotal = Math.max(0, itemsSubtotal - discount);

  const handleSubmitOS = (e: React.FormEvent) => {
    e.preventDefault();

    let finalClientName = clientName.trim();
    let finalClientPhone = clientPhone.trim();

    if (orderType === 'BALCAO') {
      finalClientName = finalClientName || 'Consumidor Balcão';
      finalClientPhone = finalClientPhone || '(00) 00000-0000';
    }

    if (!finalClientName) {
      alert('Por favor, informe o nome do cliente.');
      return;
    }

    let finalClientId = selectedClientId;

    // Check if we can find a matching client to avoid duplicates
    let matchedClient = clients.find(c => c.id === selectedClientId);
    if (!matchedClient) {
      matchedClient = clients.find(c => c.name.toLowerCase() === finalClientName.toLowerCase() || (finalClientPhone && c.phone === finalClientPhone));
    }

    if (!matchedClient && orderType === 'OS') {
      // Register new client directly
      const newVehicles: Vehicle[] = [];
      if (vehiclePlate) {
        newVehicles.push({
          plate: vehiclePlate.toUpperCase().trim(),
          brand: vehicleBrand.trim() || 'Veículo',
          year: ''
        });
      }
      const created = onAddClient({
        name: finalClientName,
        phone: finalClientPhone,
        vehicles: newVehicles
      });
      finalClientId = created.id;
    } else if (matchedClient) {
      finalClientId = matchedClient.id;
      // If they input a new vehicle plate, let's link it to the client
      if (vehiclePlate && !matchedClient.vehicles.some(v => v.plate.toUpperCase() === vehiclePlate.toUpperCase())) {
        matchedClient.vehicles.push({
          plate: vehiclePlate.toUpperCase().trim(),
          brand: vehicleBrand.trim() || 'Veículo',
          year: ''
        });
      }
    } else {
      // For BALCAO, we can use a generic "Consumidor Balcão" client
      let balcaoClient = clients.find(c => c.name === 'Consumidor Balcão');
      if (!balcaoClient) {
        balcaoClient = onAddClient({
          name: 'Consumidor Balcão',
          phone: '(00) 00000-0000',
          vehicles: []
        });
      }
      finalClientId = balcaoClient.id;
      finalClientName = balcaoClient.name;
      finalClientPhone = balcaoClient.phone;
    }

    onAddOS({
      clientId: finalClientId,
      clientName: finalClientName,
      clientPhone: finalClientPhone,
      vehiclePlate: orderType === 'BALCAO' ? 'BALCÃO' : (vehiclePlate.toUpperCase().trim() || 'S/P'),
      status: osStatus,
      items: osItems,
      discount: Number(discount),
      totalAmount: orderTotal,
      paymentMethod,
      paymentStatus,
      notes: notes.trim()
    });

    // Reset state & close
    setShowAddModal(false);
    setOrderType('OS');
    setSelectedClientId('');
    setClientName('');
    setClientPhone('');
    setVehiclePlate('');
    setVehicleBrand('');
    setOsItems([]);
    setDiscount(0);
    setNotes('');
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Share via WhatsApp builder
  const handleShareWhatsApp = (os: ServiceOrder) => {
    const formattedPhone = '55' + os.clientPhone.replace(/\D/g, '');
    
    let message = `*⚙️ OFICINA MECÂNICA - DETALHES DO SEU ORÇAMENTO (${os.id})*\n\n`;
    message += `Olá, *${os.clientName}*! Segue a descrição dos serviços e produtos para o seu veículo (Placa: *${os.vehiclePlate}*):\n\n`;
    
    message += `*ITENS DA ORDEM DE SERVIÇO:*\n`;
    os.items.forEach((item, index) => {
      const typeLabel = item.type === 'PRODUCT' ? '📦 Peça' : '🔧 Mão de Obra';
      message += `${index + 1}. *${item.name}* (${typeLabel})\n`;
      message += `   Qtd: ${item.quantity} x R$ ${item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} = *R$ ${(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*\n\n`;
    });

    if (os.discount > 0) {
      message += `*Subtotal:* R$ ${(os.totalAmount + os.discount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
      message += `*Desconto:* -R$ ${os.discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
    }
    
    message += `*---------------------------------*\n`;
    message += `*VALOR TOTAL:* *R$ ${os.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*\n`;
    message += `*Forma de Pagamento:* ${os.paymentMethod || 'A combinar'}\n`;
    message += `*Status de Pagamento:* ${os.paymentStatus === 'Pago' ? '✅ Pago' : '⏳ Pendente'}\n`;
    message += `*Status da OS:* *${os.status}*\n\n`;

    if (os.notes) {
      message += `_Observações: ${os.notes}_\n\n`;
    }

    message += `Agradecemos a preferência! Caso aprove este orçamento, responda com *"APROVADO"*.`;

    const encodedText = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`, '_blank');
  };

  const handlePrint = (os: ServiceOrder) => {
    setPrintingOS(os);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className="space-y-6">
      {/* Printable Area */}
      {printingOS && (
        <div className="hidden print:block fixed inset-0 z-100 bg-white p-8 text-black font-sans text-sm space-y-6">
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight uppercase">Oficina Mecânica Central</h1>
              <p className="text-xs text-slate-500 mt-1">Sua oficina de confiança</p>
            </div>
            <div className="text-right">
              <span className="font-mono text-base font-extrabold bg-slate-100 border border-slate-300 p-2 rounded block">
                {printingOS.status === 'Orçamento' ? 'ORÇAMENTO' : 'ORDEM DE SERVIÇO'} #{printingOS.id}
              </span>
              <p className="text-xs text-slate-500 mt-2">Data Entrada: {new Date(printingOS.entryDate).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 border rounded-xl">
            <div>
              <h3 className="font-bold text-slate-800 uppercase text-xs mb-1.5 border-b pb-1">DADOS DO CLIENTE</h3>
              <p className="font-semibold text-base">{printingOS.clientName}</p>
              <p className="text-xs text-slate-600 mt-1">Celular/Whats: {printingOS.clientPhone}</p>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 uppercase text-xs mb-1.5 border-b pb-1">DADOS DO VEÍCULO</h3>
              <p className="text-xs font-mono font-bold mt-1 inline-block bg-slate-200 px-2 py-0.5 border rounded text-slate-800">
                Placa: {printingOS.vehiclePlate}
              </p>
              {printingOS.notes && (
                <p className="text-xs text-slate-500 mt-2 italic">Sintoma/Problema: {printingOS.notes}</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-slate-800 uppercase text-xs mb-3 border-b-2 pb-1">PEÇAS E SERVIÇOS</h3>
            <table className="w-full text-left border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-100 border-b text-xs font-bold text-slate-700">
                  <th className="p-2 border">#</th>
                  <th className="p-2 border">Descrição do Item</th>
                  <th className="p-2 border text-center">Tipo</th>
                  <th className="p-2 border text-center">Qtd</th>
                  <th className="p-2 border text-right">Unitário</th>
                  <th className="p-2 border text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {printingOS.items.map((item, idx) => (
                  <tr key={idx} className="text-xs border-b">
                    <td className="p-2 border text-slate-500">{idx + 1}</td>
                    <td className="p-2 border font-medium text-slate-800">{item.name}</td>
                    <td className="p-2 border text-center text-[10px]">{item.type === 'PRODUCT' ? 'Peça' : 'Mão de Obra'}</td>
                    <td className="p-2 border text-center">{item.quantity}</td>
                    <td className="p-2 border text-right">R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="p-2 border text-right font-semibold">R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-start gap-4 pt-4 border-t-2">
            <div>
              <h4 className="font-semibold text-xs text-slate-500">CONDIÇÕES E PAGAMENTO</h4>
              <p className="text-xs text-slate-700 mt-1">Forma de Pagamento: <strong>{printingOS.paymentMethod || 'A combinar'}</strong></p>
              <p className="text-xs text-slate-700">Status: <strong>{printingOS.paymentStatus === 'Pago' ? 'QUITADO' : 'PENDENTE'}</strong></p>
              <div className="mt-8 border-t border-black w-64 pt-1 text-center text-xs font-bold uppercase text-slate-600">
                Assinatura do Cliente
              </div>
            </div>
            <div className="text-right space-y-1.5 w-64">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Subtotal Itens:</span>
                <span>R$ {printingOS.items.reduce((acc, item) => acc + (item.price * item.quantity), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              {printingOS.discount > 0 && (
                <div className="flex justify-between text-xs text-rose-600 font-semibold">
                  <span>Desconto:</span>
                  <span>-R$ {printingOS.discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold border-t pt-1.5 text-slate-900 bg-slate-100 p-2 rounded">
                <span>VALOR TOTAL:</span>
                <span>R$ {printingOS.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-center text-slate-400 pt-16">
            Documento gerado eletronicamente em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
          </p>
        </div>
      )}

      {/* Main OS List View */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="h-7 w-7 text-blue-600" />
            Ordens de Serviço & Orçamentos
          </h1>
          <p className="text-slate-500 text-sm">Crie, aprove, fature e compartilhe orçamentos de serviços e peças.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <button
            onClick={() => {
              handleToggleOrderType('OS');
              setShowAddModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="h-5 w-5" />
            Nova OS / Orçamento
          </button>
          <button
            onClick={() => {
              handleToggleOrderType('BALCAO');
              setShowAddModal(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Package className="h-5 w-5" />
            Nova Venda de Balcão
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 print:hidden">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por OS #, nome do cliente ou placa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <Search className="absolute left-3 top-2.5 text-slate-400 h-4.5 w-4.5" />
        </div>

        <div className="flex overflow-x-auto gap-1 pb-1 md:pb-0 scrollbar-none">
          {[
            { label: 'Todos', val: 'all' },
            { label: 'Orçamento', val: 'Orçamento' },
            { label: 'Aprovado', val: 'Aprovado' },
            { label: 'Em Execução', val: 'Em Execução' },
            { label: 'Concluído', val: 'Concluído' },
            { label: 'Cancelado', val: 'Cancelado' }
          ].map((btn) => (
            <button
              key={btn.val}
              onClick={() => setStatusFilter(btn.val)}
              className={`text-xs px-3 py-2 rounded-lg font-semibold cursor-pointer whitespace-nowrap transition-colors ${
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

      {/* OS List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 print:hidden">
        {filteredOrders.length === 0 ? (
          <div className="bg-white py-16 text-center border border-slate-200 rounded-2xl col-span-full">
            <FileText className="h-16 w-16 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium text-lg">Nenhum orçamento ou OS encontrado</p>
          </div>
        ) : (
          filteredOrders.map((os) => (
            <div 
              key={os.id}
              className={`bg-white border rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden ${
                os.status === 'Concluído' ? 'border-emerald-200' :
                os.status === 'Orçamento' ? 'border-slate-200' :
                'border-blue-200'
              }`}
            >
              {/* Header */}
              <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center">
                <div>
                  <span className="font-mono font-extrabold text-slate-800">{os.id}</span>
                  <span className="text-[10px] text-slate-400 ml-2">{new Date(os.entryDate).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    os.status === 'Orçamento' ? 'bg-slate-100 text-slate-800' :
                    os.status === 'Aprovado' ? 'bg-indigo-50 text-indigo-800 border border-indigo-200' :
                    os.status === 'Em Execução' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                    os.status === 'Concluído' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                    'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    {os.status}
                  </span>
                  
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    os.paymentStatus === 'Pago' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {os.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-xs text-slate-400 font-medium block">CLIENTE</span>
                    <span className="font-bold text-slate-800 truncate block">{os.clientName}</span>
                    <span className="text-xs text-slate-500">{os.clientPhone}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-medium block">VEÍCULO</span>
                    <span className="text-xs font-mono bg-slate-100 px-1.5 py-0.2 rounded font-bold border border-slate-200 text-slate-700 mt-1 inline-block">
                      Placa: {os.vehiclePlate}
                    </span>
                  </div>
                </div>

                {/* Items Summary list */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600">
                  <span className="font-bold text-slate-700 block mb-1.5">Itens do Pedido ({os.items.length})</span>
                  <div className="space-y-1 divide-y divide-slate-200/50 max-h-[85px] overflow-y-auto">
                    {os.items.map((item, index) => (
                      <div key={index} className="flex justify-between py-1 text-[11px]">
                        <span className="truncate max-w-[70%]">{item.quantity}x {item.name}</span>
                        <span className="font-semibold text-slate-800">
                          R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer pricing */}
              <div className="px-5 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase font-semibold">Preço Total</span>
                  <span className="text-xl font-extrabold text-slate-900 font-sans">
                    R$ {os.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleShareWhatsApp(os)}
                    className="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer"
                    title="Enviar detalhes por WhatsApp"
                  >
                    <MessageSquare className="h-4.5 w-4.5 fill-emerald-600" />
                  </button>

                  <button
                    onClick={() => handlePrint(os)}
                    className="p-2 bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-700 rounded-lg transition-colors cursor-pointer"
                    title="Imprimir orçamento/OS"
                  >
                    <Printer className="h-4.5 w-4.5" />
                  </button>

                  {os.status !== 'Concluído' && os.status !== 'Cancelado' && (
                    <button
                      onClick={() => {
                        const nextStatus = os.status === 'Orçamento' ? 'Aprovado' : 'Concluído';
                        const confirmMsg = os.status === 'Orçamento' 
                          ? 'Aprovar este orçamento e dar andamento na oficina?' 
                          : 'Concluir esta Ordem de Serviço e registrar entrada financeira no caixa?';
                        if (confirm(confirmMsg)) {
                          onUpdateOS(os.id, { 
                            status: nextStatus,
                            paymentStatus: nextStatus === 'Concluído' ? 'Pago' : os.paymentStatus,
                            paymentMethod: nextStatus === 'Concluído' ? 'Pix' : os.paymentMethod
                          });
                        }
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      {os.status === 'Orçamento' ? 'Aprovar' : 'Concluir'}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (confirm('Deseja realmente excluir esta OS? Essa ação não pode ser desfeita.')) {
                        onRemoveOS(os.id);
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Excluir OS"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal - Nova OS / Orçamento */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-xl border border-slate-200 overflow-hidden animate-fade-in flex flex-col h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-5.5 w-5.5 text-blue-600" />
                Criar Novo Orçamento / OS
              </h2>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  if (onClearActiveOSForCreation) onClearActiveOSForCreation();
                }}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold cursor-pointer"
              >
                Fechar
              </button>
            </div>

            {/* Form & Items Container */}
            <form onSubmit={handleSubmitOS} className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Form: Client, Vehicle & Settings */}
              <div className="space-y-4">
                
                {/* Order Type Toggle */}
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleToggleOrderType('OS')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      orderType === 'OS'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <Wrench className="h-4 w-4" />
                    🔧 Ordem de Serviço
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleOrderType('BALCAO')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      orderType === 'BALCAO'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <Package className="h-4 w-4" />
                    📦 Venda de Balcão
                  </button>
                </div>

                <div className="flex items-center justify-between pb-1 border-b">
                  <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                    {orderType === 'OS' ? '1. Cliente e Veículo' : '1. Dados de Venda'}
                  </h3>
                  
                  {orderType === 'OS' && clients.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <span className="text-[11px] text-slate-400">Importar:</span>
                      <select
                        onChange={(e) => handleImportClient(e.target.value)}
                        value={selectedClientId}
                        className="bg-slate-50 border border-slate-200 rounded-md p-1 text-[11px] max-w-[150px] font-semibold text-blue-600 focus:outline-none"
                      >
                        <option value="">-- Cadastrado --</option>
                        {clients.filter(c => c.name !== 'Consumidor Balcão').map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                
                <div className="bg-slate-50/50 p-4 border border-slate-150 rounded-xl space-y-3 animate-fade-in">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nome do Cliente *</label>
                    <input
                      type="text"
                      placeholder={orderType === 'BALCAO' ? 'Consumidor Balcão (Opcional)' : 'Ex: João Silva'}
                      value={clientName}
                      onChange={(e) => {
                        setClientName(e.target.value);
                        // If they type, decouple from loaded client ID
                        if (selectedClientId) setSelectedClientId('');
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Celular (WhatsApp)</label>
                      <input
                        type="text"
                        placeholder={orderType === 'BALCAO' ? '(00) 00000-0000' : 'Ex: (11) 99999-8888'}
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {orderType === 'OS' ? (
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Placa do Veículo</label>
                        <input
                          type="text"
                          placeholder="Ex: ABC1D23"
                          maxLength={8}
                          value={vehiclePlate}
                          onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Identificação</label>
                        <input
                          type="text"
                          disabled
                          value="BALCÃO"
                          className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-500 select-none cursor-not-allowed"
                        />
                      </div>
                    )}
                  </div>

                  {orderType === 'OS' && (
                    <div className="animate-fade-in">
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Marca / Modelo do Veículo</label>
                      <input
                        type="text"
                        placeholder="Ex: Fiat Palio"
                        value={vehicleBrand}
                        onChange={(e) => setVehicleBrand(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>

                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider pt-2 pb-1 border-b">2. Definições de Andamento</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Status Inicial *</label>
                    <select
                      value={osStatus}
                      onChange={(e) => setOsStatus(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                    >
                      <option value="Orçamento">Orçamento</option>
                      <option value="Aprovado">Aprovado</option>
                      <option value="Em Execução">Em Execução</option>
                      <option value="Concluído">Concluído</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Forma Pagamento</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                    >
                      <option value="Pix">Pix</option>
                      <option value="Débito">Débito</option>
                      <option value="Crédito">Crédito</option>
                      <option value="Pagar outro dia">Pagar outro dia</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Pagamento Status</label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                    >
                      <option value="Pendente">Pendente</option>
                      <option value="Pago">Pago</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Desconto Especial (R$)</label>
                    <input
                      type="number"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Problema Relatado / Observações</label>
                  <textarea
                    rows={2}
                    placeholder="Ruído na suspensão, trocar óleo..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Right: Item Selector and Added List */}
              <div className="space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider pb-1 border-b">3. Adicionar Peças, Serviços e Customizados</h3>
                  
                  {/* Product Selector */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 mt-2 space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      Peça Cadastrada
                    </span>
                    <div className="flex gap-2">
                      <select
                        value={selectedProdId}
                        onChange={(e) => setSelectedProdId(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none"
                      >
                        <option value="">-- Selecionar Peça --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} (R$ {p.sellPrice} - Est: {p.stock}un)
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={prodQty}
                        onChange={(e) => setProdQty(Number(e.target.value))}
                        className="w-12 bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-center"
                        title="Quantidade"
                      />
                      <button
                        type="button"
                        onClick={handleAddProductItem}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Service Selector */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 mt-2 space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      <Wrench className="h-3 w-3" />
                      Mão de Obra / Serviço Tabela
                    </span>
                    <div className="flex gap-2">
                      <select
                        value={selectedServId}
                        onChange={(e) => setSelectedServId(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none"
                      >
                        <option value="">-- Selecionar Serviço --</option>
                        {services.map(s => (
                          <option key={s.id} value={s.id}>{s.name} (R$ {s.price})</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={servQty}
                        onChange={(e) => setServQty(Number(e.target.value))}
                        className="w-12 bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-center"
                        title="Quantidade"
                      />
                      <button
                        type="button"
                        onClick={handleAddServiceItem}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Custom item launcher */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 mt-2 space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Lançar Item Avulso (Não Cadastrado)</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ex: Alinhamento, Parafuso especial..."
                        value={customItemName}
                        onChange={(e) => setCustomItemName(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none"
                      />
                      <input
                        type="number"
                        placeholder="Preço (R$)"
                        value={customItemPrice || ''}
                        onChange={(e) => setCustomItemPrice(Number(e.target.value))}
                        className="w-20 bg-white border border-slate-200 rounded-lg p-1.5 text-xs"
                      />
                      <select
                        value={customItemType}
                        onChange={(e) => setCustomItemType(e.target.value as any)}
                        className="bg-white border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none"
                      >
                        <option value="SERVICE">Serviço</option>
                        <option value="PRODUCT">Produto</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleAddCustomItem}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Added Items List */}
                <div className="flex-1 min-h-[120px] max-h-[160px] overflow-y-auto border border-dashed border-slate-200 rounded-xl p-3 bg-slate-50/30">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Lista de Itens Selecionados ({osItems.length})</span>
                  {osItems.length === 0 ? (
                    <p className="text-slate-400 text-xs text-center py-6">Adicione peças ou serviços acima.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {osItems.map((item, index) => (
                        <div key={index} className="p-2 bg-white border border-slate-100 rounded-lg flex items-center justify-between text-xs">
                          <div className="min-w-0">
                            <span className="font-bold text-slate-800 truncate block">{item.name}</span>
                            <span className="text-[10px] text-slate-400">
                              {item.type === 'PRODUCT' ? 'Peça' : 'Mão de Obra'} • {item.quantity} x R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="text-slate-400 hover:text-rose-600 p-0.5"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Totals Summary */}
                <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Subtotal Itens:</span>
                    <span>R$ {itemsSubtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-xs text-rose-400">
                      <span>Desconto Aplicado:</span>
                      <span>-R$ {discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold border-t border-slate-800 pt-2">
                    <span>VALOR TOTAL DA OS:</span>
                    <span className="text-yellow-400 font-sans font-extrabold">R$ {orderTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="col-span-2 flex gap-2 pt-4 border-t border-slate-100 justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    if (onClearActiveOSForCreation) onClearActiveOSForCreation();
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl cursor-pointer"
                >
                  Gerar Orçamento / OS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
