export const TERRAIN_VERSION: number
export const CHUNK: number
export const RIVER: { half: number; bank: number }
export function hash2(ix: number, iz: number, seed: number): number
export function riverX(z: number): number
export function plainHeight(x: number, z: number): number
export function iceHeight(z: number): number
export function height(x: number, z: number): number
export function onIce(x: number, z: number, margin?: number): boolean
export function normal(x: number, z: number, e?: number): [number, number, number]
export function footprintRange(x0: number, z0: number, x1: number, z1: number, step?: number): { lo: number; hi: number }
export function chunkKey(cx: number, cz: number): string
export function chunkOf(x: number, z: number): [number, number]
export function chunkCenter(cx: number, cz: number): [number, number]
