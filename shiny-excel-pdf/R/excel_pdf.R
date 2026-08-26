# ---------------------------------------------------------------------------
# Reading Excel workbooks and rendering them as paginated PDF tables.
#
# The renderer uses only base R (grid + grDevices) so no LaTeX, headless
# browser or extra table package is needed. readxl is only required for the
# reading half, so the rendering half can be tested on plain data frames.
# ---------------------------------------------------------------------------

PAPER_SIZES <- list(
  a4     = c(8.27, 11.69),
  letter = c(8.5, 11),
  legal  = c(8.5, 14),
  a3     = c(11.69, 16.54)
)

page_size <- function(paper = "a4", orientation = "portrait") {
  dims <- PAPER_SIZES[[paper]]
  if (is.null(dims)) dims <- PAPER_SIZES$a4
  if (identical(orientation, "landscape")) rev(dims) else dims
}

has_package <- function(pkg) requireNamespace(pkg, quietly = TRUE)

# --- reading ---------------------------------------------------------------

excel_sheet_names <- function(path) {
  readxl::excel_sheets(path)
}

read_excel_sheet <- function(path, sheet, n_max = Inf) {
  df <- readxl::read_excel(path, sheet = sheet, n_max = n_max, .name_repair = "minimal")
  as.data.frame(df, stringsAsFactors = FALSE, check.names = FALSE)
}

read_workbook <- function(path, sheets = NULL, n_max = Inf) {
  available <- excel_sheet_names(path)
  if (is.null(sheets)) sheets <- available
  sheets <- available[available %in% sheets]
  out <- lapply(sheets, function(s) read_excel_sheet(path, s, n_max = n_max))
  names(out) <- sheets
  out
}

# --- formatting ------------------------------------------------------------

format_column <- function(x, max_chars = 80) {
  out <- if (inherits(x, "Date")) {
    format(x, "%Y-%m-%d")
  } else if (inherits(x, "POSIXt")) {
    format(x, "%Y-%m-%d %H:%M")
  } else if (inherits(x, "difftime")) {
    format(x)
  } else if (is.numeric(x)) {
    formatC(x, format = "fg", digits = 8, big.mark = ",", drop0trailing = TRUE)
  } else if (is.logical(x)) {
    ifelse(x, "TRUE", "FALSE")
  } else {
    as.character(x)
  }
  out <- trimws(as.character(out))
  out[is.na(out) | is.na(x)] <- ""
  out <- gsub("[\r\n\t]+", " ", out)
  if (is.finite(max_chars) && max_chars > 1) {
    long <- nchar(out) > max_chars
    out[long] <- paste0(substr(out[long], 1, max_chars - 3), "...")
  }
  out
}

# A sheet, ready to draw: character matrix plus header labels and alignment.
as_display_table <- function(df, max_chars = 80) {
  df <- as.data.frame(df, stringsAsFactors = FALSE, check.names = FALSE)
  headers <- names(df)
  headers[is.na(headers)] <- ""
  headers[!nzchar(headers)] <- paste0("(col ", which(!nzchar(headers)), ")")
  right <- vapply(df, function(x) is.numeric(x) && !inherits(x, "Date"), logical(1))
  cells <- lapply(df, format_column, max_chars = max_chars)
  list(
    headers = headers,
    align   = ifelse(unname(right), "right", "left"),
    cells   = if (length(cells)) do.call(cbind, cells) else matrix(character(0), nrow = 0, ncol = 0),
    nrow    = nrow(df),
    ncol    = ncol(df)
  )
}

# --- measuring -------------------------------------------------------------

# Width in inches of the widest string in `x` at the current gpar settings.
max_string_width <- function(x, fontface = "plain", fontsize = 8, fontfamily = "") {
  x <- x[nzchar(x)]
  if (!length(x)) return(0)
  if (length(x) > 400) x <- c(x[order(nchar(x), decreasing = TRUE)][1:200], sample(x, 200))
  w <- grid::convertWidth(
    grid::stringWidth(x), "in", valueOnly = TRUE
  )
  # stringWidth respects the viewport gpar, so measure inside one.
  max(w)
}

