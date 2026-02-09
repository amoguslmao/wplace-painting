import sharp, { type Sharp, type Metadata, type SharpInput, type Region } from "sharp";
import type { RGBArray } from "../types/color.js";

export class ImageManiputation {
	public loaded = false;

	private _sharp?: Sharp;

	private _data?: Buffer;
	private _raw?: Buffer;
	private _metadata?: Metadata;

	public constructor(input: SharpInput) {
		this._sharp = this.createSharp(input);
	}

	public static async create(input: SharpInput) {
		return await new ImageManiputation(input).flush();
	}

	public get sharp() {
		const { _sharp, loaded } = this;

		if (!_sharp || !loaded) {
			throw new Error("Instance is not loaded");
		}

		return _sharp;
	}

	public get metadata() {
		const { _metadata, loaded } = this;

		if (!_metadata || !loaded) {
			throw new Error("Instance is not loaded");
		}

		return _metadata;
	}

	private createSharp(input: SharpInput) {
		return sharp(input).ensureAlpha(1);
	}

	public async flush() {
		if (!this._sharp) {
			throw new Error("Instance is not created correctly");
		}

		const data = await this._sharp.toBuffer();
		this._data = data;

		this._metadata = await sharp(data).metadata();

		const raw = this.createSharp(data).raw();
		this._raw = await raw.toBuffer();

		this._sharp = this.createSharp(data);

		this.loaded = true;

		return this;
	}

	public crop(region: Region) {
		this._sharp = this.sharp.extract(region);
		return this;
	}

	public resize(width: number, height: number) {
		this._sharp = this.sharp.resize(width, height);
		return this;
	}

	public rotate(degrees: number) {
		this._sharp = this.sharp.rotate(degrees);
		return this;
	}

	public toBuffer() {
		const { _data, loaded } = this;

		if (!_data || !loaded) {
			throw new Error("Instance is not loaded");
		}

		return _data;
	}

	public toRawBuffer() {
		const { _raw, loaded } = this;

		if (!_raw || !loaded) {
			throw new Error("Instance is not loaded");
		}

		return _raw;
	}

	public getPixel(x: number, y: number): RGBArray {
		const { metadata } = this;
		const { height, width } = metadata;

		const data = this.toRawBuffer();

		const checkBound = (pos: number, max: number) => pos < max && pos >= 0;

		if (!checkBound(x, width) || !checkBound(y, height)) {
			throw new Error("Position is out of bound");
		}

		const index = (y * width + x) * 4;

		return [
			data[index],
			data[index + 1],
			data[index + 2],
		];
	}
}
