'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { logger } from '@/services/logger';
import { Order } from '@/types';

// Componente de debug para o carrinho do POS
export default function DebugCart() {
  const { activeOrders, activeOrderId, activeTableId } = useStore();

  // Calcular currentOrder localmente
  const currentOrder = useMemo(() => 
    activeOrderId ? activeOrders.find((o: Order) => o.id === activeOrderId) : null,
    [activeOrders, activeOrderId]
  );

  // Calcular debugInfo usando useMemo para evitar setState em useEffect
  const debugInfo = useMemo(() => ({
    activeOrders: activeOrders?.length || 0,
    activeOrderId,
    activeTableId,
    currentOrderExists: !!currentOrder,
    currentOrderId: currentOrder?.id,
    currentOrderItems: currentOrder?.items?.length || 0,
    currentOrderTotal: currentOrder?.total || 0,
    allOrders: activeOrders?.map(o => ({
      id: o.id,
      tableId: o.tableId || o.table_id,
      status: o.status,
      itemsCount: o.items?.length || 0,
      total: o.total
    }))
  }), [activeOrders, activeOrderId, activeTableId, currentOrder]);

  // Log apenas quando debugInfo mudar
  useEffect(() => {
    console.log('🛒 DEBUG CART INFO:', debugInfo);
    console.log('🛒 CURRENT ORDER:', currentOrder);
    console.log('🛒 ALL ACTIVE ORDERS:', activeOrders);
  }, [debugInfo, currentOrder, activeOrders]);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs max-w-sm z-50 font-mono">
      <h3 className="font-bold mb-2 text-yellow-400">🛒 DEBUG CART</h3>
      
      <div className="space-y-1">
        <div>Active Orders: {debugInfo.activeOrders}</div>
        <div>Active Order ID: {debugInfo.activeOrderId || 'null'}</div>
        <div>Active Table ID: {debugInfo.activeTableId || 'null'}</div>
        <div>Current Order Exists: {debugInfo.currentOrderExists ? '✅' : '❌'}</div>
        <div>Current Order ID: {debugInfo.currentOrderId || 'null'}</div>
        <div>Current Order Items: {debugInfo.currentOrderItems}</div>
        <div>Current Order Total: {debugInfo.currentOrderTotal}</div>
        
        {debugInfo.allOrders && debugInfo.allOrders.length > 0 && (
          <div className="mt-2 pt-2 border-t border-white/20">
            <div className="font-bold text-green-400">All Orders:</div>
            {debugInfo.allOrders.map((order: any) => (
              <div key={order.id} className="ml-2">
                • {order.id} (Table: {order.tableId}, Items: {order.itemsCount}, Total: {order.total})
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
