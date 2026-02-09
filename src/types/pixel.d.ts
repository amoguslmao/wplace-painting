export interface Pixel {
	x: number, 
	y: number,
	tile: Tile
}

export interface Tile {
	x: number,
	y: number
}

export type GlobalPixel = Omit<Pixel, "tile">;