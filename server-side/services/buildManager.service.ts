import { PapiClient } from '@pepperi-addons/papi-sdk';
import config from '../../addon.config.json';

export class BuildManagerService 
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

	public async build(resource: string): Promise<any>
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

	private async singleBuild(funcName: string)
	{
		return await this.papiClient.addons.api.uuid(config.AddonUUID).async().file('adal').func(funcName).post({retry: 20}, {fromPage: 1});
	}

}
