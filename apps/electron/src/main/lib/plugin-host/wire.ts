import { createRequire } from 'node:module';
import { join } from 'node:path';
import { hostResources } from './compiler';
const require = createRequire(typeof __filename === 'string' ? __filename : import.meta.url);
interface Codec {
  encode: (value: unknown) => string;
  decode: (line: string) => unknown;
}
let codec: Codec | undefined;
const get = () => codec ??= require(join(hostResources(), 'wire.cjs')) as Codec;
export const encodePluginFrame = (value: unknown): string => get().encode(value);
export const decodePluginFrame = (line: string): unknown => get().decode(line);
