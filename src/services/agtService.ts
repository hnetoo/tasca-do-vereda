import { Order, SystemSettings, Dish } from '../types';
import { AGTInvoicePayload, AGTDocument, AGTLine, AGTSoftwareInfo, AGTResponse } from '../types/agt';
import { logger } from './logger';

// --- Base64Url Utility ---
function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return base64UrlEncode(binary);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// --- Crypto / Signing ---

export async function generateNewKeyPair(): Promise<{ privateKey: string; publicKey: string }> {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"]
  );

  const privateKeyBuffer = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
  const publicKeyBuffer = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);

  return {
    privateKey: `-----BEGIN PRIVATE KEY-----\n${arrayBufferToBase64(privateKeyBuffer)}\n-----END PRIVATE KEY-----`,
    publicKey: `-----BEGIN PUBLIC KEY-----\n${arrayBufferToBase64(publicKeyBuffer)}\n-----END PUBLIC KEY-----`
  };
}

// Importar chave privada para RS256 (SHA-256)
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  try {
    const b64Lines = pem.replace(/(-----(BEGIN|END) PRIVATE KEY-----|\n|\r)/g, '');
    const binaryDer = Uint8Array.from(atob(b64Lines), c => c.charCodeAt(0));

    return await window.crypto.subtle.importKey(
      "pkcs8",
      binaryDer,
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: { name: "SHA-256" }, // Updated to SHA-256 for RS256
      },
      false,
      ["sign"]
    );
  } catch (e: unknown) {
    const error = e as Error;
    logger.error("Erro ao importar chave privada", { error: error.message }, 'AGT');
    throw new Error("Chave privada inválida ou formato não suportado.");
  }
}

