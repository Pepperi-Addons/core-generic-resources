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
		super(client, "USERS UPDATE");
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

	async chunkUpdateLogic(uuidsChunk: string[]): Promise<void>
	{
		const updatedPapiUsersByKeysRes = await this.papiUsersService.getObjectsByKeys(uuidsChunk);
		let updatedPapiUsers = updatedPapiUsersByKeysRes.Objects;
		updatedPapiUsers = this.papiUsersService.fixObjects(updatedPapiUsers);
		await this.adalService.batchUpsert('users', updatedPapiUsers);
	}
}
