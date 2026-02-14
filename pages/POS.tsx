
import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { 
  Search, Minus, Plus, CreditCard, LayoutGrid, Printer, 
  Banknote, X, Lock, Utensils, MonitorPlay, UserPlus, 
  Maximize2, Minimize2, ChevronRight, DoorOpen, Move, AlertCircle,
  Coffee, Pizza, Beer, IceCream, Grid3X3, Tag,
  ShoppingBasket, FileText, History, Trash2, Home, Sun,
  Wine, Sandwich, Soup, Salad, Cake, Fish, Beef, Croissant, 
  Donut, Martini, Grape, Carrot, Apple, Cherry, RotateCcw, Check
} from 'lucide-react';
import { PaymentMethod, Order, TableZone, Table, OrderPayment, Dish } from '../types';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { availableMonitors, primaryMonitor } from '@tauri-apps/api/window';
import ExportButton from '../components/ExportButton';
import { logger } from '../services/logger';

const AVAILABLE_ICONS = [
  { name: 'Utensils', icon: Utensils, label: 'Geral' },
  { name: 'Coffee', icon: Coffee, label: 'Café' },
  { name: 'Beer', icon: Beer, label: 'Cerveja' },
  { name: 'Wine', icon: Wine, label: 'Vinho' },
  { name: 'Martini', icon: Martini, label: 'Bar' },
  { name: 'Pizza', icon: Pizza, label: 'Pizza' },
  { name: 'Sandwich', icon: Sandwich, label: 'Lanche' },
  { name: 'Soup', icon: Soup, label: 'Sopa' },
  { name: 'Salad', icon: Salad, label: 'Salada' },
  { name: 'Fish', icon: Fish, label: 'Peixe' },
  { name: 'Beef', icon: Beef, label: 'Carne' },
  { name: 'IceCream', icon: IceCream, label: 'Gelado' },
  { name: 'Cake', icon: Cake, label: 'Bolo' },
  { name: 'Croissant', icon: Croissant, label: 'Padaria' },
  { name: 'Donut', icon: Donut, label: 'Doce' },
  { name: 'Grape', icon: Grape, label: 'Fruta' },
  { name: 'Carrot', icon: Carrot, label: 'Legume' },
  { name: 'Apple', icon: Apple, label: 'Saudável' },
  { name: 'Cherry', icon: Cherry, label: 'Sobremesa' },
];

