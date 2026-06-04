export function normaliseItemName(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, " ")
        .replace(/ies$/, "y")
        .replace(/oes$/, "o")
        .replace(/s$/, "");
}