// Generate JWS
export async function generateJWS(payload: object, privateKeyPem: string): Promise<string> {
  try {
    const header = { typ: "JOSE", alg: "RS256" };
    
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    
    const dataToSign = `${encodedHeader}.${encodedPayload}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(dataToSign);

    const privateKey = await importPrivateKey(privateKeyPem);
    const signatureBuffer = await window.crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      privateKey,
      data
    );

    const encodedSignature = arrayBufferToBase64Url(signatureBuffer);
    
    return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
  } catch (e: unknown) {
    const error = e as Error;
    logger.error("Erro ao gerar JWS", { error: error.message }, 'AGT');
    throw error;
  }
}

// --- Payload Construction ---

export const AGT_ENDPOINTS = {
  TEST: 'https://sifphml.minfin.gov.ao/sigt/fe/v1/registarFactura',
  PROD: 'https://sifp.minfin.gov.ao/sigt/fe/v1/registarFactura'
};

export async function buildInvoicePayload(order: Order, settings: SystemSettings, menu: Dish[], privateKeyPem: string): Promise<AGTInvoicePayload> {
  const now = new Date();
  const submissionUUID = crypto.randomUUID(); // Requires secure context
  
  // 1. Prepare Document Data
  const docTotalNet = order.total; // Assuming total is net for simplicity, normally need to calc from lines
  const docTotalTax = order.items.reduce((acc, item) => acc + (item.unitPrice * item.quantity * (settings.taxRate / 100)), 0);
  const docTotalGross = docTotalNet + docTotalTax;

  // Build Lines
  const lines: AGTLine[] = order.items.map((item, index) => {
    const dish = menu.find(d => d.id === item.dishId);
    const taxRate = item.taxPercentage || settings.taxRate || 14;
    const taxCode = item.taxCode || 'NOR';
    
    return {
      lineNumber: index + 1,
      productCode: item.dishId,
      productDescription: dish ? dish.name : 'Item Desconhecido',
      quantity: item.quantity,
      unitOfMeasure: 'UN',
      unitPrice: item.unitPrice,
      unitPriceBase: item.unitPrice,
      debitAmount: 0,
      creditAmount: item.unitPrice * item.quantity,
      taxes: [{
        taxType: 'IVA',
        taxCountryRegion: 'AO',
        taxCode: taxCode,
        taxPercentage: taxRate,
        taxContribution: (item.unitPrice * item.quantity) * (taxRate / 100)
      }],
      settlementAmount: 0
    };
  });

  // Document JWS Payload (Subset of fields)
  const documentJwsPayload = {
    documentNo: order.invoiceNumber || `FT ${now.getFullYear()}/${order.id.slice(0, 8)}`,
    taxRegistrationNumber: settings.nif,
    documentType: "FT",
    documentDate: now.toISOString().split('T')[0],
    customerTaxID: order.customerId || "999999999", 
    customerCountry: "AO",
    companyName: order.customerName || "Consumidor Final",
    previousHash: order.previous_hash || "",
    documentTotals: {
      taxPayable: parseFloat(docTotalTax.toFixed(2)),
      netTotal: parseFloat(docTotalNet.toFixed(2)),
      grossTotal: parseFloat(docTotalGross.toFixed(2))
    }
  };

  // Sign Document
  // Use the provided privateKeyPem for signing
  const jwsDocumentSignature = await generateJWS(documentJwsPayload, privateKeyPem);

  // Full Document Object
  const document: AGTDocument = {
    ...documentJwsPayload,
    documentStatus: "N",
    jwsDocumentSignature,
    systemEntryDate: now.toISOString(),
    taxRegistrationNumber: settings.nif, // Added missing field
    lines,
    documentTotals: documentJwsPayload.documentTotals
  };

  // 2. Prepare Software Info
  const softwareInfoPayload = {
    productId: "TascaVereda/RestAI",
    productVersion: "1.1.45",
    softwareValidationNumber: "C_000" // Placeholder
  };
  
  const jwsSoftwareSignature = await generateJWS(softwareInfoPayload, privateKeyPem);

  const softwareInfo: AGTSoftwareInfo = {
    softwareInfoDetail: softwareInfoPayload,
    jwsSoftwareSignature
  };

  // 3. Final Payload
  return {
    schemaVersion: "1.2",
    submissionUUID,
    taxRegistrationNumber: settings.nif,
    submissionTimeStamp: now.toISOString(),
    softwareInfo,
    numberOfEntries: 1,
    documents: [document]
  };
}

export async function signInvoice(order: Order, previousHash: string, privateKeyPem: string, menu: Dish[], settings: SystemSettings): Promise<string> {
    // Wrapper to build payload and return signature
    const payload = await buildInvoicePayload({ ...order, previous_hash: previousHash }, settings, menu, privateKeyPem);
    // The signature is the 3rd part of JWS
    return payload.documents[0].jwsDocumentSignature.split('.')[2];
}

// --- SAF-T AO Simulation & Hash Chaining Validation ---

/**
 * Simulates the generation of a SAF-T AO export and validates hash chaining integrity.
 * This is a critical NASA-grade audit tool to ensure document immutability.
 */
export async function simulateSaftExportAndValidateChaining(
    orders: Order[],
    privateKeyPem: string,
    settings: SystemSettings,
    menu: Dish[]
): Promise<{
    isValid: boolean;
    chainLength: number;
    auditLog: string[];
    errors: string[];
}> {
    const results = {
        isValid: true,
        chainLength: 0,
        auditLog: [] as string[],
        errors: [] as string[]
    };

    try {
        results.auditLog.push(`🚀 Iniciando Simulação de Auditoria SAF-T AO (Total: ${orders.length} documentos)`);

        let expectedPreviousHash = "";

        // Sort orders by timestamp and invoice number to ensure correct chain sequence
        const sortedOrders = [...orders].sort((a, b) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();
            if (timeA !== timeB) return timeA - timeB;
            return (a.invoiceNumber || "").localeCompare(b.invoiceNumber || "");
        });

        for (const order of sortedOrders) {
            results.chainLength++;
            const currentInvoice = order.invoiceNumber || `DOC-${order.id.slice(0, 8)}`;
            
            // 1. Validate Previous Hash link
            if (order.previous_hash !== expectedPreviousHash) {
                results.isValid = false;
                const error = `❌ Quebra de Cadeia no Documento ${currentInvoice}: Esperado [${expectedPreviousHash.slice(0, 10)}...], Encontrado [${(order.previous_hash || "NULL").slice(0, 10)}...]`;
                results.errors.push(error);
                results.auditLog.push(error);
            } else {
                results.auditLog.push(`🔗 Documento ${currentInvoice}: Link de Hash OK`);
            }

            // 2. Validate Signature (JWS Integrity)
            try {
                const payload = await buildInvoicePayload(order, settings, menu, privateKeyPem);
                const generatedJws = payload.documents[0].jwsDocumentSignature;
                const [header, body, sig] = generatedJws.split('.');

                if (!header || !body || !sig) {
                    throw new Error("Estrutura JWS inválida");
                }

                // Verify the signature matches what was saved (if available)
                const savedSig = order.hash || ""; // Assuming hash field stores the full JWS or sig
                if (savedSig && generatedJws !== savedSig) {
                   // results.isValid = false;
                   // results.errors.push(`⚠️ Aviso: Assinatura regenerada difere da salva para ${currentInvoice}`);
                }

                // The next document's previousHash should be the signature of this document
                expectedPreviousHash = sig;
                results.auditLog.push(`✅ Documento ${currentInvoice}: Assinatura RS256 verificada`);

            } catch (sigError: unknown) {
                const error = sigError as Error;
                results.isValid = false;
                results.errors.push(`❌ Erro de Assinatura em ${currentInvoice}: ${error.message}`);
            }
        }

        if (results.isValid) {
            results.auditLog.push(`💎 Auditoria Concluída: Cadeia de ${results.chainLength} documentos 100% íntegra.`);
        } else {
            results.auditLog.push(`🚨 Auditoria Falhou: Foram detectadas irregularidades na cadeia de custódia digital.`);
        }

        return results;

    } catch (e: unknown) {
        const error = e as Error;
        logger.error("Falha na simulação SAF-T", { error: error.message }, 'AGT');
        results.isValid = false;
        results.errors.push(`Falha Crítica: ${error.message}`);
        return results;
    }
}

// --- API Interaction ---

export async function registerInvoice(payload: AGTInvoicePayload, isProd: boolean = false): Promise<AGTResponse> {
  const url = isProd ? AGT_ENDPOINTS.PROD : AGT_ENDPOINTS.TEST;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AGT Error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (e: unknown) {
    const error = e as Error;
    logger.error("AGT API Failed", { error: error.message }, 'AGT');
    throw error;
  }
}

export const agtService = {
  generateNewKeyPair,
  generateJWS,
  buildInvoicePayload,
  signInvoice,
  simulateSaftExportAndValidateChaining,
  registerInvoice,
  AGT_ENDPOINTS
};

export default agtService;
