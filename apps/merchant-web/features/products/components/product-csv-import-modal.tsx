'use client';

import { useRef, useState } from 'react';
import { Download, Upload, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { Modal, Button } from '@/design-system/primitives';
import { useToast } from '@/design-system/primitives';
import {
  downloadProductCsvTemplate,
  validateProductCsv,
  importProductCsv,
  type CsvValidationResult,
} from '@/services/products/product-creation-api';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  storeId: string;
  open: boolean;
  onClose: () => void;
}

export function ProductCsvImportModal({ storeId, open, onClose }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [csvContent, setCsvContent] = useState('');
  const [validation, setValidation] = useState<CsvValidationResult | null>(null);

  const validateMutation = useMutation({
    mutationFn: (csv: string) => validateProductCsv(storeId, csv),
    onSuccess: (data) => setValidation(data),
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const importMutation = useMutation({
    mutationFn: () => {
      const rowNumbers = validation?.rows.filter((r) => r.valid).map((r) => r.rowNumber) ?? [];
      return importProductCsv(storeId, csvContent, rowNumbers);
    },
    onSuccess: (data) => {
      toast(`${data.imported} imported, ${data.failed} failed`, 'success');
      qc.invalidateQueries({ queryKey: ['products', storeId] });
      handleClose();
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const handleClose = () => {
    setCsvContent('');
    setValidation(null);
    onClose();
  };

  const handleDownloadTemplate = async () => {
    try {
      const text = await downloadProductCsvTemplate(storeId);
      const blob = new Blob([text], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'product-import-template.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  };

  const handleDownloadErrors = () => {
    if (!validation?.errorCsv) return;
    const blob = new Blob([validation.errorCsv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product-import-errors.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    setCsvContent(text);
    setValidation(null);
    validateMutation.mutate(text);
  };

  return (
    <Modal open={open} onClose={handleClose} title="Upload CSV" size="lg">
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          Bulk upload products using the template. Validation and import are free — no AI charges apply.
        </p>
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          HSN code is required for every row. Use an active numeric 4, 6, or 8 digit HSN code in the
          <span className="font-mono"> hsnCode</span> column.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <Download className="h-4 w-4" /> Download CSV template
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" /> Upload CSV
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
        </div>

        {validateMutation.isPending && (
          <p className="text-sm text-slate-500">Validating rows…</p>
        )}

        {validation && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex flex-wrap gap-4 text-sm">
              <span>Total: <strong>{validation.total}</strong></span>
              <span className="text-emerald-700">Valid: <strong>{validation.validCount}</strong></span>
              <span className="text-red-600">Invalid: <strong>{validation.invalidCount}</strong></span>
              {(validation.warningCount ?? 0) > 0 && (
                <span className="text-amber-700">Warnings: <strong>{validation.warningCount}</strong></span>
              )}
            </div>

            <div className="max-h-48 overflow-auto rounded-lg border bg-white">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-100">
                  <tr>
                    <th className="p-2">Row</th>
                    <th className="p-2">Name</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {validation.rows.map((row) => (
                    <tr key={row.rowNumber} className="border-t">
                      <td className="p-2">{row.rowNumber}</td>
                      <td className="p-2">{String(row.preview.name ?? '')}</td>
                      <td className="p-2">
                        {row.valid ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </td>
                      <td className="p-2">
                        {row.errors.length > 0 && (
                          <span className="text-red-600">{row.errors.join('; ')}</span>
                        )}
                        {row.warnings?.length > 0 && (
                          <span className={row.errors.length ? ' block text-amber-700' : 'text-amber-700'}>
                            {row.warnings.join('; ')}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {validation.invalidCount > 0 && validation.errorCsv && (
              <Button className="mt-3" variant="outline" size="sm" onClick={handleDownloadErrors}>
                Download error report
              </Button>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button
            disabled={!validation || validation.validCount === 0 || importMutation.isPending}
            onClick={() => importMutation.mutate()}
          >
            Import {validation?.validCount ?? 0} valid products
          </Button>
        </div>
      </div>
    </Modal>
  );
}
