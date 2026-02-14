# Especificação de Integração: Facturação Eletrónica (AGT/MinFin)

## Visão Geral
Integração com o Sistema de Gestão Tributária (SIGT) da AGT para comunicação de faturas eletrónicas conforme Decreto Presidencial.

## Endereços (Endpoints)
- **Homologação (Testes):** `https://sifphml.minfin.gov.ao/sigt/fe/v1/registarFactura`
- **Produção:** `https://sifp.minfin.gov.ao/sigt/fe/v1/registarFactura`
- **Método:** `POST`

## Estrutura do Payload (JSON)

### Cabeçalho
- `schemaVersion`: "1.2" (Versão do esquema XSD/JSON)
- `submissionUUID`: UUID v4 único por submissão.
- `taxRegistrationNumber`: NIF do emissor (ex: 5001636863).
- `submissionTimeStamp`: Data/Hora UTC (ISO 8601).

### Software Info
- `productId`: Identificador do software (ex: "TascaManager").
- `productVersion`: Versão do software.
- `softwareValidationNumber`: Número de validação AGT (ex: "C_134").
- `jwsSoftwareSignature`: Assinatura JWS gerada com o certificado do software.

### Documentos
Lista de documentos (Faturas, Recibos, etc.). Exemplo para uma Fatura:
- `documentNo`: Número sequencial (ex: "FT FT6325S2C/10006").
- `documentStatus`: "N" (Normal), "A" (Anulado), etc.
- `documentDate`: Data da fatura (YYYY-MM-DD).
- `documentType`: "FT" (Fatura), "FR" (Fatura-Recibo), etc.
- `customerTaxID`: NIF do Cliente (ou "Consumidor Final").
- `lines`: Lista de produtos/serviços.
- `documentTotals`: Totais de impostos, líquido e bruto.
- `jwsDocumentSignature`: Assinatura JWS dos dados críticos da fatura.

### Assinatura Digital (JWS)
A assinatura JWS deve ser gerada utilizando o algoritmo `RS256`.
Dois níveis de assinatura:
1.  **Software Signature**: Assina os dados do software + timestamp.
2.  **Document Signature**: Assina os campos críticos da fatura (HashControl).

#### Campos para Hash da Fatura (Input para Assinatura)
```json
{
   "documentNo": "...",
   "taxRegistrationNumber": "...",
   "documentType": "...",
   "documentDate": "...",
   "customerTaxID": "...",
   "customerCountry": "...",
   "companyName": "...",
   "documentTotals": {
       "taxPayable": 70,
       "netTotal": 500,
       "grossTotal": 570
   }
}
```

## Requisitos de Implementação
1.  **Serviço de Assinatura**: Capacidade de assinar payloads usando chave privada RSA.
2.  **Validação**: Garantir que todos os campos obrigatórios estejam presentes antes do envio.
3.  **Tratamento de Erros**: Capturar erros da API (ex: NIF inválido, duplicidade).
4.  **Persistência**: Salvar o `submissionUUID` e o status de retorno (sucesso/erro) na base de dados local/Firebase.
