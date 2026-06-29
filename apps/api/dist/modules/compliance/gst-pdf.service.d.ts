export interface PdfDocumentInput {
    title: string;
    documentNumber: string;
    documentDate: string;
    sections: Array<{
        heading?: string;
        lines: string[];
    }>;
}
export declare class GstPdfService {
    generate(input: PdfDocumentInput): Buffer;
    generateInvoicePdf(invoice: {
        invoiceNumber: string;
        invoiceDate: Date;
        supplierGstin: string | null;
        buyerGstin: string | null;
        supplierState: string;
        placeOfSupply: string;
        supplyType: string;
        lines: Array<{
            productName: string;
            hsnCode: string;
            quantity: number;
            unitPrice: number;
            taxableAmount: number;
            cgstAmount: number;
            sgstAmount: number;
            igstAmount: number;
            lineTotal: number;
        }>;
        totals: {
            subtotal: number;
            taxableAmount: number;
            cgstAmount: number;
            sgstAmount: number;
            igstAmount: number;
            totalTax: number;
            deliveryFee: number;
            grandTotal: number;
        };
    }): Buffer;
}
