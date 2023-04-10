import { PapiClient } from '@pepperi-addons/papi-sdk';
import config from '../../addon.config.json';

export class AdalHelperService 
{

	protected papiClient: PapiClient;
	protected resourceFunctionsMap: any = {
		users: ['build_users', 'build_users_from_contacts'],
		account_users: ['build_account_users', 'build_account_buyers']
	}

	constructor(papiClient: PapiClient)
	{
		this.papiClient = papiClient;
	}

	async batchUpsert(objects: any[], resource: string) 
	{
		return await this.papiClient.post(`/addons/data/batch/${config.AddonUUID}/${resource}`, {Objects: objects});
	}

	async getByKeys(keys: string[], resource: string)
	{
		return await this.papiClient.addons.data.search.uuid(config.AddonUUID).table(resource).post({KeyList: keys});
	}

	async build(resource: string): Promise<any>
	{
		if(resource != 'users' && resource != 'account_users')
		{
			throw new Error('Invalid resource name. Valid values are: users, account_users');
		}
		const firstFunc = this.resourceFunctionsMap[resource][0];
		const secondFunc = this.resourceFunctionsMap[resource][1];
		const res = { success: true };
		try
		{
			res[firstFunc] = await this.singleBuild(firstFunc);
			res[secondFunc] = await this.singleBuild(secondFunc);
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
