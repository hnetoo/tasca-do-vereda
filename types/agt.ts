export interface AGTSoftwareInfo {
  softwareInfoDetail: {
    productId: string;
    productVersion: string;
    softwareValidationNumber: string;
  };
  jwsSoftwareSignature: string;
}

export interface AGTTax {
  taxType: string; // e.g., "IVA"
  taxCountryRegion: string; // e.g., "AO"
  taxCode: string; // e.g., "NOR", "ISE"
  taxPercentage: number;
  taxContribution: number;
}

export interface AGTLine {
  lineNumber: number;
  productCode: string;
  productDescription: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  unitPriceBase: number;
  debitAmount: number;
  creditAmount: number;
  taxes: AGTTax[];
  settlementAmount: number;
}

export interface AGTDocumentTotals {
  taxPayable: number;
  netTotal: number;
  grossTotal: number;
}

export interface AGTWithholdingTax {
  withholdingTaxType: string; // e.g., "IRT"
  withholdingTaxDescription: string;
  withholdingTaxAmount: number;
}

export interface AGTDocument {
  documentNo: string;
  documentStatus: string; // "N", "A", etc.
  jwsDocumentSignature: string;
  documentDate: string; // YYYY-MM-DD
  documentType: string; // "FT", "FR", etc.
  eacCode?: string;
  systemEntryDate: string; // ISO8601
  customerTaxID: string;
  customerCountry: string;
  companyName: string;
  previousHash: string;
  taxRegistrationNumber: string;
  lines: AGTLine[];
  documentTotals: AGTDocumentTotals;
  withholdingTaxList?: AGTWithholdingTax[];
}

export interface AGTInvoicePayload {
  schemaVersion: string; // "1.2"
  submissionUUID: string;
  taxRegistrationNumber: string;
  submissionTimeStamp: string;
  softwareInfo: AGTSoftwareInfo;
  numberOfEntries: number;
  documents: AGTDocument[];
}

export interface AGTError {
  code: string;
  message: string;
}

export interface AGTResponse {
  requestID: string;
  errorList: AGTError[];
}
