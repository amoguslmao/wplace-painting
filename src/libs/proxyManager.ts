import fs from "fs/promises";

class ProxyManager {
	public proxyList: string[];
	private proxyIndex: number;

	public constructor() {
		this.proxyList = [];
		this.proxyIndex = 0;
	}

	public async init(): Promise<this> {
		const rawProxies = (await fs.readFile("./input/proxies.txt", { encoding: "utf8" }))
			.split("\n")
			.map(line => line.trim())
			.filter(Boolean);

		const unique = new Set(rawProxies);

		const proxyUnique = Array.from(unique);

		for (const proxy of proxyUnique) {
			try {
				const url = new URL(proxy);

				this.proxyList.push(`${url.protocol}//${url.hostname}:${url.port ? url.port : "80"}`);
			} 
			catch (error) {
				console.warn(`Got an error when parsing ${proxy}\n`, error);
			}
		}

		if (this.proxyList.length > 0) {
			console.log(`Loaded total ${this.proxyList.length} proxies!`);
		}
		else {
			console.log("There is no proxy loaded in 'proxies.txt', fallback to the IP of this machine.");
		}
		
		return this;
	}

	public nextProxy(): string {
		if (this.proxyIndex >= this.proxyList.length) {
			this.proxyIndex = 0;
		}

		return this.proxyList[this.proxyIndex++];
	}
}

const proxyManager = await new ProxyManager().init();

export default proxyManager;