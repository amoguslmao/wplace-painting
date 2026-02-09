import { Impit } from "impit";
import proxyManager from "../libs/proxyManager.js";
import { sleep } from "../utils/sleep.js";

const proxyList = proxyManager.proxyList;

async function impitFetch(proxy: string, url: string) {
	const impit = new Impit({
		proxyUrl: proxy,
		browser: "chrome",
		http3: true,
		ignoreTlsErrors: true,
		timeout: 10000
	});

	try {
		const response = await impit.fetch(url, {
			method: "GET"
		});

		if (response.ok) {
			console.log(`Proxy ${proxy} response:`, await response.json());
		}
		else {
			console.log(`Proxy ${proxy} is not ok / Status: ${response.status} / Response: ${await response.text()}`);
		}
	} catch (error) {
		console.error(`Proxy ${proxy} got error: `, error);
	}
}

const requestArray: Promise<void>[] = [];

for (const proxy of proxyList) {
	requestArray.push(impitFetch(proxy, "https://place34.com/api/pixel/1630/962/837/456"));
}

const BATCH_SIZE = 10;

for (let i = 0; i < requestArray.length; i += BATCH_SIZE) {
	const batch = requestArray.slice(i, i + BATCH_SIZE);

	await Promise.all(batch);
	//console.log(`${batch.length} request completed`);

	await sleep(3000);
}
// console.log xuat hien sau khi response xong, nen se kha loan. 
// thanh ra la no moi hien thi loan xoan ngau log