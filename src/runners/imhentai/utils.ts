export function startCase(str: string | undefined) {
    if (!str) {
        return ""
    }
    return str.toLowerCase().replace(/(?:^|\s)(\S)/g, function (match) {
        return match.toUpperCase();
    });
}
