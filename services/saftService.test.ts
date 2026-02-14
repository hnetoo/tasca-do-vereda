import { describe, it, expect } from 'vitest';
import { generateSAFT } from './saftService';
import { Order, Customer, Dish, SystemSettings } from '../types';

const makeOrder = (id: string, isoDate: string): Order => ({
  id,
  tableId: 1,
  items: [
    { dishId: 'd1', quantity: 2, unitPrice: 1000, taxAmount: 280, status: 'ENTREGUE' }
  ],
  status: 'FECHADO',
  total: 2000,
  taxTotal: 280,
  timestamp: new Date(isoDate),
  invoiceNumber: `FT 2026/${id}`,
  paymentMethod: 'NUMERARIO'
} as unknown as Order);

describe('SAFT Service', () => {
  const customers: Customer[] = [
    { id: 'c1', name: 'Consumidor Final', createdAt: new Date(), updatedAt: new Date() }
  ] as unknown as Customer[];

  const menu: Dish[] = [
    { id: 'd1', name: 'Bitoque', price: 1000, categoryId: 'food', taxCode: 'NOR' }
  ] as unknown as Dish[];

  const settings: SystemSettings = {
    restaurantName: 'Tasca Vereda',
    currency: 'AOA',
    taxRate: 14,
    address: 'Luanda',
    nif: '500000000',
    agtCertificate: 'C_000',
    invoiceSeries: '2026',
    retencaoFonte: 0,
    regimeIVA: 'Normal',
    kdsEnabled: false,
    isSidebarCollapsed: false,
    apiToken: '',
    webhookEnabled: false,
    qrMenuUrl: '',
    qrMenuCloudUrl: '',
    qrMenuShortCode: '',
    qrMenuTitle: '',
    qrMenuLogo: ''
  } as unknown as SystemSettings;

  it('should generate EndDate with last day of month (non-leap Feb)', async () => {
    const orders: Order[] = [
      makeOrder('1', '2026-02-10T12:00:00Z'),
      makeOrder('2', '2026-02-15T12:00:00Z')
    ];
    const xml = await generateSAFT(orders, customers, menu, settings, { month: 1, year: 2026 });
    expect(xml).toContain('<EndDate>2026-02-28</EndDate>');
    expect(xml).toContain('<TaxPercentage>14.00</TaxPercentage>');
    expect(xml).toMatch(/<SystemEntryDate>.*<\/SystemEntryDate>/);
  });

  it('should include correct totals and period', async () => {
    const orders: Order[] = [
      makeOrder('3', '2026-02-20T12:00:00Z')
    ];
    const xml = await generateSAFT(orders, customers, menu, settings, { month: 1, year: 2026 });
    expect(xml).toContain('<NumberOfEntries>1</NumberOfEntries>');
    expect(xml).toContain('<Period>2</Period>');
    expect(xml).toContain('<GrossTotal>2000.00</GrossTotal>');
    expect(xml).toContain('<TaxPayable>280.00</TaxPayable>');
  });
});
