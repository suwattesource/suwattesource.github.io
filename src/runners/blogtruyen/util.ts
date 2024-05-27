import {categories} from "./filters.json"

export function getCategoryId(category: string) {
    for (const cat of categories) {
        if (cat.name == category) {
            return cat.id || 0
        }
    }
    return 0
}

export function getId(str: string, separator: string) {
    const id = str.split(separator).pop() || "0"
    return Number(id)
}
