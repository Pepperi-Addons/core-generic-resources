import { PapiClient } from '@pepperi-addons/papi-sdk';
import { BasePNSService } from './basePNS.service';
import { PapiAccountUsersGetterService } from '../getters/papiAccountUsersGetter.service';


export class AccountUsersPNSService extends BasePNSService 
{
	protected papiAccountUsersService: PapiAccountUsersGetterService;

	constructor(papiClient: PapiClient) 
	{
		super(papiClient);
		this.papiAccountUsersService = new PapiAccountUsersGetterService(papiClient);
	}

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

	async updateAccountUsers(messageFromPNS: any): Promise<void>
	{
		console.log("ACCOUNT USERS UPDATE PNS TRIGGERED");
		const accountUsersUUIDs = messageFromPNS.FilterAttributes.ModifiedObjects;
		let updatedPapiAccountUsers = await this.papiAccountUsersService.getPapiObjectsByUUIDs(accountUsersUUIDs);
		// check if missing results, then search in account_buyers
		updatedPapiAccountUsers = this.papiAccountUsersService.fixPapiObjects(updatedPapiAccountUsers);
		const batchUpsertResponse = await this.adalHelperService.batchUpsert(updatedPapiAccountUsers, this.getResourceName());
		console.log("ACCOUNT USERS UPDATE PNS FINISHED. BATCH UPSERT RESPONSE: " + JSON.stringify(batchUpsertResponse));
	}
}
