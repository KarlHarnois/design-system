const SVG_OPENING = "<svg ";
const VIEW_BOX = /viewBox="([^"]+)"/;

export class TintedImage {
  private readonly source: string;

  constructor(source: string) {
    if (!source.includes(SVG_OPENING)) throw new Error("A bar image must be an SVG document");
    this.source = source;
  }

  render(cssColor: string): string {
    return this.source.replace(SVG_OPENING, `${SVG_OPENING}color="${cssColor}" `);
  }

  aspectRatio(): number {
    const viewBox = this.source.match(VIEW_BOX)?.[1];
    if (viewBox === undefined) throw new Error("A bar image needs a viewBox to size it");
    const [, , width, height] = viewBox.trim().split(/[\s,]+/).map(Number);
    return width / height;
  }
}
