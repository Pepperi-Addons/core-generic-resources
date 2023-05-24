import { PnsParams } from '../../models/metadata';
import { BasePNSService } from './basePNS.service';
import { UsersGetterService } from '../getters/usersGetter.service';
import { PapiClient } from '@pepperi-addons/papi-sdk';
import { AdalService } from '../adal.service';

export class UsersPNSService extends BasePNSService
{

	protected papiUsersService: UsersGetterService;
	protected adalService: AdalService;

	constructor(papiClient: PapiClient)
	{
		super(papiClient);
		this.papiUsersService = new UsersGetterService(papiClient);
		this.adalService = new AdalService(papiClient);
	}

	getSubscribeParamsSets(): PnsParams[]
	{
		// for users maintenance
		return [
			{AddonRelativeURL: "/adal/update_users", Name: "papiUsersChanged", Action: "update", Resource: "users"},
			{AddonRelativeURL: "/adal/update_users", Name: "papiUsersAdded", Action: "insert", Resource: "users"}
		]
	}

	async updateAdalTable(messageFromPNS: any): Promise<void>
	{
		console.log("USERS UPDATE PNS TRIGGERED");
		const usersUUIDs = messageFromPNS.Message.ModifiedObjects.map(obj => obj.ObjectKey);
		console.log("USERS UUIDS: " + JSON.stringify(usersUUIDs));
		let updatedPapiUsers = await this.papiUsersService.getObjectsByKeys(usersUUIDs);
		updatedPapiUsers = this.papiUsersService.fixObjects(updatedPapiUsers);
		const batchUpsertResponse = await this.adalService.batchUpsert('users', updatedPapiUsers);
		console.log("USERS UPDATE PNS FINISHED. BATCH UPSERT RESPONSE: " + JSON.stringify(batchUpsertResponse));
	}
}
