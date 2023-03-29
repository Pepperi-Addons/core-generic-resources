import { BasePNSService } from './basePNS.service';


export class AccountUsersPNSService extends BasePNSService 
{

	async subscribeToPNS(): Promise<void> 
	{
		// for account_users maintenance
		await this.subscribe("/adal/update_account_users", "papiAccountUsersChanged", "update", "account_users");
		await this.subscribe("/adal/update_account_users", "papiAccountUsersAdded", "insert", "account_users");
	}

	getResourceName(): string 
	{
		return 'account_users';
	}

	async updateAccountUsers(messageFromPNS: any) 
	{
		console.log("ACCOUNT USERS UPDATE PNS TRIGGERED");
		let updatedPapiAccountUsers = await this.getPapiUpdatedObjects(messageFromPNS, this.getResourceName());
		updatedPapiAccountUsers = this.replaceUUIDs(updatedPapiAccountUsers);
		updatedPapiAccountUsers = this.fixResourceTypeFields(updatedPapiAccountUsers);
		const batchUpsertResponse = await this.upsertObjects(updatedPapiAccountUsers);
		console.log("ACCOUNT USERS UPDATE PNS FINISHED. BATCH UPSERT RESPONSE: " + JSON.stringify(batchUpsertResponse));
	}
}
