import { AccountManager } from "../services/accountManager.js";
import { AppSetting } from "../services/settings.js";
import type { AccountPredictedCharge } from "../types/users.js";
import { sleep } from "../utils/promises.js";

export class AccountQueue {
	public constructor(private ids: number[]) {}

	public getQueue() {
		const { accounts } = AccountManager.getInstance();
		const { settings } = AppSetting.getInstance();

		const result: AccountPredictedCharge[] = [];

		for (const accountId of this.ids) {
			const account = accounts.get(accountId)!;

			const totalMsPassed = Date.now() - account.lastFetch;

			const totalChargesRefill = totalMsPassed / account.user.charges.cooldownMs;

			const predictedCharges = account.user.charges.count + totalChargesRefill;

			const targetCharges = account.user.charges.max * (settings.chargeThreshold / 100);

			if (predictedCharges >= targetCharges) {
				result.push({
					id: account.id,
					predictedCharges: Math.min(predictedCharges, account.user.charges.max),
					maxCharges: account.user.charges.max,
					cooldown: account.user.charges.cooldownMs,
					waitTime: 0
				});

				continue;
			}

			const leftCharge = targetCharges - predictedCharges;

			result.push({
				id: account.id,
				predictedCharges: predictedCharges,
				maxCharges: account.user.charges.max,
				cooldown: account.user.charges.cooldownMs,
				waitTime: Math.ceil(leftCharge * account.user.charges.cooldownMs)
			});
		}

		result.sort((a,b) => {
			return a.waitTime - b.waitTime;
		});

		return result;
 	}

	/**
	 * Get the refilling account, if there is no account is have enough charge, then it will
	 * sleep until the account is full charges
	 * @returns Return account that refilled charges
	 */
	public async getFirstRefillingAccount() {
		const first = this.getQueue()[0];

		if (first.waitTime !== 0) {
			console.log(`[Queue] No account was refilled. Need to wait ${first.waitTime}ms`);

			await sleep(first.waitTime);
		}

		return first;
	}
}