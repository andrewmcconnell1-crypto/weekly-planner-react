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

export function slugifyIdPart(value) {
    return normaliseItemName(value).replace(/\s+/g, "-") || "item";
}

export function createCollectionId(prefix, collection, name) {
    const existingIds = new Set(collection.map((item) => item.id));
    const baseId = `${prefix}-${slugifyIdPart(name)}`;

    if (!existingIds.has(baseId)) return baseId;

    let suffix = 2;
    let nextId = `${baseId}-${suffix}`;

    while (existingIds.has(nextId)) {
        suffix += 1;
        nextId = `${baseId}-${suffix}`;
    }

    return nextId;
}