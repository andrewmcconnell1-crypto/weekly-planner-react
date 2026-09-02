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
placed by the `.grid-a` … `.grid-d` classes in `app.R`:

```
+---------+---------+---+
|    A    |    B    | D |   A: 2 rows x 2 cols  (this week at a glance)
|  (2x2)  |  (2x2)  |   |   B: 2 rows x 2 cols  (cooking time chart)
+---------+---------+ 4 |   C: 2 rows x 4 cols  (meal plan table)
|         C         | x |   D: 4 rows x 1 col   (shopping list, full height)
|       (2x4)       | 1 |
+-------------------+---+
```

Below 992px the right-hand rail moves under the other cards; below 576px
everything stacks in a single column.

The card contents are placeholder data — swap the `planned_meals` /
`shopping_list` objects and the `output$*` renderers in `app.R` for real data.
