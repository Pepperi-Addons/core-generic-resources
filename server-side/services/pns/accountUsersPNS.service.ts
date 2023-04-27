import { PapiClient } from '@pepperi-addons/papi-sdk';
import { BasePNSService } from './basePNS.service';
import { PapiAccountUsersGetterService } from '../getters/papiAccountUsersGetter.service';
import { PnsParams } from '../../models/metadata';
import { AdalService } from '../adal.service';


export class AccountUsersPNSService extends BasePNSService 
{
	protected papiAccountUsersService: PapiAccountUsersGetterService;
	protected adalService: AdalService;

	constructor(papiClient: PapiClient) 
	{
		super(papiClient);
		this.papiAccountUsersService = new PapiAccountUsersGetterService(papiClient);
		this.adalService = new AdalService(papiClient);
	}

	getSubscribeParamsSets(): PnsParams[]
	{
		// for account_users maintenance
		return [
			{AddonRelativeURL: "/adal/update_account_users", Name: "papiAccountUsersChanged", Action: "update", Resource: "account_users"},
			{AddonRelativeURL: "/adal/update_account_users", Name: "papiAccountUsersAdded", Action: "insert", Resource: "account_users"}
		]
	}

	getResourceName(): string 
	{
		return 'account_users';
	}

	async updateAdalTable(messageFromPNS: any): Promise<void>
	{
		console.log("ACCOUNT USERS UPDATE PNS TRIGGERED");
		const accountUsersUUIDs = messageFromPNS.Message.ModifiedObjects.map(obj => obj.ObjectKey);
		console.log("ACCOUNT USERS UUIDS: " + JSON.stringify(accountUsersUUIDs));
		let updatedPapiAccountUsers = await this.papiAccountUsersService.getPapiObjectsByUUIDs(accountUsersUUIDs);
		// check if missing results, then search in account_buyers
		updatedPapiAccountUsers = this.papiAccountUsersService.fixPapiObjects(updatedPapiAccountUsers);
		const batchUpsertResponse = await this.adalService.batchUpsert('account_users', updatedPapiAccountUsers);
		console.log("ACCOUNT USERS UPDATE PNS FINISHED. BATCH UPSERT RESPONSE: " + JSON.stringify(batchUpsertResponse));
	}
}
