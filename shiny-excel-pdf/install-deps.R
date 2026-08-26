# Installs everything the app needs:
#   Rscript install-deps.R
required <- c("shiny", "readxl")   # DT is optional but makes the preview nicer
optional <- c("DT")

install_missing <- function(pkgs) {
  missing <- pkgs[!vapply(pkgs, requireNamespace, logical(1), quietly = TRUE)]
  if (length(missing)) {
    install.packages(missing, repos = getOption("repos", "https://cloud.r-project.org"))
  }
  invisible(missing)
}

install_missing(required)
try(install_missing(optional), silent = TRUE)

still_missing <- required[!vapply(required, requireNamespace, logical(1), quietly = TRUE)]
if (length(still_missing)) {
  stop("Could not install: ", paste(still_missing, collapse = ", "))
}
cat("Dependencies ready. Start the app with:  shiny::runApp()\n")
