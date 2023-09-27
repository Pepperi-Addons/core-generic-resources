import { PapiClient } from '@pepperi-addons/papi-sdk';
import { BasePNSService } from './basePNS.service';
import { AccountUsersGetterService } from '../getters/accountUsersGetter.service';
import { PnsParams } from '../../models/metadata';
import { AdalService } from '../adal.service';
import { AccountBuyersGetterService } from '../getters/accountBuyersGetter.service';

export class AccountUsersPNSService extends BasePNSService 
{
	protected papiAccountUsersService: AccountUsersGetterService;
	protected adalService: AdalService;

	constructor(papiClient: PapiClient) 
	{
		super(papiClient);
		this.papiAccountUsersService = new AccountUsersGetterService(papiClient);
		this.adalService = new AdalService(papiClient);
	}

	async getSubscribeParamsSets(): Promise<PnsParams[]>
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
		const uuidsChunks = this.chunkifyKeysArray(accountUsersUUIDs);
		for(const uuidsChunk of uuidsChunks)
		{
			const accountUsersByKeysRes = await this.papiAccountUsersService.getObjectsByKeys(uuidsChunk);
			let updatedPapiAccountUsers = accountUsersByKeysRes.Objects;
	
			// check if missing results, then search in account_buyers
			if(updatedPapiAccountUsers.length < uuidsChunk.length) 
			{
				const missingUUIDs = uuidsChunk.filter(uuid => !updatedPapiAccountUsers.find(user => user.UUID == uuid));
				const accountBuyersService = new AccountBuyersGetterService(this.papiClient);
				const missingAccountUsers = await accountBuyersService.getObjectsByKeys(missingUUIDs);
				updatedPapiAccountUsers = updatedPapiAccountUsers.concat(missingAccountUsers);
			}
			updatedPapiAccountUsers = this.papiAccountUsersService.fixObjects(updatedPapiAccountUsers);
			await this.adalService.batchUpsert('account_users', updatedPapiAccountUsers);
		}
		console.log("ACCOUNT USERS UPDATE PNS FINISHED");
	}
}
