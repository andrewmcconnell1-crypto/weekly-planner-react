# Bistro — Shiny homepage

A standalone R Shiny app with a top navbar and a fixed homepage card grid.
It is independent of the React app in the repo root.

`app.R` is entirely self-contained — the grid CSS is inlined in the file — so
you can open it in RStudio or VS Code and run it directly, with no `www/`
directory or other files needed.

## Run

```r
install.packages(c("shiny", "bslib"))
shiny::runApp("shiny")
```

Those two packages are the only dependencies.

## Homepage layout

One CSS grid, 5 columns wide and 4 rows tall, with the cards placed by the
`.grid-a` … `.grid-d` classes. Card sizes are width x height:

```
+---------+---------+---+
|    A    |    B    | D |   A: top left,    2 wide x 2 tall  (this week at a glance)
|  (2x2)  |  (2x2)  |1x4|   B: top middle,  2 wide x 2 tall  (cooking time chart)
+---------+---------+   |   C: bottom left, 4 wide x 2 tall  (meal plan table)
|         C         |   |   D: right rail,  1 wide x 4 tall  (shopping list)
|       (4x2)       |   |
+-------------------+---+
```

The grid fills the viewport height via bslib's fill machinery (`as_fill_item()`
on the grid plus a fillable Home panel), so no navbar height is hard-coded.
Cards scroll their own overflow rather than spilling past their borders.

Below 800px the right-hand rail moves under the other cards and the grid
releases its viewport height so cards grow with their content; below 576px
everything stacks in a single column.

## Verified

Rendered and screenshotted at 1440px, 900px and 560px wide against a running
instance (Shiny 1.8.0, bslib 0.6.1): no horizontal overflow at any width, and
the full grid fits one viewport on desktop with no page scroll.

The card contents are placeholder data — swap the `planned_meals` /
`shopping_list` objects and the `output$*` renderers in `app.R` for real data.
