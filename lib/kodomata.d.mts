export const KODOMATA_VERSION: number
export const PAD: [number, number]
export const GROUND: { size: number; cell: number }
export function fieldHeight(x: number, z: number): number
export function groundGrid(): Float32Array
export function groundHeight(x: number, z: number): number
export const RANGE: { bearing: number; far: number; feet: [number, number, number][] }
export const RANGE_AT: [number, number]
export const RANGE_TURN: number
export function onRange(x: number, z: number, margin?: number): boolean
export const GROVES: [number, number, number][]
export const TREES: [number, number, number, number][]
export const TRUNKS: [number, number, number][]
export const MONOLITH: [number, number]
export const TALLY: [number, number]
export const RESERVED: { name: string; x0: number; z0: number; x1: number; z1: number }[]
