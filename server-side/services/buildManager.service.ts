import { PapiClient } from '@pepperi-addons/papi-sdk';
import config from '../../addon.config.json';

export class BuildManagerService
{
	/**
	A map between ADAL resource name and the endpoints needed
	in order to build that ADAL table.
	*/
	protected resourceFunctionsMap: {[key: string]: string[]} = {
		users: ['build_users', 'build_users_from_buyers'],
		account_users: ['build_account_users', 'build_account_buyers'],
		role_roles: ['build_role_roles']
	};

	constructor(protected papiClient: PapiClient)
	{}

	public async build(resource: string): Promise<any>
	{
		const resourceBuildingEndpoints = Object.keys(this.resourceFunctionsMap);
		if (!resourceBuildingEndpoints.includes(resource))
		{
			throw new Error(`Invalid resource name. Valid values are: '${resourceBuildingEndpoints.join("',")}'`);
		}

		const res = { success: true };
		try
		{
			const promises = await Promise.allSettled(resourceBuildingEndpoints.map(endpoint => this.singleBuild(this.resourceFunctionsMap[resource][endpoint])));
			for (const i in promises)
			{
				const promise = promises[i];

				if (promise.status === 'rejected')
				{
					res.success = false;
					res['errorMessage'] = res['errorMessage'] ? res['errorMessage'] + '\n' + promise.reason : promise.reason;
				}
				else
				{
					res[this.resourceFunctionsMap[resource][i]] = promise.value;
				}
				
			}
		}
		catch (error)
    	{
    		res.success = false;
    		res['errorMessage'] = error;
    	}
		return res;
	}

	/**
    Executes a single asynchronous build process for a given ADAL function.
    @param funcName - The name of the function to execute.
    */
	protected async singleBuild(funcName: string): Promise<any>
	{
		// The reason we don't poll this async call, is because the 
		// distributor's NUC might be down, and awaiting for it to
		// load might take longer than 10 minutes (which is the timeout
		// for an installation request)
		return await this.papiClient.addons.api.uuid(config.AddonUUID).async().file('adal').func(funcName).post({retry: 20}, {fromPage: 1});
	}
}