measure_columns <- function(tbl, fontsize, fontfamily, pad_in, max_col_in) {
  n <- tbl$ncol
  widths <- numeric(n)
  for (j in seq_len(n)) {
    grid::pushViewport(grid::viewport(gp = grid::gpar(fontsize = fontsize, fontfamily = fontfamily, fontface = "bold")))
    head_w <- max_string_width(tbl$headers[j])
    grid::popViewport()
    grid::pushViewport(grid::viewport(gp = grid::gpar(fontsize = fontsize, fontfamily = fontfamily, fontface = "plain")))
    body_w <- if (tbl$nrow > 0) max_string_width(tbl$cells[, j]) else 0
    grid::popViewport()
    widths[j] <- max(head_w, body_w) + 2 * pad_in
  }
  pmax(pmin(widths, max_col_in), 0.3)
}

# Shorten the strings of columns that hit the width cap so they still fit.
clip_wide_columns <- function(tbl, widths, capped, pad_in) {
  for (j in which(capped)) {
    avail <- widths[j] - 2 * pad_in
    txt <- tbl$cells[, j]
    keep <- nzchar(txt)
    if (!any(keep)) next
    w <- grid::convertWidth(grid::stringWidth(txt[keep]), "in", valueOnly = TRUE)
    too_wide <- w > avail
    if (!any(too_wide)) next
    idx <- which(keep)[too_wide]
    ratio <- avail / w[too_wide]
    n_keep <- pmax(1, floor(nchar(txt[idx]) * ratio * 0.97) - 3)
    tbl$cells[idx, j] <- paste0(substr(txt[idx], 1, n_keep), "...")
  }
  tbl
}

# Greedily pack columns into groups no wider than `usable_w`.
group_columns <- function(widths, usable_w, repeat_first = FALSE) {
  n <- length(widths)
  if (n == 0) return(list(integer(0)))
  repeat_first <- isTRUE(repeat_first) && n > 1
  start <- if (repeat_first) 2L else 1L
  base_w <- if (repeat_first) widths[1] else 0
  groups <- list()
  current <- integer(0)
  acc <- base_w
  for (j in seq.int(start, n)) {
    if (length(current) > 0 && acc + widths[j] > usable_w) {
      groups[[length(groups) + 1L]] <- current
      current <- integer(0)
      acc <- base_w
    }
    current <- c(current, j)
    acc <- acc + widths[j]
  }
  if (length(current) > 0) groups[[length(groups) + 1L]] <- current
  if (repeat_first) groups <- lapply(groups, function(g) unique(c(1L, g)))
  groups
}

chunk_seq <- function(n, size) {
  if (n <= 0) return(list(integer(0)))
  split(seq_len(n), ceiling(seq_len(n) / size))
}

# --- drawing ---------------------------------------------------------------

THEME <- list(
  header_fill = "#E8EAED",
  header_text = "#1F2328",
  stripe_fill = "#F6F7F9",
  grid_line   = "#D7DAE0",
  border      = "#9AA0A6",
  body_text   = "#1F2328",
  muted_text  = "#6B7280"
)

draw_page_chrome <- function(usable_w, usable_h, left, right, footer_left, footer_right, fontsize) {
  grid::grid.text(left, x = grid::unit(0, "in"), y = grid::unit(usable_h, "in"),
                  just = c("left", "top"),
                  gp = grid::gpar(fontsize = fontsize + 1.5, fontface = "bold", col = THEME$body_text))
  grid::grid.text(right, x = grid::unit(usable_w, "in"), y = grid::unit(usable_h, "in"),
                  just = c("right", "top"),
                  gp = grid::gpar(fontsize = fontsize - 0.5, col = THEME$muted_text))
  grid::grid.text(footer_left, x = grid::unit(0, "in"), y = grid::unit(0, "in"),
                  just = c("left", "bottom"),
                  gp = grid::gpar(fontsize = fontsize - 1, col = THEME$muted_text))
  grid::grid.text(footer_right, x = grid::unit(usable_w, "in"), y = grid::unit(0, "in"),
                  just = c("right", "bottom"),
                  gp = grid::gpar(fontsize = fontsize - 1, col = THEME$muted_text))
}

