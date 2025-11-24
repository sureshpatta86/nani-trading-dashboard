"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import { Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: Record<string, string>[]) => Promise<{ success: number; errors: string[] }>;
  expectedHeaders: string[];
  title: string;
  description: string;
  templateExample: string;
}

export function CSVImportDialog({
  open,
  onOpenChange,
  onImport,
  expectedHeaders,
  title,
  description,
  templateExample,
}: CSVImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, string>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrors([]);
    setResult(null);
    setPreviewData([]);

    // Parse CSV for preview
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setErrors(results.errors.map((e) => e.message));
          return;
        }

        // Validate headers
        const fileHeaders = results.meta.fields || [];
        const missingHeaders = expectedHeaders.filter(
          (h) => !fileHeaders.includes(h)
        );

        if (missingHeaders.length > 0) {
          setErrors([
            `Missing required columns: ${missingHeaders.join(", ")}`,
            `Expected columns: ${expectedHeaders.join(", ")}`,
          ]);
          return;
        }

        // Show preview (first 5 rows)
        setPreviewData(results.data.slice(0, 5) as Record<string, string>[]);
      },
      error: (error) => {
        setErrors([`Failed to parse CSV: ${error.message}`]);
      },
    });
  };

  const handleImport = async () => {
    if (!file || previewData.length === 0) return;

    setIsProcessing(true);
    setErrors([]);
    setResult(null);

    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const importResult = await onImport(results.data as Record<string, string>[]);
            setResult(importResult);
            
            if (importResult.success > 0) {
              // Clear file input after successful import
              setFile(null);
              setPreviewData([]);
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }
          } catch (error) {
            setErrors([(error as Error).message || "Failed to import data"]);
          } finally {
            setIsProcessing(false);
          }
        },
        error: (error) => {
          setErrors([`Failed to parse CSV: ${error.message}`]);
          setIsProcessing(false);
        },
      });
    } catch (error) {
      setErrors([(error as Error).message || "Failed to import data"]);
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreviewData([]);
    setErrors([]);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onOpenChange(false);
  };

  const downloadTemplate = () => {
    const csv = templateExample;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "import-template.csv";
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Input */}
          <div className="space-y-2">
            <Label htmlFor="csv-file">Select CSV File</Label>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Button
                type="button"
                variant="outline"
                onClick={downloadTemplate}
                size="sm"
              >
                Download Template
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Expected columns: {expectedHeaders.join(", ")}
            </p>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Validation Errors
                  </h4>
                  <ul className="mt-2 text-sm text-red-700 dark:text-red-300 list-disc list-inside">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Success Result */}
          {result && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-900/20">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
                    Import Complete
                  </h4>
                  <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                    Successfully imported {result.success} record(s).
                  </p>
                  {result.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        Errors:
                      </p>
                      <ul className="text-sm text-green-700 dark:text-green-300 list-disc list-inside">
                        {result.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Preview */}
          {previewData.length > 0 && !result && (
            <div className="space-y-2">
              <Label>Preview (first 5 rows)</Label>
              <div className="rounded-lg border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      {Object.keys(previewData[0]).map((header) => (
                        <th
                          key={header}
                          className="px-4 py-2 text-left font-medium"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, index) => (
                      <tr key={index} className="border-t">
                        {Object.values(row).map((value: string, cellIndex) => (
                          <td key={cellIndex} className="px-4 py-2">
                            {String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {result ? "Close" : "Cancel"}
          </Button>
          {!result && (
            <Button
              onClick={handleImport}
              disabled={!file || previewData.length === 0 || isProcessing}
            >
              <Upload className="mr-2 h-4 w-4" />
              {isProcessing ? "Importing..." : `Import ${previewData.length > 0 ? previewData.length : ""} Rows`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
