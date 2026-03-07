'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import {
  Search, Minus, Plus, CreditCard, LayoutGrid, Printer,
  Banknote, X, Lock, MonitorPlay, UserPlus,
  Maximize2, Minimize2, ChevronRight, DoorOpen, Move, CircleAlert,
  Tag, ShoppingBasket, FileText, History, Trash2, Home, Sun,
  RotateCcw, Check, Menu, Beer, Coffee, IceCream, Pizza, Grid3X3, Utensils
} from 'lucide-react';
import { AVAILABLE_ICONS } from '@/constants/client-constants';
import Image from 'next/image';
import { PaymentMethod, Order, TableZone, Table, OrderPayment, Dish, Product, AuditLog, OrderItem } from '@/types';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { availableMonitors, primaryMonitor } from '@tauri-apps/api/window';
import ExportButton from '@/components/ExportButton';
import { logger } from '@/services/logger';
import { formatKz, formatKzDetailed } from '@/services/utils/currencyFormatter';
import { normalizeDishImage } from '@/utils/imageUtils';
import { formatDateInLuanda } from '@/utils/date';
import { useTables } from '@/hooks/useTables';
import { getSQLiteClient, ensureSqliteSchema } from '@/lib/sqlite';
import { supabaseService } from '@/services/supabaseService';
import { databaseOperations } from '@/services/database/operations';
import { ensureBalcaoTable } from '@/app/actions/ensureBalcaoTable';
import { generateUUID } from '@/utils/uuid';

