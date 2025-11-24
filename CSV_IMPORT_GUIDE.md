# CSV Import Guide for Nani Trading Dashboard

This document provides information about importing data into the Nani Trading Dashboard using CSV files.

## Intraday Trading Log Import

### CSV Format

The intraday trading log accepts CSV files with the following columns:

| Column Name | Type | Required | Description | Example |
|-------------|------|----------|-------------|---------|
| Date | Date | Yes | Trade date in DD/MM/YYYY format | 24/11/2025 |
| Script | Text | Yes | Stock symbol/ticker | RELIANCE, TCS |
| Type | Text | Yes | Trade type (BUY or SELL) | BUY |
| Quantity | Number | Yes | Number of shares traded | 100 |
| Buy Price | Number | Yes | Entry price per share | 2500.00 |
| Sell Price | Number | Yes | Exit price per share | 2520.00 |
| Charges | Number | No | Brokerage and other charges | 20.00 |
| Remarks | Text | No | Trade notes or comments | Good trade following setup |
| Follow Setup | Text | No | Whether setup was followed (Yes/No) | Yes |

### Sample CSV

```csv
Date,Script,Type,Quantity,Buy Price,Sell Price,Charges,Remarks,Follow Setup
24/11/2025,RELIANCE,BUY,100,2500.00,2520.00,20.00,Good trade following setup,Yes
24/11/2025,TCS,SELL,50,3400.00,3390.00,15.00,Stop loss hit,No
23/11/2025,INFY,BUY,75,1450.00,1470.00,18.00,Breakout trade,Yes
23/11/2025,HDFCBANK,SELL,60,1620.00,1610.00,17.00,False signal,No
22/11/2025,WIPRO,BUY,200,410.00,418.00,25.00,Gap up trade,Yes
```

### Important Notes

- **Date Format**: Use DD/MM/YYYY format (e.g., 24/11/2025)
- **Script**: Stock symbols should be in uppercase (automatically converted)
- **Type**: Must be either "BUY" or "SELL" (case-insensitive)
- **Charges**: If not provided, defaults to 0
- **Follow Setup**: Values like "Yes", "yes", "Y" are treated as Yes. Everything else is No.
- **P&L Calculation**: The system automatically calculates P&L and Net P&L based on (Sell Price - Buy Price) × Quantity - Charges

## Portfolio Import

### CSV Format

The portfolio management accepts CSV files with the following columns:

| Column Name | Type | Required | Description | Example |
|-------------|------|----------|-------------|---------|
| Symbol | Text | Yes | Stock symbol with exchange suffix | RELIANCE.NS |
| Name | Text | No | Full stock name | Reliance Industries |
| Quantity | Number | Yes | Number of shares held | 100 |
| Buy Price | Number | Yes | Average purchase price | 2500.00 |
| Purchase Date | Date | Yes | Date of purchase in DD/MM/YYYY format | 15/11/2025 |

### Sample CSV

```csv
Symbol,Name,Quantity,Buy Price,Purchase Date
RELIANCE.NS,Reliance Industries,100,2500.00,15/11/2025
TCS.NS,Tata Consultancy Services,50,3400.00,20/11/2025
INFY.NS,Infosys Limited,75,1450.00,18/11/2025
HDFCBANK.NS,HDFC Bank,60,1620.00,10/11/2025
WIPRO.NS,Wipro Limited,200,410.00,05/11/2025
ITC.NS,ITC Limited,150,425.00,12/11/2025
```

### Important Notes

- **Symbol**: Must include exchange suffix (.NS for NSE, .BO for BSE)
- **Name**: Optional but recommended for better readability
- **Date Format**: Use DD/MM/YYYY format (e.g., 15/11/2025)
- **Duplicate Detection**: The system will reject imports for stocks that already exist in your portfolio
- **Price Updates**: Current prices are automatically fetched after import

## General Import Tips

1. **File Size**: The system can handle large CSV files efficiently with parallel processing
2. **Validation**: All data is validated before import. Invalid rows will be reported with specific error messages
3. **Preview**: You'll see a preview of the first 5 rows before importing
4. **Error Handling**: If any rows fail, you'll see a detailed list of errors while successful rows are still imported
5. **Templates**: Use the "Download Template" button in the import dialog to get a properly formatted CSV file
6. **Encoding**: Use UTF-8 encoding for your CSV files to avoid character issues
7. **Excel Export**: You can export from Excel to CSV, just make sure to use the correct date format

## Common Issues and Solutions

### Date Format Issues
- **Problem**: "Invalid date format" error
- **Solution**: Ensure dates are in DD/MM/YYYY format. If using Excel, format cells as "Text" before entering dates

### Type/Symbol Validation
- **Problem**: "Invalid type" or "Missing symbol" errors
- **Solution**: Ensure Type is exactly "BUY" or "SELL", and symbols are not empty

### Duplicate Stocks
- **Problem**: "Stock already exists" error
- **Solution**: Remove duplicates from your CSV or delete the existing stock from the portfolio first

### Number Format
- **Problem**: "Invalid quantity" or "Invalid price" errors
- **Solution**: Ensure numeric values don't contain currency symbols or commas. Use dot (.) for decimals.

## Performance

The import feature uses parallel processing to handle large CSV files efficiently:
- **Small files** (< 100 rows): Near-instant import
- **Medium files** (100-1000 rows): A few seconds
- **Large files** (> 1000 rows): May take up to a minute depending on API response times

All imports happen in the background with real-time progress reporting.
