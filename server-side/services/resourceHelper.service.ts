import { PapiClient } from '@pepperi-addons/papi-sdk';
import { Client } from '@pepperi-addons/debug-server';
import config from '../../addon.config.json';
import { Helper } from 'core-resources-shared';

export class ResourceHelperService 
{

	papiClient: PapiClient;

	constructor(client: Client) 
	{
		this.papiClient = Helper.getPapiClient(client);
	}

	async batchUpsert(objects: any[], resource: string) 
	{
		return await this.papiClient.post(`/addons/data/batch/${config.AddonUUID}/${resource}`, {Objects: objects});
	}

	async getByKeys(keys: string[], resource: string) 
	{
		return await this.papiClient.addons.data.search.uuid(config.AddonUUID).table(resource).post({KeyList: keys});
	}

	replaceUUIDWithKey(user): void 
	{
		user["Key"] = user["UUID"];
		delete user["UUID"];
	}

}
