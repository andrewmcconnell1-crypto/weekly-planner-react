# ---------------------------------------------------------------------------
# Excel -> PDF
#
# Browse to an .xlsx/.xls file on your machine, preview it, and download it as
# a paginated PDF. Run with:  shiny::runApp("shiny-excel-pdf")
# ---------------------------------------------------------------------------

library(shiny)

# Shiny >= 1.5 auto-sources R/, but source it explicitly for older versions.
if (!exists("render_workbook_pdf", mode = "function")) {
  source(file.path("R", "excel_pdf.R"))
}

options(shiny.maxRequestSize = 100 * 1024^2)  # allow 100 MB uploads

use_dt <- has_package("DT")
have_readxl <- has_package("readxl")
PREVIEW_ROWS <- 500

ui <- fluidPage(
  title = "Excel to PDF",
  tags$head(tags$style(HTML("
    body { background: #f7f8fa; }
    .app-title { font-weight: 600; margin: 18px 0 2px; }
    .app-sub { color: #6b7280; margin-bottom: 18px; }
    .panel-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
    .hint { color: #6b7280; font-size: 12px; }
    .warn { color: #b45309; }
    table.dataTable td { white-space: nowrap; }
  "))),

  div(class = "container-fluid",
    h3(class = "app-title", "Excel to PDF"),
    div(class = "app-sub", "Pick a workbook, check the preview, download a paginated PDF."),

    if (!have_readxl) div(
      class = "panel-card warn",
      strong("The readxl package is not installed."),
      " Run ", tags$code('install.packages("readxl")'), " and restart the app."
    ),

    sidebarLayout(
      sidebarPanel(
        class = "panel-card",
        fileInput("file", "Excel file",
                  accept = c(".xlsx", ".xlsm", ".xls",
                             "application/vnd.ms-excel",
                             "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
                  buttonLabel = "Browse...", placeholder = "No file selected"),
        selectInput("sheet", "Sheet", choices = character(0)),
        radioButtons("scope", "Export", inline = TRUE,
                     choices = c("This sheet" = "sheet", "All sheets" = "all"),
                     selected = "sheet"),
        tags$hr(),
        fluidRow(
          column(6, selectInput("paper", "Paper",
                                choices = c("A4" = "a4", "Letter" = "letter",
                                            "Legal" = "legal", "A3" = "a3"),
                                selected = "a4")),
          column(6, selectInput("orientation", "Orientation",
                                choices = c("Portrait" = "portrait", "Landscape" = "landscape"),
                                selected = "landscape"))
        ),
        sliderInput("fontsize", "Font size (pt)", min = 5, max = 14, value = 8, step = 0.5),
        sliderInput("margin", "Page margin (in)", min = 0.25, max = 1.25, value = 0.5, step = 0.05),
        sliderInput("max_chars", "Max characters per cell", min = 10, max = 200, value = 80, step = 5),
        checkboxInput("repeat_first", "Repeat the first column on every page", TRUE),
        tags$hr(),
        uiOutput("download_ui"),
        div(class = "hint", style = "margin-top:8px;",
            "Wide sheets are split across pages by column; long sheets by row.")
      ),

      mainPanel(
        div(class = "panel-card",
          uiOutput("summary"),
          if (use_dt) DT::DTOutput("preview") else tableOutput("preview"),
          div(class = "hint", textOutput("preview_note", inline = TRUE))
        )
      )
    )
  )
)

server <- function(input, output, session) {

  workbook <- reactive({
    req(input$file)
    validate(need(have_readxl, "Install the readxl package to read Excel files."))
    path <- input$file$datapath
    sheets <- tryCatch(excel_sheet_names(path), error = function(e) e)
    validate(need(
      !inherits(sheets, "error") && length(sheets) > 0,
      paste0("Could not read this file as an Excel workbook",
             if (inherits(sheets, "error")) paste0(": ", conditionMessage(sheets)) else ".")
    ))
    list(path = path, name = input$file$name, sheets = sheets)
  })

  observeEvent(workbook(), {
    sheets <- workbook()$sheets
    updateSelectInput(session, "sheet", choices = sheets, selected = sheets[1])
  })

  current_sheet <- reactive({
    wb <- workbook()
    req(input$sheet %in% wb$sheets)
    df <- withProgress(message = "Reading sheet", value = 0.5, {
      tryCatch(read_excel_sheet(wb$path, input$sheet), error = function(e) e)
    })
    validate(need(!inherits(df, "error"),
                  paste0("Could not read sheet \"", input$sheet, "\": ",
                         if (inherits(df, "error")) conditionMessage(df) else "")))
    df
  })

  # Preview is capped so a huge sheet does not stall the browser; the export
  # always reads every row.
  preview_data <- reactive({
    df <- current_sheet()
    if (nrow(df) > PREVIEW_ROWS) df[seq_len(PREVIEW_ROWS), , drop = FALSE] else df
  })

  output$summary <- renderUI({
    if (is.null(input$file)) {
      return(div(class = "hint", "Choose an Excel file to get started."))
    }
    wb <- workbook()
    df <- current_sheet()
    tagList(
      tags$h4(wb$name),
      div(class = "hint", sprintf(
        "%s | sheet \"%s\": %s rows x %s columns",
        ngettext(length(wb$sheets), "1 sheet", sprintf("%d sheets", length(wb$sheets))),
        input$sheet, format(nrow(df), big.mark = ","), ncol(df)
      )),
      tags$br()
    )
  })

  output$preview_note <- renderText({
    df <- current_sheet()
    if (nrow(df) > PREVIEW_ROWS) {
      sprintf("Previewing the first %s of %s rows. The PDF includes all of them.",
              format(PREVIEW_ROWS, big.mark = ","), format(nrow(df), big.mark = ","))
    } else {
      ""
    }
  })

  if (use_dt) {
    output$preview <- DT::renderDT(
      {
        DT::datatable(
          preview_data(),
          rownames = FALSE,
          filter = "none",
          options = list(scrollX = TRUE, pageLength = 15,
                         lengthMenu = c(10, 15, 25, 50, 100))
        )
      },
      server = TRUE
    )
  } else {
    output$preview <- renderTable(utils::head(preview_data(), 25))
  }

  output$download_ui <- renderUI({
    if (is.null(input$file)) {
      return(tags$button(class = "btn btn-default", disabled = NA, "Download PDF"))
    }
    downloadButton("download", "Download PDF", class = "btn-primary")
  })

  output$download <- downloadHandler(
    filename = function() {
      base <- sub("\\.(xlsx|xlsm|xlsb|xls)$", "", input$file$name, ignore.case = TRUE)
      paste0(base, ".pdf")
    },
    content = function(file) {
      wb <- workbook()
      wanted <- if (identical(input$scope, "all")) wb$sheets else input$sheet
      withProgress(message = "Building PDF", value = 0, {
        setProgress(0.05, detail = "reading workbook")
        data <- read_workbook(wb$path, wanted)
        setProgress(0.3, detail = "laying out pages")
        render_workbook_pdf(
          data, file,
          title            = wb$name,
          paper            = input$paper,
          orientation      = input$orientation,
          fontsize         = input$fontsize,
          margin           = input$margin,
          max_chars        = input$max_chars,
          repeat_first_col = isTRUE(input$repeat_first),
          progress = function(frac, msg) setProgress(0.3 + 0.7 * frac, detail = msg)
        )
      })
    },
    contentType = "application/pdf"
  )
}

shinyApp(ui, server)
