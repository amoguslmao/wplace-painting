import { AccountManager } from "../services/accountManager.js";
import { AppSetting } from "../services/settings.js";
import type { AccountPredictedCharge } from "../types/users.js";

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
					predictedCharges: Math.min(
						predictedCharges,
						account.user.charges.max,
					),
					maxCharges: account.user.charges.max,
					cooldown: account.user.charges.cooldownMs,
					waitTime: 0,
				});

				continue;
			}

			const leftCharge = targetCharges - predictedCharges;

			result.push({
				id: account.id,
				predictedCharges: predictedCharges,
				maxCharges: account.user.charges.max,
				cooldown: account.user.charges.cooldownMs,
				waitTime: Math.ceil(
					leftCharge * account.user.charges.cooldownMs,
				),
			});
		}

		result.sort((a, b) => {
			return a.waitTime - b.waitTime;
		});

		return result;
	}

	/**
	 * Get the first refilling account
	 * @returns Return account that refilled charges
	 */
	public getFirstRefillingAccount() {
		return this.getQueue()[0];
	}
}
