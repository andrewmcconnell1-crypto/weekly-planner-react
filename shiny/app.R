# Bistro — Shiny homepage
#
# Homepage layout (a single 5-column x 4-row CSS grid):
#
#   +---------+---------+---+
#   |    A    |    B    | D |   A: 2 rows x 2 cols
#   |  (2x2)  |  (2x2)  |   |   B: 2 rows x 2 cols
#   +---------+---------+ 4 |   C: 2 rows x 4 cols
#   |         C         | x |   D: 4 rows x 1 col (full page height)
#   |       (2x4)       | 1 |
#   +-------------------+---+
#
# Run with:  shiny::runApp("shiny")

library(shiny)
library(bslib)

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

home_page <- div(
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
        showcase = bsicons::bs_icon("calendar-check"),
        theme = "primary"
      ),
      value_box(
        title = "Items to buy",
        value = textOutput("items_to_buy", inline = TRUE),
        showcase = bsicons::bs_icon("basket"),
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
    checkboxGroupInput(
      "bought", NULL,
      choices = shopping_list,
      width = "100%"
    ),
    card_footer(textOutput("bought_summary"))
  )
)

ui <- page_navbar(
  title = "Bistro",
  id = "nav",
  theme = bs_theme(version = 5, preset = "shiny"),
  fillable = "Home",
  header = tags$head(tags$link(rel = "stylesheet", href = "styles.css")),

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
    min_serves <- as.integer(input$serves_filter %||% 0)
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
