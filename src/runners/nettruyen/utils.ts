
export function isNumber(str: string) {
    return /^[0-9]+$/.test(str);
}

export function numberWithDot(num: string) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export class Cache<T> {
    private cache: Map<string, T>;

    constructor() {
        this.cache = new Map();
    }

    // Method to set a value in the cache
    set(key: string, value: T): void {
        this.cache.set(key, value);
    }

    // Method to get a value from the cache
    get(key: string): T | undefined {
        return this.cache.get(key);
    }

    // Method to check if a key exists in the cache
    has(key: string): boolean {
        return this.cache.has(key);
    }

    // Method to remove a value from the cache
    remove(key: string): void {
        this.cache.delete(key);
    }

    // Method to clear the entire cache
    clear(): void {
        this.cache.clear();
    }

    // Method to get the size of the cache
    size(): number {
        return this.cache.size;
    }
}
