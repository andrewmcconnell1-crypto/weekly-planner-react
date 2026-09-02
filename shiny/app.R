# Bistro — Shiny homepage
#
# A single self-contained file: the grid CSS is inlined below, so this app
# runs on its own with nothing but `shiny` and `bslib` installed.
#
# Homepage layout, in width x height (one 5-column x 4-row CSS grid):
#
#   +---------+---------+---+
#   |    A    |    B    | D |   A: top left,    2 wide x 2 tall
#   |  (2x2)  |  (2x2)  |1x4|   B: top middle,  2 wide x 2 tall
#   +---------+---------+   |   C: bottom left, 4 wide x 2 tall
#   |         C         |   |   D: right rail,  1 wide x 4 tall (full page height)
#   |       (4x2)       |   |
#   +-------------------+---+
#
# Run with:  shiny::runApp("shiny")
# or open this file in RStudio / VS Code and run it.

library(shiny)
library(bslib)

# ---- layout css ------------------------------------------------------------
# Inlined rather than kept in www/styles.css so the file stands alone.

grid_css <- HTML("
.home-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  grid-template-rows: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  padding: 1rem;
  /* Height comes from bslib fill machinery: as_fill_item() on the grid plus a
     fillable Home panel, so it stretches to the viewport with no hard-coded
     navbar height to get wrong. */
  min-height: 0;
  /* as a flex item the grid would otherwise refuse to shrink below the
     min-content width of the widest card (the meal table), overflowing the
     page sideways on narrow screens */
  min-width: 0;
}

/* let cards shrink inside their grid tracks, and scroll their own overflow
   instead of spilling past the card border */
.home-grid > .card { min-height: 0; min-width: 0; }
.home-grid > .card > .card-body { min-height: 0; overflow: auto; }

.grid-a { grid-column: 1 / span 2; grid-row: 1 / span 2; }  /* 2 wide x 2 tall */
.grid-b { grid-column: 3 / span 2; grid-row: 1 / span 2; }  /* 2 wide x 2 tall */
.grid-c { grid-column: 1 / span 4; grid-row: 3 / span 2; }  /* 4 wide x 2 tall */
.grid-d { grid-column: 5 / span 1; grid-row: 1 / span 4; }  /* 1 wide x 4 tall */

/* Tablet: drop the right-hand rail to the bottom, keep A and B side by side. */
@media (max-width: 800px) {
  .home-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    /* Release the viewport-height fill (as_fill_item sets flex: 1 1 auto) so
       stacked cards grow with their content and the page scrolls instead.
       !important is needed to beat bslib own .html-fill-item rule. */
    flex: 0 0 auto !important;
    height: auto !important;
    grid-template-rows: none;
    grid-auto-rows: minmax(240px, auto);
  }
  .grid-a { grid-column: 1; grid-row: 1; }
  .grid-b { grid-column: 2; grid-row: 1; }
  .grid-c { grid-column: 1 / span 2; grid-row: 2; }
  .grid-d { grid-column: 1 / span 2; grid-row: 3; }
  /* once stacked, let cards grow with their content and scroll the page
     instead of scrolling inside each card */
  .home-grid > .card > .card-body { overflow: visible; }
}

/* Phone: single column, source order. */
@media (max-width: 576px) {
  .home-grid {
    grid-template-columns: minmax(0, 1fr);
    grid-auto-rows: minmax(220px, auto);
  }
  .grid-a, .grid-b, .grid-c, .grid-d { grid-column: 1; grid-row: auto; }
}
")

# ---- data ------------------------------------------------------------------

days <- c("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")

planned_meals <- data.frame(
  Day     = days,
  Meal    = c(
    "Mexican chicken bowls", "Thai green curry", "Roast veg pasta",
    "Steak and chips", "Katsu curry", "Homemade pizza", "Sunday roast"
  ),
  Serves  = c(4L, 4L, 2L, 2L, 4L, 6L, 6L),
  Minutes = c(35L, 40L, 25L, 30L, 45L, 60L, 120L),
  stringsAsFactors = FALSE
)

shopping_list <- c(
  "Chicken thighs (1kg)", "Coconut milk x2", "Basmati rice",
  "Red peppers x3", "Coriander", "Parmesan", "Passata x2"
)

# ---- ui --------------------------------------------------------------------

home_page <- as_fill_item(div(
  class = "home-grid",

  card(
    class = "grid-a",
    full_screen = TRUE,
    card_header("This week at a glance"),
    layout_column_wrap(
      width = 1 / 2,
      fill = FALSE,
      value_box(
        title = "Meals planned",
        value = textOutput("meals_planned", inline = TRUE),
        theme = "primary"
      ),
      value_box(
        title = "Items to buy",
        value = textOutput("items_to_buy", inline = TRUE),
        theme = "secondary"
      )
    ),
    p(
      class = "text-muted mb-0",
      "Everything for the week, pulled from the planner and the pantry."
    )
  ),

  card(
    class = "grid-b",
    full_screen = TRUE,
    card_header("Cooking time by day"),
    plotOutput("time_plot", height = "100%")
  ),

  card(
    class = "grid-c",
    full_screen = TRUE,
    card_header(
      class = "d-flex justify-content-between align-items-center",
      "Meal plan",
      selectInput(
        "serves_filter", NULL,
        choices = c("All sizes" = 0, "Serves 2+" = 2, "Serves 4+" = 4),
        selected = 0, width = "160px"
      )
    ),
    tableOutput("plan_table")
  ),

  card(
    class = "grid-d",
    full_screen = TRUE,
    card_header("Shopping list"),
    checkboxGroupInput("bought", NULL, choices = shopping_list, width = "100%"),
    card_footer(textOutput("bought_summary"))
  )
))

ui <- page_navbar(
  title = "Bistro",
  id = "nav",
  theme = bs_theme(version = 5),
  fillable = "Home",
  header = tags$style(grid_css),

  nav_panel("Home", home_page),
  nav_panel("Planner", card(card_header("Planner"), "Plan the week's meals here.")),
  nav_panel("Shopping", card(card_header("Shopping"), "Build and tick off the list here.")),
  nav_panel("Recipes", card(card_header("Recipes"), "Browse and rate recipes here.")),
  nav_panel("Pantry", card(card_header("Pantry"), "Track what's already in stock here.")),

  nav_spacer(),
  nav_item(tags$a("Docs", href = "https://shiny.posit.co", target = "_blank"))
)

# ---- server ----------------------------------------------------------------

server <- function(input, output, session) {

  visible_meals <- reactive({
    min_serves <- as.integer(input$serves_filter)
    planned_meals[planned_meals$Serves >= min_serves, ]
  })

  output$meals_planned <- renderText(nrow(planned_meals))

  output$items_to_buy <- renderText(
    length(shopping_list) - length(input$bought)
  )

  output$time_plot <- renderPlot({
    par(mar = c(3, 3, 1, 1), bg = NA)
    barplot(
      planned_meals$Minutes,
      names.arg = planned_meals$Day,
      col = "#447099",
      border = NA,
      ylab = "",
      las = 1
    )
  })

  output$plan_table <- renderTable(visible_meals(), width = "100%")

  output$bought_summary <- renderText({
    sprintf("%d of %d picked up", length(input$bought), length(shopping_list))
  })
}

shinyApp(ui, server)
