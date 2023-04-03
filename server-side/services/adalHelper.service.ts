import { PapiClient } from '@pepperi-addons/papi-sdk';
import { Client } from '@pepperi-addons/debug-server';
import config from '../../addon.config.json';
import { Helper } from 'core-resources-shared';

export class AdalHelperService 
{

	protected papiClient: PapiClient;

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

	async build(): Promise<any>
	{
		const res = { success: true };
		try 
		{
			res['users'] = await this.singleBuild('build_users');
			res['contacts'] = await this.singleBuild('build_users_from_contacts');
			res['account_users'] = await this.singleBuild('build_account_users');
			res['account_buyers'] = await this.singleBuild('build_account_buyers');
		}
		catch (error)
    	{
    		res.success = false;
    		res['errorMessage'] = error;
    	}
		return res;
	}

	async singleBuild(funcName: string)
	{
		return await this.papiClient.addons.api.uuid(config.AddonUUID).async().file('adal').func(funcName).post({retry: 20}, {fromPage: 1});
	}

}
