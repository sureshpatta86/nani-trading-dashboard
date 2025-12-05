"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FileSpreadsheet, CheckCircle2, Loader2, FileUp, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

interface CSVColumn {
  name: string;
  sample: string;
  mappedTo: string;
}

const DB_FIELDS = [
  { value: "date", label: "Trade Date" },
  { value: "script", label: "Script/Symbol" },
  { value: "buySell", label: "Buy/Sell Type" },
  { value: "quantity", label: "Quantity" },
  { value: "entryPrice", label: "Entry/Buy Price" },
  { value: "exitPrice", label: "Exit/Sell Price" },
  { value: "profitLoss", label: "Profit/Loss" },
  { value: "followSetup", label: "Follow Setup" },
  { value: "remarks", label: "Remarks" },
  { value: "ignore", label: "-- Ignore Column --" },
];

export default function ImportPage() {
  const { status } = useSession();
  const { toast } = useToast();
  const t = useTranslations("importPage");
  const tc = useTranslations("common");
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<CSVColumn[]>([]);
  const [csvData, setCSVData] = useState<string[][]>([]);
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<"upload" | "map" | "complete">("upload");
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">{tc("loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    redirect("/auth/signin");
  }

  const autoMapColumn = (columnName: string): string => {
    const name = columnName.toLowerCase().trim();
    
    // Date mapping
    if (name.includes("date") || name === "day") return "date";
    
    // Script mapping
    if (name.includes("script") || name.includes("symbol") || name.includes("stock")) return "script";
    
    // Buy/Sell mapping
    if (name.includes("buy") && name.includes("sell")) return "buySell";
    if (name === "type" || name === "side") return "buySell";
    
    // Quantity mapping
    if (name.includes("quantity") || name === "qty" || name === "lot") return "quantity";
    
    // Entry price mapping
    if (name.includes("entry") || name.includes("buy price")) return "entryPrice";
    
    // Exit price mapping
    if (name.includes("exit") || name.includes("sell price")) return "exitPrice";
    
    // Points (can be ignored as we calculate it)
    if (name.includes("point") && !name.includes("profit")) return "ignore";
    
    // Profit/Loss mapping
    if (name.includes("profit") || name.includes("loss") || name === "p&l" || name === "p/l" || name === "pl") return "profitLoss";
    
    // Follow setup mapping
    if (name.includes("setup") || name.includes("follow")) return "followSetup";
    
    // Remarks mapping
    if (name.includes("remark") || name.includes("comment") || name.includes("note")) return "remarks";
    
    // Initial capital, current capital - ignore
    if (name.includes("capital") || name.includes("initial") || name.includes("current")) return "ignore";
    
    return "ignore";
  };

  const processFileData = (headers: string[], dataRows: string[][]) => {
    setCSVData(dataRows);

    // Create column mapping with auto-detection
    const detectedColumns: CSVColumn[] = headers.map((header, index) => ({
      name: header,
      sample: dataRows[0]?.[index] || "",
      mappedTo: autoMapColumn(header),
    }));

    setColumns(detectedColumns);
    setStep("map");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    const fileName = uploadedFile.name.toLowerCase();
    const isCSV = fileName.endsWith(".csv");
    const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");

    if (!isCSV && !isExcel) {
      toast({
        title: t("invalidFile"),
        description: t("invalidFileDescription"),
        variant: "destructive",
      });
      return;
    }

    setFile(uploadedFile);

    if (isExcel) {
      // Handle Excel file
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = event.target?.result;
          const workbook = XLSX.read(data, { type: "array" });
          
          // Get the first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to array of arrays
          const jsonData: string[][] = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            raw: false,
            defval: ""
          });

          if (jsonData.length < 2) {
            toast({
              title: t("invalidExcelFile"),
              description: t("invalidExcelFileDescription"),
              variant: "destructive",
            });
            return;
          }

          const headers = jsonData[0].map(h => String(h || "").trim());
          const dataRows = jsonData.slice(1).filter(row => 
            row.some(cell => cell && String(cell).trim() !== "" && cell !== "0")
          ).map(row => row.map(cell => String(cell || "").trim()));

          processFileData(headers, dataRows);
        } catch (error) {
          console.error("Excel parsing error:", error);
          toast({
            title: t("errorReadingExcel"),
            description: t("errorReadingExcelDescription"),
            variant: "destructive",
          });
        }
      };
      reader.readAsArrayBuffer(uploadedFile);
    } else {
      // Handle CSV file
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split("\n").filter(line => line.trim());
        
        if (lines.length < 2) {
          toast({
            title: t("invalidCSV"),
            description: t("invalidCSVDescription"),
            variant: "destructive",
          });
          return;
        }

        // Parse CSV (simple parser - handles basic CSVs)
        const parsedData = lines.map(line => {
          const values: string[] = [];
          let current = "";
          let inQuotes = false;

          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === "," && !inQuotes) {
              values.push(current.trim());
              current = "";
            } else {
              current += char;
            }
          }
          values.push(current.trim());
          return values;
        });

        const headers = parsedData[0];
        const dataRows = parsedData.slice(1).filter(row => 
          row.some(cell => cell && cell.trim() !== "" && cell !== "0")
        );

        processFileData(headers, dataRows);
      };
      reader.readAsText(uploadedFile);
    }
  };

  const handleColumnMapping = (columnIndex: number, mappedTo: string) => {
    setColumns(prevColumns => 
      prevColumns.map((col, index) => 
        index === columnIndex ? { ...col, mappedTo } : col
      )
    );
  };

  const parseDate = (dateStr: string): Date => {
    if (!dateStr || dateStr.trim() === "") {
      return new Date();
    }

    // Remove any whitespace
    dateStr = dateStr.trim();
    
    // Try various date formats
    const parts = dateStr.split(/[-/]/);
    
    if (parts.length === 3) {
      const [first, second, third] = parts.map(p => parseInt(p));
      
      // Determine which is year (4 digits or > 31)
      let year, month, day;
      
      if (third > 31 || third.toString().length === 4) {
        // Format: MM-DD-YYYY or DD-MM-YYYY
        year = third;
        // If first part is > 12, it must be day
        if (first > 12) {
          day = first;
          month = second;
        } else if (second > 12) {
          // Second part > 12, so first must be month
          month = first;
          day = second;
        } else {
          // Ambiguous, assume MM-DD-YYYY (US format common in CSV)
          month = first;
          day = second;
        }
      } else if (first > 31 || first.toString().length === 4) {
        // Format: YYYY-MM-DD
        year = first;
        month = second;
        day = third;
      } else {
        // Assume DD-MM-YYYY (international format)
        day = first;
        month = second;
        year = third;
      }
      
      // Create date (month is 0-indexed in JS Date)
      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    // Fallback to Date constructor
    return new Date(dateStr);
  };

  const handleImport = async () => {
    setImporting(true);

    try {
      // Validate that required fields are mapped
      const requiredFields = ["date", "script", "buySell", "quantity", "entryPrice", "exitPrice", "profitLoss"];
      const mappedFields = columns.filter(col => col.mappedTo !== "ignore").map(col => col.mappedTo);
      
      const missingFields = requiredFields.filter(field => !mappedFields.includes(field));
      if (missingFields.length > 0) {
        toast({
          title: t("missingRequiredFields"),
          description: `${t("pleaseMap")}: ${missingFields.join(", ")}`,
          variant: "destructive",
        });
        setImporting(false);
        return;
      }

      // Create column index mapping
      const columnIndexMap: Record<string, number> = {};
      columns.forEach((col, index) => {
        if (col.mappedTo !== "ignore") {
          columnIndexMap[col.mappedTo] = index;
        }
      });

      let successCount = 0;
      let failedCount = 0;

      // Import trades one by one
      for (const row of csvData) {
        try {
          // Skip empty rows
          if (row.every(cell => !cell || cell.trim() === "" || cell === "0")) {
            continue;
          }

          const tradeData = {
            date: parseDate(row[columnIndexMap.date]),
            script: row[columnIndexMap.script],
            buySell: row[columnIndexMap.buySell],
            quantity: parseInt(row[columnIndexMap.quantity]),
            entryPrice: parseFloat(row[columnIndexMap.entryPrice]),
            exitPrice: parseFloat(row[columnIndexMap.exitPrice]),
            profitLoss: parseFloat(row[columnIndexMap.profitLoss]),
            followSetup: true,
            remarks: null as string | null,
          };

          // Optional fields
          if (columnIndexMap.followSetup !== undefined) {
            const setupValue = row[columnIndexMap.followSetup]?.toLowerCase().trim();
            tradeData.followSetup = setupValue === "yes" || setupValue === "true" || setupValue === "1";
          }

          if (columnIndexMap.remarks !== undefined) {
            tradeData.remarks = row[columnIndexMap.remarks] || null;
          }

          // Validate required data
          if (!tradeData.script || isNaN(tradeData.quantity) || isNaN(tradeData.entryPrice) || 
              isNaN(tradeData.exitPrice) || isNaN(tradeData.profitLoss)) {
            failedCount++;
            continue;
          }

          const response = await fetch("/api/intraday", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tradeData),
          });

          if (response.ok) {
            successCount++;
          } else {
            failedCount++;
          }
        } catch {
          failedCount++;
        }
      }

      setImportResult({ success: successCount, failed: failedCount });
      setStep("complete");

      toast({
        title: t("importComplete"),
        description: `${t("successfullyImported")} ${successCount} ${tc("trades")}. ${failedCount} ${t("failed")}.`,
      });
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: t("importFailed"),
        description: t("importError"),
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const resetImport = () => {
    setFile(null);
    setColumns([]);
    setCSVData([]);
    setStep("upload");
    setImportResult(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="w-[90%] max-w-[1620px] mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("description")}
          </p>
        </div>

        {step === "upload" && (
          <Card className="max-w-2xl mx-auto overflow-hidden border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-600/10 to-purple-600/10">
              <CardTitle className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <FileSpreadsheet className="h-5 w-5 text-white" />
                </div>
                {t("uploadFile")}
              </CardTitle>
              <CardDescription>
                {t("uploadDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div 
                  className="border-2 border-dashed rounded-xl p-12 text-center hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 cursor-pointer group"
                  onClick={() => document.getElementById('csv-upload')?.click()}
                >
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FileUp className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-lg font-medium mb-2">
                    {t("clickToUpload")}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t("acceptedFormats")}
                  </p>
                  <Input
                    id="csv-upload"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button type="button" variant="outline" className="pointer-events-none">
                    {t("selectFile")}
                  </Button>
                </div>

                <div className="bg-muted/50 rounded-xl p-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    {t("expectedColumns")}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" />{t("columnTradeDate")}</div>
                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" />{t("columnScript")}</div>
                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" />{t("columnBuySell")}</div>
                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" />{t("columnQuantity")}</div>
                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" />{t("columnEntryPrice")}</div>
                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" />{t("columnExitPrice")}</div>
                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" />{t("columnProfitLoss")}</div>
                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />{t("columnFollowSetup")}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "map" && (
          <Card className="max-w-3xl mx-auto overflow-hidden border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-600/10 to-purple-600/10">
              <CardTitle>{t("mapColumns")}</CardTitle>
              <CardDescription>
                {t("mapColumnsDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg px-4 py-3">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">{t("file")}:</span>
                  <span className="font-medium">{file?.name}</span>
                  <span className="text-muted-foreground">({csvData.length} {t("rows")})</span>
                </div>

                <div className="space-y-3">
                  {columns.map((column, index) => (
                    <div key={`column-${index}-${column.name}`} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-4 border rounded-xl hover:bg-muted/30 transition-colors">
                      <div>
                        <div className="font-medium">{column.name}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {t("sample")}: {column.sample || "N/A"}
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <Select
                          value={column.mappedTo}
                          onValueChange={(value) => handleColumnMapping(index, value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DB_FIELDS.map((field) => (
                              <SelectItem key={field.value} value={field.value}>
                                {field.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4 pt-4">
                  <Button 
                    onClick={handleImport} 
                    disabled={importing} 
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t("importing")}
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        {t("importTrades", { count: csvData.length })}
                      </>
                    )}
                  </Button>
                  <Button onClick={resetImport} variant="outline" disabled={importing}>
                    {tc("cancel")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "complete" && importResult && (
          <Card className="max-w-2xl mx-auto overflow-hidden border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-600/10 to-emerald-600/10">
              <CardTitle className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-green-500 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                {t("importComplete")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-green-500/10 rounded-xl border border-green-500/20 text-center">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {importResult.success}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">{t("successfullyImported")}</div>
                  </div>
                  {importResult.failed > 0 && (
                    <div className="p-6 bg-red-500/10 rounded-xl border border-red-500/20 text-center">
                      <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                        {importResult.failed}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">{t("failedToImport")}</div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button 
                    onClick={() => redirect("/intraday")} 
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {t("viewTrades")}
                  </Button>
                  <Button onClick={resetImport} variant="outline">
                    {t("importAnotherFile")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
