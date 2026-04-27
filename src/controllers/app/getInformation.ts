import type { Request, Response } from "express";

export default async function getAppInformation(_: Request, res: Response) {
	const memoryUsage = process.memoryUsage();
	
	return res.status(200).json({
		version: "1.0.0", // will change this later
		uptime: process.uptime(),
		memory: {
			heapUsed: memoryUsage.heapUsed / 1024 / 1024,
			heapTotal: memoryUsage.heapTotal / 1024 / 1024,
			rss: memoryUsage.rss / 1024 / 1024,
			external: memoryUsage.external / 1024 / 1024,
		}
	})
}