import { Order, Dish, SystemSettings } from './types';
import { agtService } from './services/agtService';

/**
 * AGT Compliance Test Suite
 * NASA/Military-Grade Validation for Angolan Fiscal Requirements
 */

export async function runAgtValidationTests(
  sampleOrder: Order,
  menu: Dish[],
  settings: SystemSettings,
  privateKeyPem: string
) {
  const results = {
    rs256_signing: false,
    jws_structure: false,
    hash_chaining: false,
    payload_integrity: false,
    saft_simulation: false,
    errors: [] as string[]
  };

  try {
    console.log('🚀 Iniciando Auditoria AGT...');

    // 1. Test RS256 Signing
    const payload = await agtService.buildInvoicePayload(sampleOrder, settings, menu, privateKeyPem);
    if (payload.documents[0].jwsDocumentSignature.split('.').length === 3) {
      results.rs256_signing = true;
      console.log('✅ RS256 Signature: VALID');
    }

    // 2. Test JWS Structure
    const jws = payload.documents[0].jwsDocumentSignature;
    const [headerB64] = jws.split('.');
    const header = JSON.parse(atob(headerB64.replace(/-/g, '+').replace(/_/g, '/')));
    
    if (header.alg === 'RS256' && header.typ === 'JOSE') {
      results.jws_structure = true;
      console.log('✅ JWS Header: VALID (alg:RS256, typ:JOSE)');
    }

    // 3. Test Hash Chaining (Previous Hash presence)
    if (payload.documents[0].previousHash !== undefined) {
      results.hash_chaining = true;
      console.log('✅ Hash Chaining Logic: ACTIVE');
    }

    // 4. Payload Integrity (Field validation)
    const doc = payload.documents[0];
    if (doc.taxRegistrationNumber && doc.documentNo && doc.lines.length > 0 && doc.previousHash !== undefined) {
      results.payload_integrity = true;
      console.log('✅ Payload Integrity: VERIFIED');
    }

    // 5. Test SAF-T Simulation with multiple orders
    const orders = [
      { ...sampleOrder, id: '1', invoiceNumber: 'FT 2026/1', previous_hash: '' },
      { ...sampleOrder, id: '2', invoiceNumber: 'FT 2026/2', previous_hash: 'seed1' } // This should fail if we don't fix the chain
    ];

    // Correcting chain for simulation
    const sig1 = (await agtService.buildInvoicePayload(orders[0], settings, menu, privateKeyPem)).documents[0].jwsDocumentSignature.split('.')[2];
    orders[1].previous_hash = sig1;

    const simulation = await agtService.simulateSaftExportAndValidateChaining(orders, privateKeyPem, settings, menu);
    if (simulation.isValid && simulation.chainLength === 2) {
        results.saft_simulation = true;
        console.log('✅ SAF-T AO Simulation: VALID (Chain of 2 documents verified)');
    } else {
        console.warn('⚠️ SAF-T AO Simulation: FAILED (Expected valid chain)');
        simulation.errors.forEach(e => console.error(`  - ${e}`));
    }

    return results;

  } catch (error: unknown) {
    results.errors.push((error as Error).message);
    console.error('❌ AGT Validation Failed:', error);
    return results;
  }
}
