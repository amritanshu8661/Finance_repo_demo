# Upload company data

Open **Data library**, choose a company ticker and currency, and select a file.

- CSV and JSON files can provide price history or financial statement data.
- PDF, XLSX and DOCX files are stored as reference attachments. This version does not extract their contents or calculate metrics from them.
- The maximum file size is 5 MB. Structured imports support at most 10,000 rows.
- A source website is a saved link, not an automatic web import.

Download the templates from the Data Library before preparing your first file. Template values are examples, not actual stock data.

## Historical prices

Use an ISO date (`YYYY-MM-DD`) and closing price for each row. Optional columns include open, high, low and volume. Dates must be valid and unique; values must be finite numbers. Use one currency for the file and choose that currency in the form.

```csv
date,close,open,high,low,volume
2025-01-02,100,98,102,97,1000000
2025-01-03,102,100,103,99,1100000
```

A price file supports price-based analysis. It does not contain revenue, assets or other accounting figures, so it cannot establish a company's profitability or financial health by itself. Price return may exclude dividends and corporate-action adjustments; check the displayed formula and warnings.

## Company financials

Use a period-ending date and financial columns. Keep reporting units and currency consistent across rows. Missing figures should be blank, not zero. Zero means a reported zero.

```csv
period,revenue,netIncome,assets,liabilities,currentAssets,currentLiabilities,cash,equity
2024-12-31,900000,90000,1500000,600000,500000,250000,120000,900000
2025-12-31,1000000,120000,1600000,620000,550000,260000,140000,980000
```

The financial template includes other optional inputs such as debt, COGS, interest expense, inventory, receivables, payables, operating cash flow and capital expenditure. A calculation appears only when the required fields and assumptions are available. For measures needing averages, supply comparable opening and closing periods. Match reporting-period length before comparing results.

For days-based ratios, provide the period length when supported; otherwise read the displayed annual-period assumption. For CapEx, follow the template's sign convention and the analysis explanation. Do not mix quarterly and annual results in a single comparison.

## Link a new file to an earlier one

Choose the earlier file in the previous-version field. The server verifies company, currency, file type, visibility and permissions. The earlier version is preserved. If a link is rejected, correct the metadata instead of forcing unrelated files into one chain.

## Shared and private data

Ordinary users upload private files. Administrators can publish appropriate company data as shared. Shared data is readable by users who already have access to the website; private uploads are readable by their owner and administrators.

Only upload files you are entitled to store and share. Verify the original figures and the reporting period before relying on a calculation. This project supports learning and research, not personalized investment recommendations.