# Draw one block of cells. `y_top` is measured downwards from the top of the
# current viewport, which is `usable_h` inches tall.
draw_table_block <- function(headers, cells, align, widths, y_top, usable_h,
                             fontsize, fontfamily, pad_in, row_h) {
  x_left <- cumsum(c(0, widths))[seq_along(widths)]
  x_right <- x_left + widths
  total_w <- sum(widths)
  n_rows <- nrow(cells)

  text_x <- ifelse(align == "right", x_right - pad_in, x_left + pad_in)
  hjust <- ifelse(align == "right", 1, 0)

  y_of <- function(top) grid::unit(usable_h - top, "in")

  # header band
  grid::grid.rect(x = grid::unit(0, "in"), y = y_of(y_top + row_h),
                  width = grid::unit(total_w, "in"), height = grid::unit(row_h, "in"),
                  just = c("left", "bottom"),
                  gp = grid::gpar(fill = THEME$header_fill, col = NA))
  grid::grid.text(headers, x = grid::unit(text_x, "in"), y = y_of(y_top + row_h / 2),
                  hjust = hjust, vjust = 0.5,
                  gp = grid::gpar(fontsize = fontsize, fontface = "bold",
                                  fontfamily = fontfamily, col = THEME$header_text))

  if (n_rows > 0) {
    row_tops <- y_top + row_h * seq_len(n_rows)

    stripes <- seq_len(n_rows) %% 2 == 0
    if (any(stripes)) {
      grid::grid.rect(x = grid::unit(0, "in"), y = y_of(row_tops[stripes] + row_h),
                      width = grid::unit(total_w, "in"), height = grid::unit(row_h, "in"),
                      just = c("left", "bottom"),
                      gp = grid::gpar(fill = THEME$stripe_fill, col = NA))
    }

    for (i in seq_len(n_rows)) {
      grid::grid.text(cells[i, ], x = grid::unit(text_x, "in"),
                      y = y_of(row_tops[i] + row_h / 2),
                      hjust = hjust, vjust = 0.5,
                      gp = grid::gpar(fontsize = fontsize, fontfamily = fontfamily,
                                      col = THEME$body_text))
    }

    # horizontal rules between rows
    rule_y <- y_top + row_h * seq_len(n_rows)
    grid::grid.segments(x0 = grid::unit(0, "in"), x1 = grid::unit(total_w, "in"),
                        y0 = y_of(rule_y), y1 = y_of(rule_y),
                        gp = grid::gpar(col = THEME$grid_line, lwd = 0.5))
  }

  block_h <- row_h * (n_rows + 1)
  # vertical rules + outer border
  if (length(widths) > 1) {
    inner <- x_right[-length(x_right)]
    grid::grid.segments(x0 = grid::unit(inner, "in"), x1 = grid::unit(inner, "in"),
                        y0 = y_of(y_top), y1 = y_of(y_top + block_h),
                        gp = grid::gpar(col = THEME$grid_line, lwd = 0.5))
  }
  grid::grid.rect(x = grid::unit(0, "in"), y = y_of(y_top + block_h),
                  width = grid::unit(total_w, "in"), height = grid::unit(block_h, "in"),
                  just = c("left", "bottom"),
                  gp = grid::gpar(fill = NA, col = THEME$border, lwd = 0.7))
  invisible(block_h)
}

open_pdf_device <- function(file, dims, title) {
  cairo_ok <- isTRUE(unname(capabilities("cairo")))
  if (cairo_ok) {
    ok <- tryCatch({
      grDevices::cairo_pdf(filename = file, width = dims[1], height = dims[2],
                           onefile = TRUE, fallback_resolution = 300)
      TRUE
    }, error = function(e) FALSE)
    if (ok) return(invisible(TRUE))
  }
  grDevices::pdf(file = file, width = dims[1], height = dims[2], onefile = TRUE, title = title)
  invisible(TRUE)
}

