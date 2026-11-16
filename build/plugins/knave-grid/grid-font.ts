export class GridFont {
  readonly name: string;
  readonly fontFamily: string[];
  private readonly weights = new Set<string>();

  constructor(name: string, fontFamily: string[]) {
    this.name = name;
    this.fontFamily = fontFamily;
  }

  addWeight(weight: string): void {
    this.weights.add(weight);
  }

  isUsed(): boolean {
    return this.weights.size > 0;
  }

  clause(): string {
    const familyName = this.fontFamily[0];
    const files = [...this.weights].sort().map((weight) => `(${weight} "${GridFont.fileName(familyName, weight)}")`);
    return `(${this.name} "${familyName}" ${files.join(" ")})`;
  }

  static fileName(familyName: string, weight: string): string {
    return `${familyName.toLowerCase().replaceAll(" ", "-")}-${weight}.woff2`;
  }
}
