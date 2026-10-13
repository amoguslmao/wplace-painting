export async function sleep(duration: number, signal?: AbortSignal) {
	return new Promise<void>((resolve, reject) => {
		if (signal?.aborted) {
			return reject();
		}

		const timer = setTimeout(() => {
			signal?.removeEventListener("abort", onAbort);
			resolve();
		}, duration);

		signal?.addEventListener("abort", onAbort);

		function onAbort() {
			clearTimeout(timer);
			reject();
		}
	});
}