const POS = () => {
  const { 
    tables, activeTableId, setActiveTable, 
    menu, categories, activeOrders, activeOrderId, setActiveOrder, 
    createNewOrder, addToOrder, removeFromOrder, 
    checkoutTable, closeTableWithoutOrders, transferTable,
    settings, addNotification,
    currentShiftId, openShift, toggleSidebar, currentUser,
    auditLogs, addTable
  } = useStore();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [currentPayments, setCurrentPayments] = useState<OrderPayment[]>([]);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctionOrderId, setCorrectionOrderId] = useState<string | null>(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [isSubAccountModalOpen, setIsSubAccountModalOpen] = useState(false);
  const [isCloseTableModalOpen, setIsCloseTableModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isClosingShiftModalOpen, setIsClosingShiftModalOpen] = useState(false);
  const [closingAmount, setClosingAmount] = useState<string>('');
  const [isTransferHistoryOpen, setIsTransferHistoryOpen] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState<number | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [subAccountName, setSubAccountName] = useState('');
  const [customerNif, setCustomerNif] = useState('');
  const [isOpeningShift, setIsOpeningShift] = useState(false);
  const [openingAmount, setOpeningAmount] = useState<string>('');
  const [showTableBar, setShowTableBar] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('THERMAL');
  const [pendingOrderForPrint, setPendingOrderForPrint] = useState<Order | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [activeZone, setActiveZone] = useState<TableZone>('INTERIOR');
  const [showMap, setShowMap] = useState(false);

  const zoneConfig = {
    INTERIOR: { icon: Home, label: 'Interior', bg: 'bg-slate-900/40' },
    EXTERIOR: { icon: Sun, label: 'Exterior', bg: 'bg-blue-900/10' },
    BALCAO: { icon: Beer, label: 'Balcão', bg: 'bg-orange-900/10' },
  };

  const GRID_SIZE = 10;
  const GRID_ROWS = 8;

  const currentOrder = activeOrders.find(o => o.id === activeOrderId);
  const activeTable = tables.find(t => t.id === activeTableId);

  // Validate activeTableId on mount and updates
  useEffect(() => {
    // FORCE RESET on mount per user request: "Open without open tables"
    // This ensures we start in product view with no table active
    setActiveTable(null);
    setShowMap(false);
    setShowTableBar(false);
  }, [setActiveTable]);

  useEffect(() => {
    // Only clear activeTableId if we have tables loaded and the ID is invalid
    if (tables.length > 0 && activeTableId && !activeTable) {
      setActiveTable(null);
    }
    
    // If no table is active, ensure we are NOT in map mode unless explicitly requested
    // This handles the "return to table menu" issue when closing a table
    if (!activeTableId) {
        setShowMap(false);
    }
  }, [activeTableId, activeTable, tables.length, setActiveTable]);

  // Handle Product Click (Auto-select Balcão if no table active)
  const handleProductClick = (dish: Dish) => {
    if (activeTableId) {
      addToOrder(activeTableId, dish);
    } else {
      // Find or create Balcão table
      let balcao = tables.find(t => t.name.toLowerCase().includes('balcão') || t.id === 999);
      
      if (!balcao) {
        const newTable: Table = {
          id: 999,
          name: 'Balcão',
          seats: 100,
          status: 'LIVRE',
          x: 0,
          y: 0,
          zone: 'INTERIOR',
          shape: 'RECTANGLE',
          rotation: 0
        };
        addTable(newTable);
        balcao = newTable;
      }
      
      if (balcao) {
        setActiveTable(balcao.id);
        // We need to wait for state update or pass ID directly? 
        // addToOrder usually uses current state, but here we pass tableId explicitly.
        // However, we just called setActiveTable. The store might update synchronously or not.
        // Safe bet: pass ID explicitly.
        addToOrder(balcao.id, dish);
      }
    }
  };


  const openOrdersForTable = activeOrders.filter(o => o.tableId === activeTableId && o.status === 'ABERTO');
  
  // Sort tables numerically
  const sortedTables = [...tables].sort((a, b) => {
    const numA = parseInt(a.name.replace(/\D/g, '')) || 9999;
    const numB = parseInt(b.name.replace(/\D/g, '')) || 9999;
    return numA - numB || a.name.localeCompare(b.name);
  });

  // Encontrar todas as mesas que têm pelo menos um pedido aberto
  const occupiedTables = sortedTables.filter(t => 
    activeOrders.some(o => o.tableId === t.id && o.status === 'ABERTO')
  );

  const filteredMenu = menu.filter(item => {
    const matchesCategory = selectedCategoryId === 'TODOS' || item.categoryId === selectedCategoryId;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  }).sort((a, b) => a.name.localeCompare(b.name));

  const formatKz = (val: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(val);
  
  const totalWithTax = currentOrder ? currentOrder.total : 0;

  const getExportConfig = () => {
    const shiftOrders = activeOrders.filter(o => o.status === 'FECHADO' && o.shiftId === currentShiftId);
          return {
            data: shiftOrders.map(o => ({
              id: o.invoiceNumber || o.id,
              time: new Date(o.timestamp).toLocaleTimeString('pt-AO'),
              total: formatKz(o.total),
              payment: o.paymentMethod || 'N/A',
              items: o.items.length
            })),
      columns: [
        { header: 'Fatura', dataKey: 'id' },
        { header: 'Hora', dataKey: 'time' },
        { header: 'Total', dataKey: 'total' },
        { header: 'Pagamento', dataKey: 'payment' },
        { header: 'Items', dataKey: 'items' }
      ],
      fileName: `fecho_caixa_${new Date().toISOString().split('T')[0]}`,
      title: `Relatório de Vendas - Turno Atual`
    };
  };

  const exportConfig = getExportConfig();

  const handleOpenShift = () => {
    const amount = Number(openingAmount);
    if (isNaN(amount) || amount < 0) {
      addNotification('error', 'Valor inválido');
      return;
    }
    openShift(amount);
    setIsOpeningShift(false);
    setOpeningAmount('');
  };

  const handleCreateSubAccount = () => {
    if (!activeTableId) return;
    const name = subAccountName || `Subconta ${openOrdersForTable.length + 1}`;
    createNewOrder(activeTableId, name);
    setIsSubAccountModalOpen(false);
    setSubAccountName('');
    addNotification('success', `Subconta "${name}" criada.`);
  };

  const emitRouteUpdateWithBackoff = async (label: string, path: string, maxRetries = 5) => {
    let attempt = 0;
    const baseDelay = 250;
    while (attempt < maxRetries) {
      try {
        const win = await WebviewWindow.getByLabel(label);
        if (win) {
          await win.emit('update-customer-display-route', { path });
          logger.info('DISPLAY: rota atualizada', { path, attempt }, 'DISPLAY');
          return true;
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        logger.warn('DISPLAY: falha ao emitir atualização de rota', { attempt, error: msg }, 'DISPLAY');
      }
      await new Promise(res => setTimeout(res, baseDelay * Math.pow(2, attempt)));
      attempt++;
    }
    logger.error('DISPLAY: falha permanente na sincronização de rota', { path }, 'DISPLAY');
    return false;
  };

  const handleOpenCustomerDisplay = async () => {
    try {
      const label = 'customer-display';
      const existingWin = await WebviewWindow.getByLabel(label);
      if (existingWin) {
        await existingWin.setFocus();
        await emitRouteUpdateWithBackoff(label, `/customer-display/${activeTableId}`);
        return;
      }

      // Logic to find the second monitor
      const monitors = await availableMonitors();
      let x = 0;
      let y = 0;
      const width = 1280;
      const height = 720;
      let fullscreen = false;

      // If more than one monitor, try to use the secondary one
      if (monitors.length > 1) {
          const primary = await primaryMonitor();
          // Find a monitor that is not the primary one
          const secondary = monitors.find(m => m.name !== primary?.name) || monitors[1];
          
          if (secondary) {
              x = secondary.position.x;
              y = secondary.position.y;
              // Ideally use the monitor size, but WebviewWindow options don't enforce it strictly if fullscreen
              // width = secondary.size.width; 
              // height = secondary.size.height;
              fullscreen = true; // Auto fullscreen on secondary monitor
          }
      }

      const url = `/customer-display/${activeTableId}`;
      new WebviewWindow(label, {
        url,
        title: 'Tasca Vereda - Cliente',
        x,
        y,
        width,
        height,
        resizable: true,
        fullscreen,
        alwaysOnTop: false
      });
      setTimeout(() => {
        emitRouteUpdateWithBackoff(label, `/customer-display/${activeTableId}`);
      }, 500);
    } catch (error) {
      console.error('Failed to open customer display with Tauri API, falling back to window.open', error);
      const url = `${window.location.origin}/customer-display/${activeTableId}`;
      window.open(url, 'CustomerDisplay', 'width=1024,height=768');
    }
  };

  const handleOpenDrawer = () => {
    addNotification('success', 'Sinal enviado: Gaveta Aberta.');
  };

  const handleCloseTableWithoutOrders = () => {
    if (activeTableId) {
      closeTableWithoutOrders(activeTableId);
      setIsCloseTableModalOpen(false);
    }
  };

  const handleTransferTable = () => {
    if (activeTableId && transferTargetId) {
      transferTable(activeTableId, transferTargetId);
      setIsTransferModalOpen(false);
      setTransferTargetId(null);
    }
  };

  const generateStandardInvoiceHTML = (order: Order): string => {
    const formatNumber = (val: number) => new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
    const customerTaxId = order.customerNif || '999999999';
    
    const itemsHtml = order.items.map(item => {
      const dish = menu.find(d => d.id === item.dishId);
      const name = dish?.name || 'Item Desconhecido';
      const unitPrice = formatNumber(item.unitPrice);
      const subTotal = formatNumber(item.unitPrice * item.quantity);

      return `
      <div style="margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; font-weight: bold; font-size: 15px;">
          <div style="flex: 1; padding-right: 10px;">${item.quantity} x ${name}</div>
          <div style="text-align: right; white-space: nowrap;">${subTotal} Kz</div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #666; margin-top: 2px;">
          <span>(Unit: ${unitPrice} Kz)</span>
          <span>IVA: ${settings.taxRate}%</span>
        </div>
      </div>`;
    }).join('');

    const now = new Date(order.timestamp);
    const dateStr = now.toLocaleDateString('pt-AO', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const timeStr = now.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' });
    
    const grossTotal = order.total - order.taxTotal;
    const taxAmount = order.taxTotal;
    const finalTotal = order.total;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; color: #333; line-height: 1.4; }
    .invoice-card { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border: 1px solid #eee; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px; }
    .store-info h1 { margin: 0; color: #000; font-size: 28px; text-transform: uppercase; }
    .store-info p { margin: 5px 0; font-size: 12px; color: #666; }
    .invoice-info { text-align: right; }
    .invoice-info h2 { margin: 0; color: #000; font-size: 20px; }
    .invoice-info p { margin: 5px 0; font-size: 13px; }
    .billing { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .billing-box h3 { font-size: 12px; text-transform: uppercase; color: #999; margin-bottom: 10px; }
    .billing-box p { margin: 2px 0; font-weight: bold; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    .items-table th { text-align: left; padding: 12px; border-bottom: 2px solid #eee; font-size: 12px; text-transform: uppercase; color: #999; }
    .items-table td { padding: 12px; border-bottom: 1px solid #eee; }
    .totals { margin-left: auto; width: 300px; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .total-row.grand { border-top: 2px solid #333; margin-top: 10px; padding-top: 15px; font-weight: bold; font-size: 20px; }
    .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
    .agt-box { background: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 20px; font-family: monospace; font-size: 11px; color: #666; }
    @media print {
      body { padding: 0; }
      .invoice-card { border: none; width: 100%; max-width: none; }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div class="store-info">
        <h1>${settings.restaurantName}</h1>
        <p>NIF: ${settings.nif}</p>
        <p>${settings.address}</p>
        <p>Tel: ${settings.phone}</p>
      </div>
      <div class="invoice-info">
        <h2>FACTURA RECIBO</h2>
        <p>N.º: <strong>${order.invoiceNumber}</strong></p>
        <p>Data: ${dateStr}</p>
        <p>Hora: ${timeStr}</p>
      </div>
    </div>

    <div class="billing">
      <div class="billing-box">
        <h3>Cliente</h3>
        <p>CONSUMIDOR FINAL</p>
        <p>NIF: ${customerTaxId}</p>
        <p>Condominio Vereda das Flores</p>
      </div>
      <div class="billing-box" style="text-align: right;">
        <h3>Estado</h3>
        <p style="color: #22c55e;">PAGO</p>
      </div>
    </div>

    <div style="margin-bottom: 30px;">
      ${itemsHtml}
    </div>

    <div class="totals">
      <div class="total-row">
        <span>Total Bruto</span>
        <span>${formatKz(grossTotal)}</span>
      </div>
      <div class="total-row">
        <span>Total Imposto (${settings.taxRate}%)</span>
        <span>${formatKz(taxAmount)}</span>
      </div>
      <div class="total-row grand">
        <span>TOTAL</span>
        <span>${formatKz(finalTotal)}</span>
      </div>
    </div>

    <div class="agt-box">
      <div style="margin-bottom: 5px; font-weight: bold;">Certificação AGT</div>
      <div>Software Certificado n.º ${settings.agtCertificate}</div>
      <div>Hash: ${order.hash?.substring(0, 4)}-${order.hash?.substring(4, 8)}...</div>
      <div style="margin-top: 5px;">Os bens/serviços foram colocados à disposição do cliente na data e local do documento.</div>
    </div>

    <div class="footer">
      <p>${settings.regimeIVA}</p>
      <p>Obrigado pela sua preferência!</p>
      <p>Processado por Computador - Operador: ${currentUser?.name || 'Sistema'}</p>
    </div>
  </div>
  <script>
    window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); }
  </script>
</body>
</html>
    `;
  };

  const printInvoice = (order: Order) => {
    const html = generateStandardInvoiceHTML(order);
    printViaIframe(html);
  };

  // Função para gerar HTML de factura térmica (80mm de largura)
  const generateThermalReceiptHTML = (order: Order): string => {
    const formatNumber = (val: number) => new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
    const customerTaxId = order.customerNif || '999999999';
    
    const itemsHtml = order.items.map(item => {
      const dish = menu.find(d => d.id === item.dishId);
      const name = dish?.name || 'Item Desconhecido';
      const unitPrice = formatNumber(item.unitPrice);
      const subTotal = formatNumber(item.unitPrice * item.quantity);

      return `
      <div style="margin-bottom: 8px; border-bottom: 1px dashed #ccc; padding-bottom: 4px;">
        <div style="font-weight: bold; font-size: 16px; margin-bottom: 2px;">
          ${item.quantity} x ${name}
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 13px;">
          <span style="color: #666;">Preço Unit: ${unitPrice}</span>
          <span style="font-weight: bold;">Subtotal: ${subTotal}</span>
        </div>
      </div>`;
    }).join('');

    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-AO', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
    const timeStr = now.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    const grossTotal = order.total - order.taxTotal;
    const taxAmount = order.taxTotal;
    const finalTotal = order.total;
    const itemCount = order.items.reduce((acc, item) => acc + item.quantity, 0);

    const paymentMethodName = order.paymentMethod === 'NUMERARIO' ? 'Numerário' : 
                              order.paymentMethod === 'TPA' ? 'Multicaixa' : 
                              order.paymentMethod === 'TRANSFERENCIA' ? 'Transferência' : 
                              order.paymentMethod === 'QR_CODE' ? 'QR Code' :
                              order.paymentMethod === 'CONTA_CORRENTE' ? 'Conta Corrente' : 'Outro';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Courier New', monospace; width: 80mm; margin: 0; padding: 0; font-size: 14px; color: #000; }
    .page { padding: 5mm; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .bold { font-weight: bold; }
    .uppercase { text-transform: uppercase; }
    
    .header { margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
    .store-name { font-size: 20px; font-weight: bold; margin-bottom: 2px; }
    
    .dashed-line { border-bottom: 1px dashed #000; margin: 5px 0; }
    
    .doc-info { margin: 10px 0; }
    .customer-info { margin: 5px 0; }
    
    .date-time { display: flex; justify-content: space-between; margin: 5px 0; }
    
    .items-header { display: flex; font-weight: bold; border-bottom: 1px dashed #000; padding-bottom: 2px; margin-bottom: 5px; font-size: 14px; }
    
    .total-block { margin: 10px 0; border-top: 1px dashed #000; padding-top: 5px; }
    .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; }
    
    .section-header { text-align: center; margin-bottom: 5px; }
    .info-table { width: 100%; font-size: 14px; }
    .info-row { display: flex; justify-content: space-between; }
    
    .footer-info { margin-top: 15px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header text-center">
      <div class="store-name uppercase">${settings.restaurantName}</div>
      <div>NIF: ${settings.nif}</div>
      <div>Telefone: ${settings.phone}</div>
    </div>
    
    <div class="doc-info text-center">
      <div class="bold">Factura Recibo Nº: ${order.invoiceNumber || 'FR SIM/2026'}</div>
      <div class="bold">ORIGINAL</div>
      
      <div class="customer-info">
        <div>Nome: CONSUMIDOR FINAL</div>
        <div>Contribuinte: ${customerTaxId}</div>
        <div>Morada: Condominio Vereda Das Flores</div>
      </div>
    </div>
    
    <div class="date-time">
      <span>DATA: ${dateStr}</span>
      <span>HORA: ${timeStr}</span>
    </div>
    
    <div class="items-section">
      <div class="items-header" style="display: none;">
        <span>Descrição</span>
        <span>Total</span>
      </div>
      ${itemsHtml}
    </div>
    
    <div class="dashed-line"></div>
    
    <div class="total-row" style="margin: 10px 0;">
      <span class="bold">TOTAL DO DOCUMENTO:</span>
      <span class="bold">${formatKz(finalTotal)}</span>
    </div>
    
    <div class="dashed-line"></div>
    
    <div style="margin: 10px 0;">
      <div class="section-header">Modos de Pagamento</div>
      <div class="info-row bold" style="border-bottom: 1px dashed #000;">
        <span>Metodo</span>
        <span>Moeda</span>
        <span>Total</span>
      </div>
      <div class="info-row">
        <span>${paymentMethodName}</span>
        <span>AOA</span>
        <span>${formatNumber(finalTotal)}</span>
      </div>
    </div>
    
    <div style="margin: 10px 0;">
      <div class="section-header">Resumo de Impostos</div>
      <div class="info-row bold" style="border-bottom: 1px dashed #000;">
        <span>Tx</span>
        <span>Total Imposto</span>
        <span>Incidencia</span>
      </div>
      <div class="info-row">
        <span>${settings.taxRate},00</span>
        <span>${formatNumber(taxAmount)}</span>
        <span>${formatNumber(grossTotal)}</span>
      </div>
      <div style="margin-top: 5px;">
        ${settings.regimeIVA || 'IVA - Regime Geral'}
        ${settings.motivoIsencao ? `<br>Isenção: ${settings.motivoIsencao}` : ''}
      </div>
    </div>
    
    <div class="dashed-line"></div>
    
    <div class="text-center" style="margin: 5px 0;">
      N.º de items: ${itemCount}
    </div>
    
    <div class="dashed-line"></div>
    
    <div class="text-center bold" style="margin: 5px 0;">
      Saldo: 0,00 Kz
    </div>
    
    <div class="footer-info">
      Software Certificado nº ${settings.agtCertificate}<br>
      <strong>${order.hash?.substring(0, 4) || 'SIM'}-Processado por Computador</strong><br>
      Operador: ${currentUser?.name || 'Sistema'}<br>
      <br>
      * Obrigado pela preferência e volte sempre *
      ${settings.openDrawerCode ? `<div style="opacity: 0.01; font-size: 1px;">${settings.openDrawerCode}</div>` : ''}
    </div>
  </div>
  <script>
    window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); }
  </script>
</body>
</html>
    `;
  };

  // Função para gerar Relatório de Fecho de Caixa
  const generateShiftReportHTML = (): string => {
    const shiftOrders = activeOrders.filter(o => o.status === 'FECHADO' && o.shiftId === currentShiftId);
    
    // Totais por método de pagamento
    const totals: Record<string, number> = {
      'NUMERARIO': 0,
      'TPA': 0,
      'TRANSFERENCIA': 0,
      'QR_CODE': 0,
      'CONTA_CORRENTE': 0,
      'OUTROS': 0
    };
    
    let totalSales = 0;
    let totalTax = 0;
    
    shiftOrders.forEach(order => {
      const method = order.paymentMethod || 'OUTROS';
      if (totals[method] !== undefined) {
        totals[method] += order.total;
      } else {
        totals['OUTROS'] += order.total;
      }
      totalSales += order.total;
      totalTax += order.taxTotal;
    });

    const formatNumber = (val: number) => new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-AO', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const timeStr = now.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Relatório de Fecho</title>
  <style>
    body { font-family: 'Courier New', monospace; width: 80mm; margin: 0; padding: 0; font-size: 12px; color: #000; }
    .page { padding: 5mm; }
    .text-center { text-align: center; }
    .bold { font-weight: bold; }
    .uppercase { text-transform: uppercase; }
    .header { margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
    .dashed-line { border-bottom: 1px dashed #000; margin: 5px 0; }
    .section-header { text-align: center; margin: 10px 0 5px 0; font-weight: bold; text-decoration: underline; }
    .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
    .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-top: 5px; border-top: 1px dashed #000; padding-top: 5px; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header text-center">
      <div class="bold uppercase">${settings.restaurantName}</div>
      <div>RELATÓRIO DE FECHO DE CAIXA</div>
      <div>${dateStr} - ${timeStr}</div>
      <div>Operador: ${currentUser?.name || 'Sistema'}</div>
    </div>

    <div class="section-header">VENDAS POR PAGAMENTO</div>
    <div class="row"><span>Numerário:</span><span>${formatNumber(totals['NUMERARIO'])} Kz</span></div>
    <div class="row"><span>Multicaixa:</span><span>${formatNumber(totals['TPA'])} Kz</span></div>
    <div class="row"><span>Transferência:</span><span>${formatNumber(totals['TRANSFERENCIA'])} Kz</span></div>
    <div class="row"><span>QR Code:</span><span>${formatNumber(totals['QR_CODE'])} Kz</span></div>
    <div class="row"><span>Conta Corrente:</span><span>${formatNumber(totals['CONTA_CORRENTE'])} Kz</span></div>
    <div class="row"><span>Outros:</span><span>${formatNumber(totals['OUTROS'])} Kz</span></div>
    
    <div class="dashed-line"></div>
    
    <div class="total-row">
      <span>TOTAL VENDAS:</span>
      <span>${formatNumber(totalSales)} Kz</span>
    </div>

    <div class="row" style="margin-top: 5px; font-size: 9px;">
      <span>Total Impostos:</span>
      <span>${formatNumber(totalTax)} Kz</span>
    </div>

    <div class="dashed-line"></div>
    <div class="text-center bold" style="margin-top: 10px;">
      Nº de Vendas: ${shiftOrders.length}
    </div>
    <br>
    <div class="text-center">
      * Conferência de Caixa *
    </div>
  </div>
  <script>
    window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); }
  </script>
</body>
</html>
    `;
  };

  const printViaIframe = (html: string) => {
    // Remove script tags that might try to self-print/close to avoid conflicts
    const cleanHtml = html.replace(/<script>[\s\S]*?window\.print[\s\S]*?<\/script>/gi, '');
    
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(cleanHtml);
      doc.close();
      
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1000);
      }, 500);
    }
  };

  const handlePrintShiftReport = () => {
    const html = generateShiftReportHTML();
    printViaIframe(html);
  };

  // Função para imprimir em impressora térmica
  const printThermalReceipt = (order: Order) => {
    const html = generateThermalReceiptHTML(order);
    printViaIframe(html);
  };

  const addPayment = (method: PaymentMethod, amount: number) => {
    const newPayment: OrderPayment = {
      id: `pay-${Date.now()}`,
      method,
      amount,
      timestamp: new Date().toISOString()
    };
    setCurrentPayments([...currentPayments, newPayment]);
  };

  const removePayment = (id: string) => {
    setCurrentPayments(currentPayments.filter(p => p.id !== id));
  };

  const handlePayment = () => {
    if (activeOrderId && currentPayments.length > 0 && currentOrder) {
      const totalPaid = currentPayments.reduce((sum, p) => sum + p.amount, 0);
      if (Math.abs(totalPaid - totalWithTax) > 0.01) {
        addNotification('error', 'O valor total pago deve ser igual ao total do pedido.');
        return;
      }

      const normalizedNif = customerNif.trim();
      checkoutTable(activeOrderId, currentPayments, undefined, normalizedNif || undefined);
      
      const finalOrder = { 
        ...currentOrder, 
        status: 'FECHADO' as const, 
        payments: currentPayments,
        paymentMethod: currentPayments.length === 1 ? currentPayments[0].method : undefined,
        invoiceNumber: 'A PROCESSAR...',
        customerNif: normalizedNif || undefined
      };
      
      setPendingOrderForPrint(finalOrder);
      setIsPrintModalOpen(true);
      setIsPaymentModalOpen(false);
      setCurrentPayments([]);
      setCustomerNif('');
      handleOpenDrawer();
    }
  };

  const handleCorrection = async () => {
    if (correctionOrderId && currentPayments.length > 0 && correctionReason) {
      const order = activeOrders.find(o => o.id === correctionOrderId);
      if (!order) return;

      const isPostPrint = order.invoiceNumber && order.invoiceNumber !== 'A PROCESSAR...';
      
      if (isPostPrint) {
        const confirmed = window.confirm(
          'Esta é uma correção PÓS-IMPRESSÃO. \n\n' +
          'A fatura original já foi emitida. Esta correção requer autorização de supervisor e será registada permanentemente.\n\n' +
          'Deseja prosseguir com a correção?'
        );
        if (!confirmed) return;
      }

      const success = await useStore.getState().correctPayment(correctionOrderId, currentPayments, correctionReason);
      if (success) {
        setIsCorrectionModalOpen(false);
        setCorrectionOrderId(null);
        setCorrectionReason('');
        setCurrentPayments([]);
        addNotification('success', isPostPrint ? 'Correção pós-impressão realizada com sucesso.' : 'Pagamento corrigido com sucesso.');
      }
    } else if (!correctionReason) {
      addNotification('warning', 'Por favor, indique o motivo da correção.');
    }
  };

  const handleConfirmPrint = () => {
    if (pendingOrderForPrint) {
      if (selectedPrinter === 'THERMAL') {
        printThermalReceipt(pendingOrderForPrint);
      } else {
        printInvoice(pendingOrderForPrint);
      }
      setIsPrintModalOpen(false);
      setPendingOrderForPrint(null);
      setSelectedPrinter('THERMAL');
      addNotification('success', 'Factura enviada para impressora');
    }
  };

  const handleCloseShift = () => {
    // Verificar permissão
    const { currentUser } = useStore.getState();
    const canClose = currentUser && (
      currentUser.role === 'ADMIN' || 
      (currentUser.permissions?.includes('CLOSE_SHIFT'))
    );

    if (!canClose) {
      addNotification('error', 'Não tem permissão para fechar o caixa.');
      return;
    }

    setClosingAmount('');
    setIsClosingShiftModalOpen(true);
  };

  const confirmCloseShift = () => {
    const amount = Number(closingAmount);
    if (isNaN(amount) || amount < 0) {
      addNotification('error', 'Valor de fecho inválido.');
      return;
    }

    // 1. Imprimir relatório
    handlePrintShiftReport();
    
    // 2. Fechar turno
    setTimeout(() => {
      useStore.getState().closeShift(amount);
      setIsClosingShiftModalOpen(false);
      addNotification('success', 'Caixa fechado com sucesso.');
    }, 500);
  };

  const isImmersive = settings.isSidebarCollapsed;

  const getCategoryIcon = (name: string, predefinedIcon?: string) => {
    if (predefinedIcon) {
      const iconObj = AVAILABLE_ICONS.find(i => i.name === predefinedIcon);
      if (iconObj) {
        const IconComp = iconObj.icon;
        return <IconComp size={20} />;
      }
    }

    const n = name.toLowerCase();
    if (n.includes('bebida') || n.includes('vinho') || n.includes('cerveja')) return <Beer size={20} />;
    if (n.includes('entrada') || n.includes('petisco')) return <Coffee size={20} />;
    if (n.includes('sobremesa') || n.includes('doce')) return <IceCream size={20} />;
    if (n.includes('prato') || n.includes('carne') || n.includes('peixe')) return <Pizza size={20} />;
    return <Tag size={20} />;
  };

  if (!currentShiftId) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-background text-center p-8 animate-in fade-in">
        <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center text-primary mb-6 border border-primary/20 shadow-glow">
          <Lock size={48} />
        </div>
        <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4">Terminal Bloqueado</h2>
        {isOpeningShift ? (
          <div className="glass-panel p-10 rounded-[2.5rem] border border-white/10 w-full max-w-md animate-in zoom-in">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Fundo de Maneio</label>
            <input type="number" autoFocus className="w-full p-6 bg-black/40 border border-slate-700 rounded-2xl text-3xl font-mono font-bold text-white mb-8 outline-none focus:border-primary" value={openingAmount} onChange={e => setOpeningAmount(e.target.value)} />
            <div className="flex gap-4">
              <button onClick={() => setIsOpeningShift(false)} className="flex-1 py-5 text-slate-500 font-black uppercase text-xs tracking-widest">Cancelar</button>
              <button onClick={handleOpenShift} className="flex-1 py-5 bg-primary text-black rounded-2xl font-black uppercase text-xs tracking-widest shadow-glow">Abrir Turno</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setIsOpeningShift(true)} className="px-14 py-6 bg-primary text-black rounded-2xl font-black uppercase tracking-widest shadow-glow flex items-center gap-4">
             <Banknote size={24} /> Iniciar Turno
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden relative bg-background font-sans text-slate-200">
      
      {/* POS Internal Command Bar */}
      <div className="w-20 bg-slate-950 border-r border-white/5 flex flex-col items-center py-4 z-40 shrink-0 h-full">
         <button onClick={toggleSidebar} className="w-14 h-14 shrink-0 rounded-2xl bg-white/5 flex flex-col items-center justify-center text-primary hover:bg-primary hover:text-black transition-all group mb-4" title={isImmersive ? "Ver Menu Principal" : "Expandir POS"}>
            {isImmersive ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            <span className="text-[7px] font-black uppercase mt-1">{isImmersive ? 'Reduzir' : 'Expandir'}</span>
         </button>
         
         <div className="w-10 h-px bg-white/10 shrink-0 mb-4"></div>

         {/* Scrollable Categories Area */}
         <div className="flex-1 w-full flex flex-col items-center gap-4 overflow-y-auto no-scrollbar px-2 pb-4">
             <button 
               onClick={() => setSelectedCategoryId('TODOS')} 
               className={`w-14 h-14 shrink-0 rounded-2xl flex flex-col items-center justify-center transition-all border
                 ${selectedCategoryId === 'TODOS' ? 'bg-primary border-primary text-black shadow-glow' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'}
               `}
             >
               <Grid3X3 size={20} />
               <span className="text-[7px] font-black uppercase mt-1">Tudo</span>
             </button>

             {[...categories].sort((a, b) => a.name.localeCompare(b.name)).map(cat => (
               <button 
                 key={cat.id} 
                 onClick={() => setSelectedCategoryId(cat.id)} 
                 className={`w-14 h-14 shrink-0 rounded-2xl flex flex-col items-center justify-center transition-all border
                   ${selectedCategoryId === cat.id ? 'bg-primary border-primary text-black shadow-glow' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'}
                 `}
                 title={cat.name}
               >
                 {getCategoryIcon(cat.name, cat.icon)}
                 <span className="text-[7px] font-black uppercase mt-1 truncate w-full px-1 text-center">{cat.name.split(' ')[0]}</span>
               </button>
             ))}
         </div>

         <div className="w-10 h-px bg-white/10 shrink-0 my-4"></div>

         {/* Fixed Action Buttons */}
         <div className="flex flex-col gap-4 shrink-0 mb-2">
            <button onClick={() => setIsHistoryModalOpen(true)} className="w-12 h-12 rounded-2xl bg-slate-800 text-purple-400 flex items-center justify-center hover:bg-purple-400 hover:text-black transition-all" title="Histórico de Pedidos">
              <History size={20} />
            </button>
            <button onClick={handlePrintShiftReport} className="w-12 h-12 rounded-2xl bg-slate-800 text-green-400 flex items-center justify-center hover:bg-green-400 hover:text-black transition-all" title="Relatório de Fecho">
              <FileText size={20} />
            </button>
            <button onClick={handleOpenDrawer} className="w-12 h-12 rounded-2xl bg-slate-800 text-yellow-500 flex items-center justify-center hover:bg-yellow-500 hover:text-black transition-all" title="Abrir Gaveta">
              <Banknote size={20} />
            </button>
            <button onClick={handleCloseShift} className="w-12 h-12 rounded-2xl bg-red-900/30 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all border border-red-500/20" title="Fechar Caixa">
              <DoorOpen size={20} />
            </button>
            <button onClick={handleOpenCustomerDisplay} 
              disabled={!activeTableId}
              className="w-12 h-12 rounded-2xl bg-slate-800 text-blue-400 flex items-center justify-center hover:bg-blue-400 hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
              title="Visor Cliente"
            >
              <MonitorPlay size={20} />
            </button>
         </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* TOP SESSION TABS - NOVO SISTEMA MULTI-MESA */}
        <div className="h-16 bg-slate-900/80 border-b border-white/5 flex items-center px-4 gap-2 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1">
          <button 
            onClick={() => { 
              setShowMap(!showMap);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all whitespace-nowrap
              ${showMap ? 'bg-primary text-black border-primary shadow-glow' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'}
            `}
          >
            <LayoutGrid size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Mapa de Mesas</span>
          </button>
          
          <div className="w-px h-6 bg-white/10 mx-2"></div>

          {occupiedTables.map(table => {
            const tableTotal = activeOrders
              .filter(o => o.tableId === table.id && o.status === 'ABERTO')
              .reduce((acc, o) => acc + o.total, 0);
            
            return (
              <button 
                key={table.id}
                onClick={() => { setActiveTable(table.id); setShowTableBar(false); }}
                className={`flex items-center gap-3 px-5 py-2.5 rounded-xl border transition-all whitespace-nowrap group
                  ${activeTableId === table.id ? 'bg-primary/20 border-primary text-primary shadow-glow' : 'bg-slate-800/40 border-white/5 text-slate-400 hover:bg-slate-800'}
                `}
              >
                <div className={`w-2 h-2 rounded-full animate-pulse ${activeTableId === table.id ? 'bg-primary' : 'bg-red-500'}`}></div>
                <div className="text-left">
                  <p className="text-[9px] font-black uppercase tracking-tighter leading-none">{table.name}</p>
                  <p className={`text-[10px] font-mono font-bold mt-0.5 ${activeTableId === table.id ? 'text-white' : 'text-slate-500'}`}>{formatKz(tableTotal)}</p>
                </div>
                {activeTableId === table.id && (
                  <div className="ml-2 p-1 rounded-md bg-primary text-black group-hover:scale-110 transition-transform">
                    <Utensils size={10} />
                  </div>
                )}
              </button>
            );
          })}
          </div>
          <ExportButton {...exportConfig} />
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Table Selection Bar (Mini version) */}
          <div className={`transition-all duration-500 bg-slate-950/40 backdrop-blur-sm border-r border-white/5 flex flex-col relative z-10 ${showTableBar ? 'w-48' : 'w-14 overflow-hidden'}`}>
              <div className="p-4 flex flex-col gap-3 h-full">
                  <div className="flex items-center justify-between mb-2">
                    {showTableBar && <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Mapa</h3>}
                    <button onClick={() => setShowTableBar(!showTableBar)} className="p-1 text-slate-500 hover:text-primary">
                      {showTableBar ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
                      {sortedTables.map(table => (
                      <button key={table.id} onClick={() => { setActiveTable(table.id); setShowTableBar(false); }} 
                          className={`w-full rounded-xl border transition-all flex items-center gap-3
                          ${activeTableId === table.id ? 'border-primary bg-primary/10' : 'border-white/5 bg-white/5'}
                          ${showTableBar ? 'p-3 px-4' : 'p-3 justify-center'}
                          `}
                          title={table.name}
                      >
                          <div className={`w-2 h-2 rounded-full shrink-0 ${table.status === 'LIVRE' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
                          {showTableBar && <span className="font-bold text-white text-[10px] uppercase truncate">{table.name}</span>}
                      </button>
                      ))}
                  </div>
              </div>
          </div>

          {/* Product Menu Area */}
          <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
              <div className="h-20 flex items-center justify-between px-8 bg-slate-900/20 border-b border-white/5">
                  <div className="flex-1 max-w-md relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input type="text" placeholder="Pesquisar pratos ou códigos..." className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/5 rounded-2xl text-sm text-white focus:outline-none focus:border-primary font-bold transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                  </div>
                  {activeTableId && (
                    <div className="ml-4 flex items-center gap-3 animate-in slide-in-from-right">
                       <div className="flex flex-col items-end">
                         <span className="text-[10px] font-black text-primary uppercase tracking-widest">{activeTable?.name}</span>
                         <span className="text-[8px] text-slate-500 font-bold uppercase">{openOrdersForTable.length} Contas ativas</span>
                       </div>
                       <button onClick={() => { setActiveTable(null); setShowTableBar(false); }} className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"><X size={16}/></button>
                    </div>
                  )}
              </div>

              <div className="flex-1 overflow-y-auto p-8 pt-6 no-scrollbar">
                  {showMap ? (
                    <div className="h-full flex flex-col p-4">
                       <div className="flex gap-3 mb-6 overflow-x-auto no-scrollbar shrink-0">
                          {(['INTERIOR', 'EXTERIOR', 'BALCAO'] as TableZone[]).map(zone => {
                             const Icon = zoneConfig[zone].icon;
                             const isActive = activeZone === zone;
                             return (
                               <button
                                 key={zone}
                                 onClick={() => setActiveZone(zone)}
                                 className={`px-6 py-3 rounded-2xl border flex items-center gap-3 transition-all whitespace-nowrap
                                   ${isActive ? 'bg-primary/20 border-primary text-primary shadow-glow' : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300'}
                                 `}
                               >
                                  <Icon size={18} />
                                  <span className="text-xs font-black uppercase tracking-widest">{zoneConfig[zone].label}</span>
                                  <span className="bg-black/20 px-2 py-0.5 rounded text-[10px] opacity-60">{(tables || []).filter(t => t.zone === zone).length}</span>
                               </button>
                             );
                          })}
                       </div>

                       <div className={`flex-1 relative glass-panel rounded-[2.5rem] border-white/5 shadow-2xl overflow-hidden flex items-center justify-center transition-all duration-700 ${zoneConfig[activeZone].bg}`}>
                          <div className="absolute inset-0 pointer-events-none opacity-[0.05]" 
                            style={{ 
                              backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
                              backgroundSize: '40px 40px'
                            }}>
                          </div>

                          <div 
                            className="grid gap-2 relative z-10 p-4" 
                            style={{ 
                              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                              gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
                              width: 'min(98%, 1400px)',
                              height: 'min(90vh, 600px)',
                              aspectRatio: `${GRID_SIZE}/${GRID_ROWS}`
                            }}
                          >
                            {Array.from({ length: GRID_ROWS }).map((_, y) => (
                              Array.from({ length: GRID_SIZE }).map((_, x) => {
                                const table = tables.find(t => t.zone === activeZone && t.x === x && t.y === y);
                                
                                if (!table) return <div key={`${x}-${y}`} />;

                                const isActive = activeOrders.some(o => o.tableId === table.id && o.status === 'ABERTO');
                                const tableTotal = activeOrders
                                   .filter(o => o.tableId === table.id && o.status === 'ABERTO')
                                   .reduce((acc, o) => acc + o.total, 0);

                                return (
                                  <button
                                    key={table.id}
                                    onClick={() => { setActiveTable(table.id); setShowMap(false); }}
                                    style={{ 
                                      gridColumn: x + 1, 
                                      gridRow: y + 1,
                                    }}
                                    className={`relative rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 p-2
                                      ${isActive 
                                        ? 'bg-red-500/20 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                                        : 'bg-white/10 border-white/10 text-slate-300 hover:border-primary/50 hover:bg-primary/20 hover:text-white'}
                                    `}
                                  >
                                     <span className="font-black text-xs uppercase tracking-tighter truncate w-full text-center">{table.name}</span>
                                     {isActive && (
                                       <span className="text-[10px] font-mono font-bold text-red-300 bg-red-950/50 px-1.5 py-0.5 rounded">{formatKz(tableTotal)}</span>
                                     )}
                                     <div className={`w-2 h-2 rounded-full absolute top-2 right-2 ${isActive ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                                  </button>
                                );
                              })
                            ))}
                          </div>
                       </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-12 animate-in fade-in zoom-in duration-300">
                      {filteredMenu.map(dish => (
                          <button 
                              key={dish.id} 
                              type="button"
                              onClick={() => handleProductClick(dish)} 
                              className={`group relative bg-slate-800/20 rounded-[2rem] border border-white/5 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 overflow-hidden flex flex-col active:scale-95 cursor-pointer shadow-lg text-left w-full`}
                          >
                              <div className="aspect-square w-full overflow-hidden relative">
                                  <img src={dish.image} alt={dish.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent"></div>
                                  <div className="absolute bottom-3 left-4 right-4">
                                      <h4 className="font-bold text-[11px] text-white truncate uppercase tracking-tighter">{dish.name}</h4>
                                      <p className="text-[10px] font-mono font-bold text-primary mt-0.5">{formatKz(dish.price)}</p>
                                  </div>
                              </div>
                          </button>
                      ))}
                    </div>
                  )}
              </div>
          </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className={`w-96 border-l border-white/5 flex flex-col h-full z-30 bg-slate-950 shadow-2xl transition-all duration-500 ${!activeTableId ? 'translate-x-full' : ''}`}>
        {activeTableId ? (
          <>
            <div className="p-8 pb-4 h-fit flex flex-col border-b border-white/5 shrink-0">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                      <Utensils size={20} />
                   </div>
                   <div>
                      <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">{activeTable?.name}</h2>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Sessão Ativa</p>
                   </div>
                </div>
                <button onClick={() => setIsSubAccountModalOpen(true)} className="w-10 h-10 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center">
                   <UserPlus size={20} />
                </button>
              </div>

              {/* Sub-account tabs within the table */}
              <div className="flex gap-2 flex-wrap pb-2">
                 {openOrdersForTable.map(order => (
                    <button 
                      key={order.id} 
                      onClick={() => setActiveOrder(order.id)}
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap
                        ${activeOrderId === order.id ? 'bg-primary border-primary text-black shadow-glow' : 'bg-white/5 border-white/10 text-slate-500'}
                      `}
                    >
                      {order.subAccountName}
                    </button>
                 ))}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-3">
                {currentOrder?.items.map((item, idx) => { 
                    const dish = menu.find(d => d.id === item.dishId); 
                    if (!dish) return null; 
                    return (
                        <div key={idx} className="flex gap-4 items-center p-3 bg-white/5 rounded-2xl border border-white/5 group animate-in slide-in-from-right-4">
                            <img src={dish.image} className="w-12 h-12 rounded-xl object-cover" alt="" />
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-white text-[10px] truncate uppercase tracking-tighter">{dish.name}</h4>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-[10px] font-mono font-bold text-primary/80">{formatKz(dish.price * item.quantity)}</span>
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center gap-3 bg-black/40 p-1 rounded-lg">
                                          <button onClick={() => addToOrder(activeTableId!, dish, -1, '', currentOrder.id)} className="w-6 h-6 rounded-md bg-white/5 text-slate-400 flex items-center justify-center hover:bg-white/10"><Minus size={12}/></button>
                                          <span className="text-[10px] font-black text-white w-4 text-center">{item.quantity}</span>
                                          <button onClick={() => addToOrder(activeTableId!, dish, 1, '', currentOrder.id)} className="w-6 h-6 rounded-md bg-primary text-black flex items-center justify-center"><Plus size={12}/></button>
                                      </div>
                                      <button 
                                        onClick={() => removeFromOrder(currentOrder.id, idx)} 
                                        className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all"
                                        title="Remover Item"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {currentOrder?.items.length === 0 && (
                   <div className="h-full flex flex-col items-center justify-center opacity-20 text-center py-20">
                      <ShoppingBasket size={48} className="mb-4" />
                      <p className="text-xs font-black uppercase tracking-widest leading-relaxed">Carrinho vazio.<br/>Adicione produtos.</p>
                   </div>
                )}
            </div>
            
            <div className="p-8 bg-slate-900 border-t border-white/5 shrink-0">
                <div className="flex justify-between items-end mb-6">
                    <div>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Parcial</span>
                      <h3 className="text-3xl font-mono font-bold text-primary leading-none mt-1">{formatKz(totalWithTax)}</h3>
                    </div>
                </div>
                <div className="grid grid-cols-4 gap-3 mb-3">
                    <button onClick={handleOpenDrawer} className="col-span-1 py-4 rounded-2xl bg-slate-800 text-yellow-500 border border-white/5 flex items-center justify-center hover:bg-yellow-500 hover:text-black transition-all">
                       <Banknote size={20} />
                    </button>
                    <button 
                      onClick={() => setIsPaymentModalOpen(true)} 
                      disabled={!currentOrder || currentOrder.items.length === 0}
                      className="col-span-3 py-4 rounded-2xl bg-primary text-black font-black uppercase text-xs tracking-widest shadow-glow hover:brightness-110 transition-all disabled:opacity-20 flex items-center justify-center gap-3"
                    >
                      <CreditCard size={18} /> PAGAMENTO
                    </button>
                </div>
                {activeTableId && (
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setIsTransferModalOpen(true)}
                      className="py-3 rounded-2xl bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 border border-blue-500/30 font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                      <Move size={16} /> TRANSFERIR
                    </button>
                    <button 
                      onClick={() => setIsCloseTableModalOpen(true)}
                      className="py-3 rounded-2xl bg-red-600/20 text-red-400 hover:bg-red-600/40 border border-red-500/30 font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                      <DoorOpen size={16} /> FECHAR MESA
                    </button>
                  </div>
                )}
            </div>
          </>
        ) : null}
      </div>

      {/* Modais */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in">
           <div className="glass-panel rounded-[2rem] w-full max-w-4xl h-[80vh] flex flex-col p-8 border border-white/10 shadow-2xl">
              <div className="flex justify-between items-center mb-6 shrink-0">
                 <div>
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Histórico de Pedidos</h3>
                    <p className="text-slate-400 text-xs mt-1">Turno Atual</p>
                 </div>
                 <button onClick={() => setIsHistoryModalOpen(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all"><X /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                 <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-900/90 backdrop-blur-sm z-10">
                       <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-slate-500">
                          <th className="p-4 font-black">Fatura</th>
                          <th className="p-4 font-black">Hora</th>
                          <th className="p-4 font-black">Cliente/Mesa</th>
                          <th className="p-4 font-black text-right">Total</th>
                          <th className="p-4 font-black text-center">Pagamento</th>
                          <th className="p-4 font-black text-center">Ações</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {activeOrders
                          .filter(o => o.status === 'FECHADO' && o.shiftId === currentShiftId)
                          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                          .map(order => {
                             const table = tables.find(t => t.id === order.tableId);
                             return (
                                <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                                   <td className="p-4 font-mono text-sm text-white">{order.invoiceNumber || 'N/A'}</td>
                                   <td className="p-4 text-sm text-slate-300">{new Date(order.timestamp).toLocaleTimeString('pt-AO', {hour: '2-digit', minute:'2-digit'})}</td>
                                   <td className="p-4 text-sm text-slate-300">
                                      <div className="font-bold text-white">{table?.name || 'Balcão'}</div>
                                      <div className="text-[10px] opacity-50">{order.subAccountName}</div>
                                   </td>
                                   <td className="p-4 text-sm font-mono font-bold text-primary text-right">{formatKz(order.total)}</td>
                                   <td className="p-4 text-center">
                                      <span className="px-2 py-1 rounded-md bg-white/5 text-[10px] font-bold uppercase text-slate-400 border border-white/5">
                                         {order.paymentMethod}
                                      </span>
                                   </td>
                                   <td className="p-4 text-center">
                                      <div className="flex items-center justify-center gap-2">
                                         <button 
                                           onClick={() => printThermalReceipt(order)}
                                           className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-black transition-all"
                                           title="Reimprimir Fatura"
                                         >
                                            <Printer size={16} />
                                         </button>
                                         <button 
                                           onClick={() => {
                                             setCorrectionOrderId(order.id);
                                             setCurrentPayments(order.payments || (order.paymentMethod ? [{
                                               id: `legacy-${order.id}`,
                                               method: order.paymentMethod,
                                               amount: order.total,
                                               timestamp: order.timestamp
                                             }] : []));
                                             setIsCorrectionModalOpen(true);
                                           }}
                                           className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-black transition-all"
                                           title="Corrigir Pagamento"
                                         >
                                            <RotateCcw size={16} />
                                         </button>
                                      </div>
                                   </td>
                                </tr>
                             );
                          })}
                          {activeOrders.filter(o => o.status === 'FECHADO' && o.shiftId === currentShiftId).length === 0 && (
                             <tr>
                                <td colSpan={6} className="p-10 text-center text-slate-500 opacity-50">
                                   <History size={48} className="mx-auto mb-4 opacity-50" />
                                   <p className="uppercase text-xs tracking-widest font-bold">Sem pedidos neste turno</p>
                                </td>
                             </tr>
                          )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}

      {isSubAccountModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in">
           <div className="glass-panel rounded-[3rem] w-full max-w-md p-10 border border-white/10 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Nova Subconta</h3>
                 <button onClick={() => setIsSubAccountModalOpen(false)} className="text-slate-500 hover:text-white"><X /></button>
              </div>
              <div className="space-y-6">
                <div className="space-y-4">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Identificação do Cliente</label>
                    <input type="text" placeholder="Nome para a conta..." className="w-full p-6 bg-white/5 border border-slate-700 rounded-2xl text-xl font-bold text-white focus:border-primary outline-none" value={subAccountName} onChange={e => setSubAccountName(e.target.value)} autoFocus />
                </div>
                <button onClick={handleCreateSubAccount} className="w-full py-6 bg-primary text-black rounded-3xl font-black uppercase tracking-widest shadow-glow hover:brightness-110 transition-all">CRIAR CONTA</button>
              </div>
           </div>
        </div>
      )}

      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in">
           <div className="glass-panel rounded-[3rem] w-full max-w-lg p-10 border border-white/10 shadow-2xl relative text-center">
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Concluir Transação</h3>
                 <button onClick={() => {
                   setIsPaymentModalOpen(false);
                   setCurrentPayments([]);
                   setCustomerNif('');
                 }} className="text-slate-500 hover:text-white"><X /></button>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="p-8 bg-primary/5 border border-primary/20 rounded-[2rem] flex flex-col justify-center">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Total a Pagar</p>
                   <p className="text-4xl font-mono font-bold text-primary text-glow">{formatKz(totalWithTax)}</p>
                </div>
                <div className="p-8 bg-white/5 border border-white/10 rounded-[2rem] flex flex-col justify-center">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Faltante</p>
                   <p className={`text-4xl font-mono font-bold ${Math.max(0, totalWithTax - currentPayments.reduce((sum, p) => sum + p.amount, 0)) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                     {formatKz(Math.max(0, totalWithTax - currentPayments.reduce((sum, p) => sum + p.amount, 0)))}
                   </p>
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">NIF do Cliente (Opcional)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Ex: 500000000"
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-primary outline-none font-mono font-bold text-center"
                  value={customerNif}
                  onChange={(e) => setCustomerNif(e.target.value)}
                />
              </div>

              {/* Lista de Pagamentos Adicionados */}
              {currentPayments.length > 0 && (
                <div className="mb-8 space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                  {currentPayments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-black">
                          {p.method[0]}
                        </div>
                        <span className="text-xs font-bold text-white uppercase tracking-wider">{p.method.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono font-bold text-white">{formatKz(p.amount)}</span>
                        <button onClick={() => removePayment(p.id)} className="text-red-500 hover:text-red-400 p-1">
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-10">
                 {(['NUMERARIO', 'TPA', 'TRANSFERENCIA', 'QR_CODE'] as PaymentMethod[]).map(method => {
                   const remaining = totalWithTax - currentPayments.reduce((sum, p) => sum + p.amount, 0);
                   return (
                     <button key={method} 
                      onClick={() => {
                        if (remaining > 0) {
                          addPayment(method, remaining);
                        }
                      }}
                      disabled={remaining <= 0}
                      className={`py-5 rounded-2xl border-2 font-black text-[10px] tracking-widest uppercase transition-all flex flex-col items-center justify-center gap-2
                        ${remaining <= 0 ? 'opacity-30 grayscale cursor-not-allowed' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white hover:border-primary/50'}`}
                     >
                       {method.replace('_', ' ')}
                     </button>
                   );
                 })}
              </div>
              <button 
                disabled={Math.abs(currentPayments.reduce((sum, p) => sum + p.amount, 0) - totalWithTax) > 0.01} 
                onClick={handlePayment} 
                className="w-full py-6 bg-primary text-black rounded-3xl font-black uppercase tracking-widest shadow-glow disabled:opacity-10 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                FINALIZAR VENDA <ChevronRight size={24} />
              </button>
           </div>
        </div>
      )}

      {isCorrectionModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-[110] flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in">
           <div className="glass-panel rounded-[3rem] w-full max-w-lg p-10 border border-white/10 shadow-2xl relative">
              <div className="flex justify-between items-center mb-10">
                 <div>
                   <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Corrigir Pagamento</h3>
                   <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-1">Pedido: {activeOrders.find(o => o.id === correctionOrderId)?.invoiceNumber || correctionOrderId}</p>
                 </div>
                 <button onClick={() => {
                   setIsCorrectionModalOpen(false);
                   setCorrectionOrderId(null);
                   setCorrectionReason('');
                   setCurrentPayments([]);
                 }} className="text-slate-500 hover:text-white"><X /></button>
              </div>

              <div className="mb-8 space-y-4">
                <div className="p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl">
                  <p className="text-yellow-500 text-[10px] font-black uppercase tracking-widest mb-1">Aviso</p>
                  <p className="text-slate-300 text-xs">Esta ação será registada no log de auditoria e afetará o fecho de caixa atual.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Motivo da Alteração</label>
                  <textarea 
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    placeholder="Ex: Erro do operador, Mudança de preferência do cliente..."
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-yellow-500 outline-none h-24 resize-none"
                  />
                </div>
              </div>

              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Novos Métodos</p>
                  <p className="font-mono font-bold text-white">{formatKz(activeOrders.find(o => o.id === correctionOrderId)?.total || 0)}</p>
                </div>
                
                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2 mb-4">
                  {currentPayments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">{p.method.replace('_', ' ')}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-white">{formatKz(p.amount)}</span>
                        <button onClick={() => removePayment(p.id)} className="text-red-500 hover:text-red-400">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {(['NUMERARIO', 'TPA', 'TRANSFERENCIA', 'QR_CODE'] as PaymentMethod[]).map(method => {
                    const order = activeOrders.find(o => o.id === correctionOrderId);
                    const total = order?.total || 0;
                    const remaining = total - currentPayments.reduce((sum, p) => sum + p.amount, 0);
                    return (
                      <button 
                        key={method}
                        onClick={() => remaining > 0 && addPayment(method, remaining)}
                        disabled={remaining <= 0}
                        className="py-3 rounded-xl border border-white/10 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-20"
                      >
                        {method.split('_')[0]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button 
                disabled={!correctionReason || Math.abs(currentPayments.reduce((sum, p) => sum + p.amount, 0) - (activeOrders.find(o => o.id === correctionOrderId)?.total || 0)) > 0.01}
                onClick={handleCorrection}
                className="w-full py-5 bg-yellow-500 text-black rounded-2xl font-black uppercase tracking-widest shadow-glow-yellow hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                CONFIRMAR CORREÇÃO <Check size={20} />
              </button>
           </div>
        </div>
      )}

      {/* Close Table Without Orders Modal */}
      {isCloseTableModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-3xl border border-white/10 w-full max-w-md p-8 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-white">Fechar Mesa</h3>
              <button
                onClick={() => setIsCloseTableModalOpen(false)}
                className="p-2 hover:bg-red-600/20 rounded-lg transition-colors"
              >
                <X size={20} className="text-red-400" />
              </button>
            </div>

            <div className="mb-8 p-6 bg-red-500/10 border border-red-500/30 rounded-2xl">
              <p className="text-red-400 text-sm font-bold mb-2">Aviso!</p>
              <p className="text-slate-300 text-sm">
                Tem a certeza que deseja fechar <strong>{activeTable?.name}</strong>{openOrdersForTable.length > 0 && ` com ${openOrdersForTable.length} ${openOrdersForTable.length === 1 ? 'conta ativa' : 'contas ativas'}`}? A mesa voltará a estar <strong>LIVRE</strong> imediatamente.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsCloseTableModalOpen(false)}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold uppercase text-xs hover:bg-slate-700 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleCloseTableWithoutOrders}
                className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-black uppercase text-xs shadow-glow hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                <DoorOpen size={16} /> Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Table Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-3xl border border-white/10 w-full max-w-md p-8 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-black text-white">Transferir Mesa</h3>
                <button 
                  onClick={() => setIsTransferHistoryOpen(true)}
                  className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-500/30 hover:bg-blue-500 hover:text-white transition-all"
                >
                  Histórico
                </button>
              </div>
              <button
                onClick={() => {
                  setIsTransferModalOpen(false);
                  setTransferTargetId(null);
                }}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Mesa de Destino</label>
              <div className="grid grid-cols-4 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {tables
                  .filter(t => t.id !== activeTableId)
                  .sort((a, b) => {
                    const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
                    const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
                    return numA - numB;
                  })
                  .map(table => (
                    <button
                      key={table.id}
                      onClick={() => setTransferTargetId(table.id)}
                      className={`p-3 rounded-xl border-2 transition-all text-center flex flex-col items-center justify-center gap-1
                        ${transferTargetId === table.id 
                          ? 'bg-primary/20 border-primary text-primary' 
                          : table.status === 'OCUPADO' 
                            ? 'bg-red-500/10 border-red-500/20 text-red-500/50 cursor-not-allowed'
                            : 'bg-slate-800/40 border-white/5 text-slate-300 hover:border-white/20'
                        }`}
                      disabled={table.status === 'OCUPADO'}
                    >
                      <span className="text-xs font-black">{table.name}</span>
                      <div className={`w-2 h-2 rounded-full ${table.status === 'OCUPADO' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    </button>
                  ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsTransferModalOpen(false);
                  setTransferTargetId(null);
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold uppercase text-xs hover:bg-slate-700 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleTransferTable}
                disabled={!transferTargetId}
                className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-black uppercase text-xs shadow-glow hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-30"
              >
                <Move size={16} /> Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer History Modal */}
      {isTransferHistoryOpen && (
        <div className="fixed inset-0 bg-black/90 z-[110] flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in">
           <div className="glass-panel rounded-[2rem] w-full max-w-2xl h-[60vh] flex flex-col p-8 border border-white/10 shadow-2xl">
              <div className="flex justify-between items-center mb-6 shrink-0">
                 <div>
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Histórico de Transferências</h3>
                    <p className="text-slate-400 text-xs mt-1">Registos de movimentação de mesas</p>
                 </div>
                 <button onClick={() => setIsTransferHistoryOpen(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all"><X /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                 <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-900/90 backdrop-blur-sm z-10">
                       <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-slate-500">
                          <th className="p-4 font-black">Data/Hora</th>
                          <th className="p-4 font-black">Operador</th>
                          <th className="p-4 font-black">Detalhes</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {auditLogs
                          .filter(log => log.action === 'TABLE_TRANSFER')
                          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                          .map(log => (
                             <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4 text-xs text-slate-300">
                                   {new Date(log.timestamp).toLocaleString('pt-AO', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                   })}
                                </td>
                                <td className="p-4 text-xs font-bold text-white">
                                   {String(log.metadata?.operator || 'N/A')}
                                </td>
                                <td className="p-4 text-xs text-slate-400 leading-relaxed">
                                   {log.details}
                                </td>
                             </tr>
                          ))}
                       {auditLogs.filter(log => log.action === 'TABLE_TRANSFER').length === 0 && (
                          <tr>
                             <td colSpan={3} className="p-10 text-center text-slate-500 opacity-50">
                                <Move size={48} className="mx-auto mb-4 opacity-50" />
                                <p className="uppercase text-xs tracking-widest font-bold">Nenhuma transferência registada</p>
                             </td>
                          </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}

      {/* Print Printer Selection Modal */}
      {isPrintModalOpen && pendingOrderForPrint && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-3xl border border-white/10 w-full max-w-md p-8 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-white flex items-center gap-3">
                <Printer size={24} className="text-primary" />
                Imprimir Factura
              </h3>
              <button
                onClick={() => {
                  setIsPrintModalOpen(false);
                  setPendingOrderForPrint(null);
                  setSelectedPrinter('THERMAL');
                }}
                className="p-2 hover:bg-red-600/20 rounded-lg transition-colors"
              >
                <X size={20} className="text-red-400" />
              </button>
            </div>

            <div className="mb-8 space-y-3">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Selecione a Impressora</label>
              
              <button
                onClick={() => setSelectedPrinter('THERMAL')}
                className={`w-full p-4 rounded-2xl border-2 transition-all text-left
                  ${selectedPrinter === 'THERMAL' 
                    ? 'bg-primary/20 border-primary text-primary' 
                    : 'bg-slate-800/40 border-white/5 text-slate-300 hover:border-white/20'
                  }`}
              >
                <div className="font-black uppercase text-sm tracking-wide">🖨️ Impressora Térmica (80mm)</div>
                <div className="text-[11px] text-slate-400 mt-1">Formato otimizado para recibos térmicos</div>
              </button>

              <button
                onClick={() => setSelectedPrinter('STANDARD')}
                className={`w-full p-4 rounded-2xl border-2 transition-all text-left
                  ${selectedPrinter === 'STANDARD' 
                    ? 'bg-primary/20 border-primary text-primary' 
                    : 'bg-slate-800/40 border-white/5 text-slate-300 hover:border-white/20'
                  }`}
              >
                <div className="font-black uppercase text-sm tracking-wide">📄 Impressora Padrão (A4)</div>
                <div className="text-[11px] text-slate-400 mt-1">Formato padrão em folha A4</div>
              </button>
            </div>

            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl">
              <p className="text-blue-400 text-xs font-bold">💡 Dica</p>
              <p className="text-slate-300 text-xs mt-1">Use a impressora térmica para recibos rápidos. A padrão é ideal para cópias administrativas.</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsPrintModalOpen(false);
                  setPendingOrderForPrint(null);
                  setSelectedPrinter('THERMAL');
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold uppercase text-xs hover:bg-slate-700 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmPrint}
                className="flex-1 px-4 py-3 rounded-xl bg-primary text-black font-black uppercase text-xs shadow-glow hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                <Printer size={16} /> Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {isClosingShiftModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-[120] flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in">
          <div className="glass-panel rounded-[3rem] w-full max-w-lg p-10 border border-white/10 shadow-2xl relative">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Fecho de Caixa</h3>
              <button onClick={() => setIsClosingShiftModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-8">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 text-center">Resumo do Turno</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Vendas Totais</p>
                    <p className="text-xl font-mono font-bold text-white">
                      {formatKz(activeOrders
                        .filter(o => (o.status === 'FECHADO' || o.status === 'PAGO') && o.shiftId === currentShiftId)
                        .reduce((acc, o) => acc + o.total, 0))}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Fundo Inicial</p>
                    <p className="text-xl font-mono font-bold text-white">
                      {formatKz(useStore.getState().shifts.find(s => s.id === currentShiftId)?.openingBalance || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest text-center">Valor Real em Caixa</label>
                <div className="relative">
                  <input 
                    type="number" 
                    placeholder="Introduza o valor contado..." 
                    className="w-full p-8 bg-black/40 border border-slate-700 rounded-[2rem] text-4xl font-mono font-bold text-white text-center focus:border-primary outline-none transition-all shadow-inner"
                    value={closingAmount} 
                    onChange={e => setClosingAmount(e.target.value)}
                    autoFocus
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 font-black text-xl">Kz</div>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-2xl flex items-start gap-4">
                <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-500">
                  <AlertCircle size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-yellow-500 text-xs font-bold uppercase tracking-widest mb-1">Aviso de Fecho</p>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    O relatório de fecho será impresso automaticamente. Todas as contas em aberto serão transferidas para o próximo operador.
                  </p>
                </div>
              </div>

              <button 
                onClick={confirmCloseShift} 
                className="w-full py-6 bg-primary text-black rounded-3xl font-black uppercase tracking-widest shadow-glow hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                FINALIZAR E IMPRIMIR <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
