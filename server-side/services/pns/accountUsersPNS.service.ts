import { BasePNSService } from './basePNS.service';
import { AccountUsersGetterService } from '../getters/accountUsersGetter.service';
import { PnsParams } from '../../models/metadata';
import { AdalService } from '../adal.service';
import { AccountBuyersGetterService } from '../getters/accountBuyersGetter.service';
import { Client } from '@pepperi-addons/debug-server/dist';
import { Helper } from 'core-resources-shared';

export class AccountUsersPNSService extends BasePNSService 
{
	protected papiAccountUsersService: AccountUsersGetterService;
	protected adalService: AdalService;

	constructor(client: Client)
	{
		super(client);
		const papiClient = Helper.getPapiClient(client);
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
		try
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
		catch (error)
		{
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred.';
			await this.sendAlertToCoreResourcesAlertsChannel("Error on updating account_users PNS", JSON.stringify(errorMessage));
		}
	}
}
