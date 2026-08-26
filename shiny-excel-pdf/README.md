# Excel to PDF — R Shiny app

Browse to an Excel workbook on your computer, preview it in the browser, and
download it as a paginated PDF.

No LaTeX, no headless browser and no Office install required — the PDF is
drawn with R's own `grid` graphics.

## Requirements

| Package | Why |
| --- | --- |
| `shiny` | the app itself |
| `readxl` | reads `.xlsx` / `.xlsm` / `.xls` |
| `DT` *(optional)* | nicer, scrollable preview table (falls back to a plain table) |

```r
# from this directory
Rscript install-deps.R
# or
install.packages(c("shiny", "readxl", "DT"))
```

## Run it

```r
shiny::runApp("shiny-excel-pdf")   # from the repository root
# or, from inside this directory:
shiny::runApp()
```

Then in the browser:

1. **Browse…** and pick a workbook (there is a sample at
   `tests/sample-workbook.xlsx`).
2. Choose the sheet, check the preview.
3. Adjust paper size, orientation, font size, margin.
4. **Download PDF**.

Uploads are capped at 100 MB (`shiny.maxRequestSize` in `app.R`).

## What the export does

* **One sheet or the whole workbook** — each sheet starts on a new page.
* **Long sheets** are split across pages by row; **wide sheets** are split by
  column, with an option to repeat the first column on every column block so
  rows stay identifiable.
* **Rows per page are computed from the font size**, so smaller type simply
  fits more rows rather than overflowing the page.
* **Column widths are measured from the actual text** and capped at half the
  page width; cells that would still overflow are clipped with `...`.
* Numbers are right-aligned and thousands-separated, dates are formatted as
  `YYYY-MM-DD`, `NA` renders as an empty cell, and every page carries the
  workbook name, sheet name, page number, and the row/column range it covers.

Because everything is drawn with base R's `grid` on a `cairo_pdf` device (with
a plain `pdf` device as fallback), the output is a real vector PDF with
selectable text and there are no external tool dependencies.

## Layout options

| Option | Default | Notes |
| --- | --- | --- |
| Paper | A4 | A4, Letter, Legal, A3 |
| Orientation | Landscape | landscape fits more columns per page |
| Font size | 8 pt | 5–14 pt; drives row height and rows per page |
| Page margin | 0.5 in | 0.25–1.25 in |
| Max characters per cell | 80 | long free text is truncated before layout |
| Repeat first column | on | keeps the key column beside every column block |

## Files

```
app.R                     UI + server
R/excel_pdf.R             workbook reading, cell formatting, PDF renderer
install-deps.R            one-shot dependency installer
tests/test-render.R       renderer smoke test (base R only — no shiny/readxl)
tests/sample-workbook.xlsx  two-sheet sample file to try the app with
```

## Tests

The renderer is deliberately independent of `shiny` and `readxl`, so it can be
exercised with plain data frames:

```bash
Rscript tests/test-render.R /tmp/pdf-out
```

It renders a 137-row × 17-column sheet at three paper/orientation/font
combinations plus the empty-workbook, single-column and zero-row edge cases,
and checks that multi-page PDFs come out non-empty.

> Note: run R in a UTF-8 locale (e.g. `LANG=C.UTF-8`) if your data contains
> accented characters — in a `C` locale R mangles multi-byte text before it
> ever reaches the PDF device.
