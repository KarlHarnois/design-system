import { readFileSync } from "node:fs";
import { join } from "node:path";
import { brotliDecompressSync } from "node:zlib";
import { FontMetrics, type FontMetricsSource } from "./font-metrics.ts";

const WOFF2_HEADER_LENGTH = 48;
const EXPLICIT_TAG_INDEX = 63;
const KNOWN_TAGS = ["cmap", "head", "hhea", "hmtx", "maxp", "name", "OS/2", "post", "cvt ", "fpgm", "glyf", "loca", "prep"];
const NULL_TRANSFORM_FOR_GLYF_AND_LOCA = 3;

type TableEntry = { tag: string; length: number };

export class Woff2FontDirectory implements FontMetricsSource {
  private readonly directory: string;

  constructor(directory: string) {
    this.directory = directory;
  }

  metrics(fileName: string): FontMetrics {
    const tables = Woff2FontDirectory.tables(readFileSync(join(this.directory, fileName)));
    const head = Woff2FontDirectory.required(tables, "head", fileName);
    const hhea = Woff2FontDirectory.required(tables, "hhea", fileName);
    const os2 = Woff2FontDirectory.required(tables, "OS/2", fileName);
    return new FontMetrics(
      head.readUInt16BE(18),
      { ascender: hhea.readInt16BE(4), descender: hhea.readInt16BE(6) },
      { ascender: os2.readInt16BE(68), descender: os2.readInt16BE(70) },
      os2.readInt16BE(88),
      os2.readInt16BE(86),
    );
  }

  private static tables(file: Buffer): Map<string, Buffer> {
    const tableCount = file.readUInt16BE(12);
    const compressedLength = file.readUInt32BE(20);
    const entries: TableEntry[] = [];
    let offset = WOFF2_HEADER_LENGTH;
    for (let index = 0; index < tableCount; index++) {
      const flags = file.readUInt8(offset++);
      const tagIndex = flags & 0x3f;
      let tag = KNOWN_TAGS[tagIndex] ?? `#${tagIndex}`;
      if (tagIndex === EXPLICIT_TAG_INDEX) {
        tag = file.toString("latin1", offset, offset + 4);
        offset += 4;
      }
      const original = Woff2FontDirectory.base128(file, offset);
      offset = original.next;
      let length = original.value;
      if (Woff2FontDirectory.isTransformed(tag, flags >> 6)) {
        const transformed = Woff2FontDirectory.base128(file, offset);
        offset = transformed.next;
        length = transformed.value;
      }
      entries.push({ tag, length });
    }
    return Woff2FontDirectory.split(brotliDecompressSync(file.subarray(offset, offset + compressedLength)), entries);
  }

  private static split(data: Buffer, entries: TableEntry[]): Map<string, Buffer> {
    const tables = new Map<string, Buffer>();
    let start = 0;
    for (const { tag, length } of entries) {
      tables.set(tag, data.subarray(start, start + length));
      start += length;
    }
    return tables;
  }

  private static isTransformed(tag: string, transformVersion: number): boolean {
    const isGlyphTable = tag === "glyf" || tag === "loca";
    return isGlyphTable ? transformVersion !== NULL_TRANSFORM_FOR_GLYF_AND_LOCA : transformVersion !== 0;
  }

  private static base128(file: Buffer, start: number): { value: number; next: number } {
    let value = 0;
    let offset = start;
    let byte: number;
    do {
      byte = file.readUInt8(offset++);
      value = value * 128 + (byte & 0x7f);
    } while (byte & 0x80);
    return { value, next: offset };
  }

  private static required(tables: Map<string, Buffer>, tag: string, fileName: string): Buffer {
    const table = tables.get(tag);
    if (table === undefined) throw new Error(`Font "${fileName}" has no ${tag} table`);
    return table;
  }
}
