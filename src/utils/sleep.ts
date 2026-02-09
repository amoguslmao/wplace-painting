export async function sleep(duration: number) {
	return new Promise<void>((resolve) => {
		setTimeout(resolve, duration);
	});
}