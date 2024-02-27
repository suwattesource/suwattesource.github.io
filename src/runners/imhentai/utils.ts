import entities = require('entities')

export const decodeHTMLEntity = (str: string): string => {
    return entities.decodeHTML(str)
}