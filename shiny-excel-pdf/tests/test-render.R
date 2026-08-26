# Smoke test for the PDF renderer. Runs on base R alone (no shiny/readxl):
#   Rscript tests/test-render.R [outdir]
# Resolve the app directory from the script path so it can be run from anywhere.
args <- commandArgs(trailingOnly = FALSE)
script <- sub("^--file=", "", grep("^--file=", args, value = TRUE)[1])
app_dir <- if (is.na(script)) getwd() else dirname(dirname(normalizePath(script)))
source(file.path(app_dir, "R", "excel_pdf.R"))

outdir <- if (length(commandArgs(TRUE))) commandArgs(TRUE)[1] else tempdir()
dir.create(outdir, showWarnings = FALSE, recursive = TRUE)

set.seed(42)
n <- 137
wide <- data.frame(
  ID = sprintf("ITEM-%04d", seq_len(n)),
  Product = sample(c("Espresso beans", "Oat milk, barista edition", "Sourdough starter",
                     "Tomatoes — vine ripened", "Café crème (naïve blend)"), n, TRUE),
  Qty = sample(1:250, n, TRUE),
  Price = round(runif(n, 0.5, 19999), 2),
  Date = as.Date("2026-01-01") + sample(0:400, n, TRUE),
  Active = sample(c(TRUE, FALSE), n, TRUE),
  Notes = sample(c("", "Short note",
                   paste(rep("a very long free-text note that must be clipped", 4), collapse = " ")),
                 n, TRUE),
  Missing = NA,
  stringsAsFactors = FALSE
)
for (i in 1:9) wide[[paste0("Extra_", i)]] <- round(rnorm(n) * 10^i, 3)

sheets <- list(
  Inventory = wide,
  Tiny = data.frame(a = 1:3, b = c("x", "y", "z"), stringsAsFactors = FALSE),
  Empty = data.frame()
)

cases <- list(
  list(f = "portrait-a4.pdf",  paper = "a4",     orientation = "portrait",  fontsize = 8),
  list(f = "landscape-letter.pdf", paper = "letter", orientation = "landscape", fontsize = 7),
  list(f = "big-font.pdf",     paper = "a4",     orientation = "landscape", fontsize = 12)
)

for (cs in cases) {
  out <- file.path(outdir, cs$f)
  res <- render_workbook_pdf(sheets, out, title = "sample-workbook.xlsx",
                             paper = cs$paper, orientation = cs$orientation,
                             fontsize = cs$fontsize, repeat_first_col = TRUE)
  cat(sprintf("%-24s %3d pages  %8.1f KB\n", cs$f, res$pages, file.size(out) / 1024))
  stopifnot(file.exists(out), file.size(out) > 1000, res$pages > 1)
}

# edge cases
render_workbook_pdf(list(), file.path(outdir, "no-sheets.pdf"), title = "empty.xlsx")
render_workbook_pdf(list(OneCol = data.frame(x = 1:5)), file.path(outdir, "one-col.pdf"),
                    title = "one.xlsx")
render_workbook_pdf(list(NoRows = data.frame(a = character(0), b = numeric(0))),
                    file.path(outdir, "no-rows.pdf"), title = "norows.xlsx")
cat("edge cases ok\n")
cat("ALL OK ->", outdir, "\n")