const POS = () => {
  // Enable realtime table updates
  useTables();

  const {
    tables, activeTableId, setActiveTable, fetchTables,
    dishes: menu, categories, activeOrders,
    settings, addNotification,
    currentShiftId, toggleMobileMenu, isSidebarCollapsed, toggleSidebar,
    addTable, auditLogs, createNewOrder, addOrderItem, removeOrderItem
  } = useStore();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [currentPayments, setCurrentPayments] = useState<OrderPayment[]>([]);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctionOrderId, setCorrectionOrderId] = useState<string | null>(null);
  const [lastAddedProduct, setLastAddedProduct] = useState<string | null>(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [isSubAccountModalOpen, setIsSubAccountModalOpen] = useState(false);
  const [isCloseTableModalOpen, setIsCloseTableModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isClosingShiftModalOpen, setIsClosingShiftModalOpen] = useState(false);
  const [closingAmount, setClosingAmount] = useState<string>('');
  const [isTransferHistoryOpen, setIsTransferHistoryOpen] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [subAccountName, setSubAccountName] = useState('');
  const [customerNif, setCustomerNif] = useState('');
  const [isOpeningShift, setIsOpeningShift] = useState(false);
  const [openingAmount, setOpeningAmount] = useState<string>('');
  const [showTableBar, setShowTableBar] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('THERMAL');
  const [pendingOrderForPrint, setPendingOrderForPrint] = useState<Order | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [activeZone, setActiveZone] = useState<TableZone>('INTERIOR');
  const [showMap, setShowMap] = useState(false);

  const isImmersive = settings.isSidebarCollapsed;

  // Auto-hide sidebar when entering POS
  useEffect(() => {
    // Auto-collapse sidebar when POS loads
    if (!isSidebarCollapsed) {
      toggleMobileMenu();
    }
  }, [isSidebarCollapsed, toggleMobileMenu]);

  // Garantir que mesa Balcão exista no Supabase
  useEffect(() => {
    const ensureBalcao = async () => {
      try {
        const result = await ensureBalcaoTable();
        if (result.success) {
          console.log('✅ Mesa Balcão garantida no Supabase');
        } else {
          console.error('❌ Erro ao garantir mesa Balcão:', result.error);
        }
      } catch (error) {
        console.error('❌ Erro ao verificar mesa Balcão:', error);
      }
    };
    
    ensureBalcao();
  }, []);

  // Restore sidebar when leaving POS
  useEffect(() => {
    return () => {
      // Restore sidebar when component unmounts (leaving POS)
      if (isSidebarCollapsed) {
        toggleMobileMenu();
      }
    };
  }, [isSidebarCollapsed, toggleMobileMenu]);

  // ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isImmersive) {
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isImmersive, toggleSidebar]);

  // Função unificada para determinar status visual da mesa
  const getTableVisualStatus = (table: Table) => {
    // Se está em estado de atualização, mostrar isso primeiro
    if (table.status === 'UPDATING') return 'UPDATING';
    
    // Verificar se há pedidos abertos
    const hasOpenOrders = activeOrders.some((o: Order) => o.tableId === table.id && o.status === 'ABERTO');
    return hasOpenOrders ? 'OCCUPIED' : 'AVAILABLE';
  };

  const zoneConfig = {
    INTERIOR: { icon: Home, label: 'Interior', bg: 'bg-slate-900/40' },
    EXTERIOR: { icon: Sun, label: 'Exterior', bg: 'bg-blue-900/10' },
    BALCAO: { icon: Beer, label: 'Balcão', bg: 'bg-orange-900/10' },
  };

  const GRID_SIZE = 10;
  const GRID_ROWS = 8;

  // Calculate currentOrder locally
  const currentOrder = activeTableId ? activeOrders.find((o: Order) => o.tableId === activeTableId && o.status === 'ABERTO') : null;
  const activeTable = tables?.find((t: Table) => t.id === activeTableId);

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
    if (tables?.length > 0 && activeTableId && !activeTable) {
      setActiveTable(null);
    }
    
    // If no table is active, ensure we are NOT in map mode unless explicitly requested
    // This handles the "return to table menu" issue when closing a table
    if (!activeTableId) {
        setShowMap(false);
    }
  }, [activeTableId, activeTable, tables?.length, setActiveTable]);

  // TODO: Implementar funcionalidades quando métodos estiverem disponíveis
  const handleAddToOrder = (dish: Dish, quantity: number = 1) => {
    if (!activeTableId) {
      addNotification('error', 'Selecione uma mesa primeiro');
      return;
    }

    // Encontrar ou criar pedido para a mesa
    let order = activeOrders.find((o: Order) => o.tableId === activeTableId && o.status === 'ABERTO');
    
    if (!order) {
      // Criar novo pedido
      const orderId = createNewOrder(activeTableId, `Mesa ${activeTable?.name || activeTableId}`);
      order = activeOrders.find((o: Order) => o.id === orderId);
    }

    if (order) {
      // Adicionar item ao pedido
      const orderItem: OrderItem = {
        id: generateUUID(),
        orderId: order.id,
        dishId: dish.id,
        quantity,
        unitPrice: dish.price,
        price: dish.price,
        name: dish.name,
        status: 'PENDENTE',
        createdAt: new Date().toISOString()
      };

      addOrderItem(order.id, orderItem);
      setLastAddedProduct(dish.name);
      addNotification('success', `${dish.name} adicionado ao pedido`);
    }
  };

  const handleRemoveFromOrder = (itemId: string) => {
    if (!currentOrder) {
      addNotification('error', 'Nenhum pedido ativo');
      return;
    }

    removeOrderItem(currentOrder.id, itemId);
    addNotification('success', 'Item removido do pedido');
  };

  const handleCheckoutTable = () => {
    addNotification('info', 'Funcionalidade de checkout em desenvolvimento');
  };

  const handleCloseTable = () => {
    addNotification('info', 'Funcionalidade de fechar mesa em desenvolvimento');
  };

  const handleTransferTable = (targetTableId: string) => {
    addNotification('info', 'Funcionalidade de transferir mesa em desenvolvimento');
  };

  const handleSelectTable = (table: Table) => {
    setActiveTable(table.id);
    setShowTableBar(true);
  };

  const handleBackToProducts = () => {
    setActiveTable(null);
    setShowTableBar(false);
  };

  // Filter products
  const filteredProducts = menu.filter((product: Dish) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategoryId === 'TODOS' || product.categoryId === selectedCategoryId;
    return matchesSearch && matchesCategory && product.isActive !== false;
  });

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className={`transition-all duration-300 ${isImmersive ? 'w-0' : 'w-64'} bg-gray-800 border-r border-gray-700`}>
        {/* Sidebar content */}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">POS - Tasca do Vereda</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowMap(!showMap)}
                className={`p-2 rounded ${showMap ? 'bg-blue-600' : 'bg-gray-700'}`}
              >
                <LayoutGrid size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex">
          {/* Products/Tables Area */}
          <div className="flex-1 p-4">
            {showMap ? (
              /* Tables Map */
              <div className="grid grid-cols-5 gap-4">
                {tables?.filter((t: Table) => t.zone === activeZone).map((table: Table) => (
                  <button
                    key={table.id}
                    onClick={() => handleSelectTable(table)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      activeTableId === table.id
                        ? 'border-blue-500 bg-blue-600/20'
                        : getTableVisualStatus(table) === 'OCCUPIED'
                        ? 'border-red-500 bg-red-600/20'
                        : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                    }`}
                  >
                    <div className="text-lg font-bold">{table.name}</div>
                    <div className="text-sm opacity-70">{getTableVisualStatus(table)}</div>
                  </button>
                ))}
              </div>
            ) : (
              /* Products Grid */
              <div className="grid grid-cols-4 gap-4">
                {filteredProducts.map((product: Dish) => (
                  <button
                    key={product.id}
                    onClick={() => handleAddToOrder(product)}
                    className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-all border border-gray-700"
                  >
                    {product.imageUrl && (
                      <div className="w-full h-24 mb-2 relative">
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    )}
                    <div className="text-sm font-medium text-left">{product.name}</div>
                    <div className="text-lg font-bold text-blue-400">{formatKz(product.price)}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart Sidebar */}
          {activeTable && currentOrder && (
            <div className="w-96 bg-gray-800 border-l border-gray-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">{activeTable.name}</h2>
                <button onClick={handleBackToProducts}>
                  <X size={20} />
                </button>
              </div>

              {/* Order Items */}
              <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                {currentOrder.items?.map((item: OrderItem, index: number) => (
                  <div key={index} className="flex items-center justify-between bg-gray-700 rounded p-2">
                    <div>
                      <div className="font-medium">{menu.find((d: Dish) => d.id === item.dishId)?.name}</div>
                      <div className="text-sm opacity-70">{item.quantity}x {formatKz(item.unit_price || 0)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleRemoveFromOrder(item.id || '')}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="border-t border-gray-700 pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatKz(currentOrder.total || 0)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 space-y-2">
                <button
                  onClick={handleCheckoutTable}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded transition-colors"
                >
                  Finalizar Pedido
                </button>
                <button
                  onClick={handleCloseTable}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded transition-colors"
                >
                  Fechar Mesa
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default POS;
