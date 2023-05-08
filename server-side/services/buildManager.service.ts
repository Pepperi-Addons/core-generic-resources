import { PapiClient } from '@pepperi-addons/papi-sdk';
import config from '../../addon.config.json';

export class BuildManagerService 
{

	protected papiClient: PapiClient;
	protected resourceFunctionsMap: {[key: string]: string[]} = {
		users: ['build_users', 'build_users_from_contacts'],
		account_users: ['build_account_users', 'build_account_buyers']
	}

	constructor(papiClient: PapiClient)
	{
		this.papiClient = papiClient;
	}

	public async build(resource: string): Promise<any>
	{
		const resourceBuildingEndpoints = Object.keys(this.resourceFunctionsMap);
		if(resourceBuildingEndpoints.includes(resource))
		{
			throw new Error(`Invalid resource name. Valid values are: '${resourceBuildingEndpoints.join("',")}'`);
		}
		
		const res = { success: true };
		try
		{
			for (const endpoint of resourceBuildingEndpoints)
			{
				res[endpoint] = await this.singleBuild(this.resourceFunctionsMap[resource][endpoint]);
			}
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
