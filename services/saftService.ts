
import { Order, Customer, Dish, SystemSettings } from '../types';
import { logger } from './logger';
import { validationService } from './validationService';

/**
 * Gera o ficheiro SAF-T AO (Angola) Versão 1.01
 */
export const generateSAFT = async (
  orders: Order[],
  customers: Customer[],
  menu: Dish[],
  settings: SystemSettings,
  period: { month: number; year: number }
) => {
  try {
    if (!settings?.nif || !settings?.restaurantName) {
      throw new Error('Definições fiscais incompletas: NIF e Nome da Empresa são obrigatórios');
    }
    if (!settings?.agtCertificate) {
      logger.warn('Certificado AGT ausente nas definições', undefined, 'SAFT');
    }

    const closedOrders = orders.filter(o => 
      o.status === 'FECHADO' && 
      new Date(o.timestamp).getMonth() === period.month &&
      new Date(o.timestamp).getFullYear() === period.year
    );

    await validationService.yield();

    // Filtra clientes únicos que tiveram transações no período
    const customerIdsInPeriod = new Set(closedOrders.map(o => o.customerId || 'CONSUMIDOR_FINAL'));
    const activeCustomers = customers.filter(c => customerIdsInPeriod.has(c.id));

    await validationService.yield();

    // Generate Customer segments in chunks
    let customersXml = '';
    for (let i = 0; i < activeCustomers.length; i++) {
      const c = activeCustomers[i];
      customersXml += `
    <Customer>
      <CustomerID>${c.id}</CustomerID>
      <AccountID>Desconhecido</AccountID>
      <CustomerTaxID>${c.nif || '999999999'}</CustomerTaxID>
      <CompanyName>${c.name}</CompanyName>
      <BillingAddress>
        <AddressDetail>Angola</AddressDetail>
        <City>Luanda</City>
        <Country>AO</Country>
      </BillingAddress>
      <SelfBillingIndicator>0</SelfBillingIndicator>
    </Customer>`;
      if (i > 0 && i % 100 === 0) await validationService.yield();
    }

    // Generate Product segments in chunks
    let productsXml = '';
    for (let i = 0; i < menu.length; i++) {
      const d = menu[i];
      productsXml += `
    <Product>
      <ProductType>S</ProductType>
      <ProductCode>${d.id}</ProductCode>
      <ProductDescription>${d.name}</ProductDescription>
      <ProductNumberCode>${d.id}</ProductNumberCode>
    </Product>`;
      if (i > 0 && i % 100 === 0) await validationService.yield();
    }

    // Generate Invoice segments in chunks
    let invoicesXml = '';
    for (let i = 0; i < closedOrders.length; i++) {
      const o = closedOrders[i];
      const invoiceDate = new Date(o.timestamp).toISOString().split('T')[0];
      const invoiceTime = new Date(o.timestamp).toISOString();
      
      let linesXml = '';
      for (let j = 0; j < o.items.length; j++) {
        const item = o.items[j];
        const dish = menu.find(m => m.id === item.dishId);
        const taxCode = dish?.taxCode || 'NOR';
        linesXml += `
        <Line>
          <LineNumber>${j + 1}</LineNumber>
          <ProductCode>${item.dishId}</ProductCode>
          <ProductDescription>${dish?.name || 'Item Desconhecido'}</ProductDescription>
          <Quantity>${item.quantity}</Quantity>
          <UnitOfMeasure>Un</UnitOfMeasure>
          <UnitPrice>${item.unitPrice.toFixed(2)}</UnitPrice>
          <TaxPointDate>${invoiceDate}</TaxPointDate>
          <Description>${dish?.name || 'Item Desconhecido'}</Description>
          <DebitAmount>0.00</DebitAmount>
          <CreditAmount>${(item.quantity * item.unitPrice).toFixed(2)}</CreditAmount>
          <Tax>
            <TaxType>IVA</TaxType>
            <TaxCountryRegion>AO</TaxCountryRegion>
            <TaxCode>${taxCode}</TaxCode>
            <TaxPercentage>${taxCode === 'ISE' ? '0.00' : settings.taxRate.toFixed(2)}</TaxPercentage>
          </Tax>
        </Line>`;
      }

      invoicesXml += `
      <Invoice>
        <InvoiceNo>${o.invoiceNumber}</InvoiceNo>
        <DocumentStatus>
          <InvoiceStatus>N</InvoiceStatus>
          <InvoiceStatusDate>${invoiceTime}</InvoiceStatusDate>
          <SourceID>1</SourceID>
          <SourceBilling>P</SourceBilling>
        </DocumentStatus>
        <SystemEntryDate>${invoiceTime}</SystemEntryDate>
        <Hash>${o.hash || 'SimulatedHash'}</Hash>
        <HashControl>1</HashControl>
        <Period>${period.month + 1}</Period>
        <InvoiceDate>${invoiceDate}</InvoiceDate>
        <InvoiceType>FT</InvoiceType>
        <SourceID>1</SourceID>
        <CustomerID>${o.customerId || 'CONSUMIDOR_FINAL'}</CustomerID>
         ${linesXml}
         <DocumentTotals>
           <TaxPayable>${o.taxTotal.toFixed(2)}</TaxPayable>
           <NetTotal>${(o.total - o.taxTotal).toFixed(2)}</NetTotal>
           <GrossTotal>${o.total.toFixed(2)}</GrossTotal>
         </DocumentTotals>
       </Invoice>`;

      if (i > 0 && i % 50 === 0) await validationService.yield();
    }

    const lastDay = new Date(period.year, period.month + 1, 0).getDate();
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<AuditFile xmlns="urn:OECD:StandardAuditFile-Tax:AO:1.01" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Header>
    <AuditFileVersion>1.01_01</AuditFileVersion>
    <CompanyID>${settings.nif}</CompanyID>
    <TaxRegistrationNumber>${settings.nif}</TaxRegistrationNumber>
    <TaxAccountingBasis>F</TaxAccountingBasis>
    <CompanyName>${settings.restaurantName}</CompanyName>
    <BusinessName>${settings.restaurantName}</BusinessName>
    <CompanyAddress>
      <AddressDetail>${settings.address}</AddressDetail>
      <City>Luanda</City>
      <Province>Luanda</Province>
      <Country>AO</Country>
    </CompanyAddress>
    <FiscalYear>${period.year}</FiscalYear>
    <StartDate>${period.year}-${(period.month + 1).toString().padStart(2, '0')}-01</StartDate>
    <EndDate>${period.year}-${(period.month + 1).toString().padStart(2, '0')}-${String(lastDay).padStart(2, '0')}</EndDate>
    <CurrencyCode>AOA</CurrencyCode>
    <DateCreated>${new Date().toISOString().split('T')[0]}</DateCreated>
    <TaxEntity>Global</TaxEntity>
    <ProductCompanyID>QM_Rest_AI_Systems</ProductCompanyID>
    <SoftwareCertificateNumber>${settings.agtCertificate}</SoftwareCertificateNumber>
  </Header>
  <MasterFiles>
    ${customersXml}
    ${productsXml}
    <TaxTable>
      <TaxTableEntry>
        <TaxType>IVA</TaxType>
        <TaxCountryRegion>AO</TaxCountryRegion>
        <TaxCode>NOR</TaxCode>
        <Description>Taxa Normal</Description>
        <TaxPercentage>${Number(settings.taxRate).toFixed(2)}</TaxPercentage>
      </TaxTableEntry>
      <TaxTableEntry>
        <TaxType>IVA</TaxType>
        <TaxCountryRegion>AO</TaxCountryRegion>
        <TaxCode>ISE</TaxCode>
        <Description>Isento</Description>
        <TaxPercentage>0.00</TaxPercentage>
      </TaxTableEntry>
    </TaxTable>
  </MasterFiles>
  <SourceDocuments>
    <SalesInvoices>
      <NumberOfEntries>${closedOrders.length}</NumberOfEntries>
      <TotalDebit>0.00</TotalDebit>
      <TotalCredit>${closedOrders.reduce((acc, o) => acc + o.total, 0).toFixed(2)}</TotalCredit>
      ${invoicesXml}
    </SalesInvoices>
  </SourceDocuments>
</AuditFile>`;

    logger.info('SAF-T gerado com sucesso', { 
      orderCount: closedOrders.length, 
      period 
    }, 'SAFT');

    return xml;
  } catch (e: unknown) {
    const error = e as Error;
    logger.error('Erro ao processar SAF-T', { error: error.message }, 'SAFT');
    throw error;
  }
};

export const downloadSAFT = (xml: string, filename: string) => {
  try {
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Compute SHA-256 hash and offer .sha256 download
    const computeHash = async () => {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(xml);
        const digest = await (window.crypto?.subtle?.digest('SHA-256', data));
        if (!digest) throw new Error('Crypto digest indisponível');
        const hashHex = Array.from(new Uint8Array(digest))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        const hashBlob = new Blob([hashHex], { type: 'text/plain' });
        const hashUrl = URL.createObjectURL(hashBlob);
        const hashLink = document.createElement('a');
        hashLink.href = hashUrl;
        hashLink.download = `${filename}.sha256`;
        document.body.appendChild(hashLink);
        hashLink.click();
        document.body.removeChild(hashLink);
        logger.info('SAF-T descarregado com sucesso', { filename, hash: hashHex }, 'SAFT');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.warn('Falha ao gerar hash SHA-256 do SAF-T', { filename, error: msg }, 'SAFT');
      }
    };
    // Fire and forget
    void computeHash();
  } catch (e: unknown) {
    const error = e as Error;
    logger.error('Erro ao descarregar SAF-T', { filename, error: error.message }, 'SAFT');
  }
};