#' Render one or more sheets to a paginated PDF.
#'
#' @param sheets Named list of data frames.
#' @param file Output path.
#' @param title Document title, usually the workbook file name.
#' @param progress Optional function(fraction, message) called as pages render.
render_workbook_pdf <- function(sheets, file,
                                title = "Workbook",
                                paper = "a4",
                                orientation = "portrait",
                                fontsize = 8,
                                margin = 0.5,
                                max_chars = 80,
                                repeat_first_col = FALSE,
                                fontfamily = "",
                                progress = NULL) {
  stopifnot(is.list(sheets))
  if (!length(sheets)) sheets <- list(Sheet1 = data.frame())
  if (is.null(names(sheets))) names(sheets) <- paste0("Sheet", seq_along(sheets))

  fontsize <- max(4, min(20, as.numeric(fontsize)))
  dims <- page_size(paper, orientation)
  margin <- max(0.2, min(1.5, as.numeric(margin)))
  usable_w <- dims[1] - 2 * margin
  usable_h <- dims[2] - 2 * margin

  pad_in <- fontsize / 72 * 0.55
  row_h <- fontsize / 72 * 1.75
  head_h <- fontsize / 72 * 2.6   # title line
  foot_h <- fontsize / 72 * 2.0   # footer line
  table_h <- usable_h - head_h - foot_h
  rows_per_page <- max(1, floor(table_h / row_h) - 1)   # -1 for the header row
  max_col_in <- max(1, usable_w * 0.5)
  stamp <- format(Sys.time(), "%Y-%m-%d %H:%M")

  open_pdf_device(file, dims, title)
  on.exit(grDevices::dev.off(), add = TRUE)

  # Lay every page out first so page numbers can be "x of y".
  layouts <- list()
  for (nm in names(sheets)) {
    tbl <- as_display_table(sheets[[nm]], max_chars = max_chars)
    if (tbl$ncol == 0) {
      layouts[[length(layouts) + 1L]] <- list(sheet = nm, empty = TRUE)
      next
    }
    grid::pushViewport(grid::viewport(width = grid::unit(usable_w, "in"),
                                      height = grid::unit(usable_h, "in"),
                                      gp = grid::gpar(fontsize = fontsize, fontfamily = fontfamily)))
    widths <- measure_columns(tbl, fontsize, fontfamily, pad_in, max_col_in)
    tbl <- clip_wide_columns(tbl, widths, widths >= max_col_in - 1e-9, pad_in)
    grid::popViewport()

    col_groups <- group_columns(widths, usable_w, repeat_first_col)
    row_groups <- chunk_seq(tbl$nrow, rows_per_page)
    for (cg in col_groups) {
      for (rg in row_groups) {
        layouts[[length(layouts) + 1L]] <- list(
          sheet = nm, empty = FALSE, tbl = tbl, widths = widths, cols = cg, rows = rg
        )
      }
    }
  }

  total <- length(layouts)
  first <- TRUE
  for (p in seq_along(layouts)) {
    lay <- layouts[[p]]
    if (!first) grid::grid.newpage() else first <- FALSE
    grid::pushViewport(grid::viewport(
      x = grid::unit(margin, "in"), y = grid::unit(margin, "in"),
      width = grid::unit(usable_w, "in"), height = grid::unit(usable_h, "in"),
      just = c("left", "bottom"),
      gp = grid::gpar(fontsize = fontsize, fontfamily = fontfamily)
    ))

    if (isTRUE(lay$empty)) {
      draw_page_chrome(usable_w, usable_h,
                       paste0(title, "   |   ", lay$sheet),
                       paste0("Page ", p, " of ", total),
                       "Sheet is empty", stamp, fontsize)
      grid::grid.text("This sheet has no data.",
                      gp = grid::gpar(fontsize = fontsize + 1, col = THEME$muted_text))
      grid::popViewport()
      next
    }

    tbl <- lay$tbl
    cols <- lay$cols
    rows <- lay$rows
    cells <- if (length(rows)) tbl$cells[rows, cols, drop = FALSE] else
      matrix(character(0), nrow = 0, ncol = length(cols))

    row_label <- if (tbl$nrow == 0) "no data rows" else
      sprintf("rows %s-%s of %s", min(rows), max(rows), tbl$nrow)
    col_label <- sprintf("columns %s of %s",
                         if (length(cols) == 1) cols else paste0(min(cols), "-", max(cols)),
                         tbl$ncol)

    draw_page_chrome(usable_w, usable_h,
                     paste0(title, "   |   ", lay$sheet),
                     paste0("Page ", p, " of ", total),
                     paste0(row_label, "   |   ", col_label),
                     paste0("Exported ", stamp), fontsize)

    draw_table_block(tbl$headers[cols], cells, tbl$align[cols], lay$widths[cols],
                     y_top = head_h, usable_h = usable_h,
                     fontsize = fontsize, fontfamily = fontfamily,
                     pad_in = pad_in, row_h = row_h)
    grid::popViewport()

    if (is.function(progress)) progress(p / total, sprintf("Page %d of %d", p, total))
  }

  invisible(list(file = file, pages = total))
}
