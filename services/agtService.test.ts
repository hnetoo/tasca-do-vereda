import { describe, it, expect } from 'vitest';
import { buildInvoicePayload, generateNewKeyPair, signInvoice } from './agtService';
import { Order, Dish, SystemSettings } from '../types';
import * as nodeCrypto from 'crypto';

// Polyfill window.crypto for Node.js environment
if (typeof window === 'undefined') {
    Object.defineProperty(global, 'window', {
        value: global,
        writable: true,
        configurable: true,
    });
}

if (!window.crypto) {
    // Node 19+ has global crypto, older versions need polyfill
    if (global.crypto && global.crypto.subtle) {
        Object.defineProperty(window, 'crypto', {
            value: global.crypto
        });
    } else if (nodeCrypto.webcrypto) {
         Object.defineProperty(window, 'crypto', {
            value: nodeCrypto.webcrypto
        });
    } else {
        console.warn('Neither global.crypto nor node:crypto.webcrypto found. Crypto tests might fail.');
    }
}

// Mock Order
const mockOrder: Order = {
    id: 'order-123',
    tableId: 1,
    items: [
        {
            dishId: 'd1',
            quantity: 2,
            unitPrice: 1000,
            taxAmount: 280,
            status: 'ENTREGUE'
        }
    ],
    status: 'FECHADO',
    total: 2000, // Net total
    taxTotal: 280,
    timestamp: new Date(),
    invoiceNumber: 'FT 2025/1',
    paymentMethod: 'NUMERARIO',
    hash: ''
};

// Mock Menu
const mockMenu: Dish[] = [
    {
        id: 'd1',
        name: 'Bitoque',
        price: 1000,
        categoryId: 'c1',
        taxCode: 'NOR',
        image: 'img.jpg',
        description: 'Bitoque com ovo'
    }
];

// Mock Settings
const mockSettings: SystemSettings = {
    restaurantName: "Tasca Teste",
    currency: "Kz",
    taxRate: 14,
    phone: "999",
    address: "Luanda",
    nif: "5000000000",
    commercialReg: "CR123",
    agtCertificate: "CERT-001",
    invoiceSeries: "2025",
    regimeIVA: "Regime Geral",
    kdsEnabled: true,
    isSidebarCollapsed: false,
    apiToken: "TOKEN",
    webhookEnabled: false
};

describe('AGT Service', () => {
    
    // We need to ensure crypto is available. 
    // If running in Node environment without global crypto (older node), this might fail.
    // Vitest usually polyfills this in jsdom environment.
    
    let keyPair: { privateKey: string, publicKey: string };

    it('should generate a new RSA key pair', async () => {
        // Skip if window.crypto is not available (e.g. some CI environments)
        if (!window.crypto || !window.crypto.subtle) {
            console.warn('Skipping crypto test: window.crypto not available');
            return;
        }

        keyPair = await generateNewKeyPair();
        expect(keyPair).toBeDefined();
        expect(keyPair.privateKey).toContain('BEGIN PRIVATE KEY');
        expect(keyPair.publicKey).toContain('BEGIN PUBLIC KEY');
    });

    it('should build a valid invoice payload', async () => {
        if (!keyPair) {
             // Generate on the fly if previous test skipped or failed
             if (window.crypto && window.crypto.subtle) {
                keyPair = await generateNewKeyPair();
             } else {
                 return; 
             }
        }

        const payload = await buildInvoicePayload(mockOrder, mockSettings, mockMenu, keyPair.privateKey);
        
        expect(payload).toBeDefined();
        expect(payload.schemaVersion).toBe("1.2");
        expect(payload.taxRegistrationNumber).toBe(mockSettings.nif);
        expect(payload.documents).toHaveLength(1);
        
        const doc = payload.documents[0];
        expect(doc.documentType).toBe("FT");
        expect(doc.documentNo).toBe(mockOrder.invoiceNumber);
        expect(doc.lines).toHaveLength(1);
        expect(doc.lines[0].productDescription).toBe('Bitoque');
        expect(doc.lines[0].unitPrice).toBe(1000);
        
        // Check if JWS is generated (simple check)
        expect(doc.jwsDocumentSignature).toBeDefined();
        expect(doc.jwsDocumentSignature.split('.')).toHaveLength(3);
    });

    it('should sign an invoice and return hash', async () => {
         if (!keyPair) return;

         const hash = await signInvoice(mockOrder, "prev-hash", keyPair.privateKey, mockMenu, mockSettings);
         
         expect(hash).toBeDefined();
         expect(typeof hash).toBe('string');
         expect(hash.length).toBeGreaterThan(10);
    });
});
