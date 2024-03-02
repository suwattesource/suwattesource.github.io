
export function isNumber(str: string) {
    return /^[0-9]+$/.test(str);
}

export function numberWithDot(num: string) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
