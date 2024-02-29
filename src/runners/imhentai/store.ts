
export class Store {
  async excludeTags() {
    const value = await ObjectStore.string("exclude_tags");
    if (typeof value !== "string") return [];
    const numbers = (value.match(/\d+/g)?.map(Number) || []).filter(num => !isNaN(num));
    return numbers
  }
}
