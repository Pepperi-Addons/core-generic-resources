import { PnsParams } from '../../models/metadata';
import { BasePNSService } from './basePNS.service';
import { UsersGetterService } from '../getters/usersGetter.service';
import { AdalService } from '../adal.service';
import { Client } from '@pepperi-addons/debug-server/dist';
import { Helper } from 'core-resources-shared';

export class UsersPNSService extends BasePNSService
{

	protected papiUsersService: UsersGetterService;
	protected adalService: AdalService;

	constructor(client: Client)
	{
		super(client);
		const papiClient = Helper.getPapiClient(client);
		this.papiUsersService = new UsersGetterService(papiClient);
		this.adalService = new AdalService(papiClient);
	}

	async getSubscribeParamsSets(): Promise<PnsParams[]>
	{
		// for users maintenance
		return [
			{AddonRelativeURL: "/adal/update_users", Name: "papiUsersChanged", Action: "update", Resource: "users"},
			{AddonRelativeURL: "/adal/update_users", Name: "papiUsersAdded", Action: "insert", Resource: "users"}
		]
	}

	async updateAdalTable(messageFromPNS: any): Promise<void>
	{
		try
		{
			console.log("USERS UPDATE PNS TRIGGERED");
			const usersUUIDs = messageFromPNS.Message.ModifiedObjects.map(obj => obj.ObjectKey);
			console.log("USERS UUIDS: " + JSON.stringify(usersUUIDs));
			const uuidsChunks = this.chunkifyKeysArray(usersUUIDs);
			for(const uuidsChunk of uuidsChunks)
			{
				const updatedPapiUsersByKeysRes = await this.papiUsersService.getObjectsByKeys(uuidsChunk);
				let updatedPapiUsers = updatedPapiUsersByKeysRes.Objects;
				updatedPapiUsers = this.papiUsersService.fixObjects(updatedPapiUsers);
				await this.adalService.batchUpsert('users', updatedPapiUsers);
			}
			console.log("USERS UPDATE PNS FINISHED");
		}
		catch (error)
		{
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred.';
			await this.sendAlertToCoreResourcesAlertsChannel("Error on updating users PNS", JSON.stringify(errorMessage));
		}
	}
}
