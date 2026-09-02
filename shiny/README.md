# Bistro — Shiny homepage

A standalone R Shiny app with a top navbar and a fixed homepage card grid.
It is independent of the React app in the repo root.

## Run

```r
install.packages(c("shiny", "bslib", "bsicons"))
shiny::runApp("shiny")
```

## Homepage layout

One CSS grid, 5 columns wide and 4 rows tall (`www/styles.css`), with the cards
placed by the `.grid-a` … `.grid-d` classes in `app.R`. Card sizes are width x height:

```
+---------+---------+---+
|    A    |    B    | D |   A: top left,    2 wide x 2 tall  (this week at a glance)
|  (2x2)  |  (2x2)  |1x4|   B: top middle,  2 wide x 2 tall  (cooking time chart)
+---------+---------+   |   C: bottom left, 4 wide x 2 tall  (meal plan table)
|         C         |   |   D: right rail,  1 wide x 4 tall  (shopping list)
|       (4x2)       |   |
+-------------------+---+
```

Below 992px the right-hand rail moves under the other cards; below 576px
everything stacks in a single column.

The card contents are placeholder data — swap the `planned_meals` /
`shopping_list` objects and the `output$*` renderers in `app.R` for real data.
