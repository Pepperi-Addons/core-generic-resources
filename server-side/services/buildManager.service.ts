import { AddonAPIAsyncResult, AddonDataScheme, PapiClient } from '@pepperi-addons/papi-sdk';
import config from '../../addon.config.json';
import { AsyncResultObject } from '../constants';
import { UsersPNSService } from './pns/usersPNS.service';
import { BasePNSService } from './pns/basePNS.service';
import { AccountUsersPNSService } from './pns/accountUsersPNS.service';
import { ExternalUserResourcePNSService } from './pns/externalUserResourcePNS.service';
import { resourceNameToSchemaMap } from '../resourcesSchemas';
import { AsyncHelperService } from './asyncHelper.service';
import { Client } from '@pepperi-addons/debug-server/dist';
import { Helper } from 'core-resources-shared';

export class BuildManagerService
{
	/**
	A map between ADAL resource name and the endpoints needed
	in order to build that ADAL table.
	*/
	protected resourceFunctionsMap: {[key: string]: string[]} = {
		roles: ['build_roles'],
		role_roles: ['clean_build_role_roles'],
		users: ['build_users'],
		account_users: ['build_account_users', 'build_account_buyers'],
	};
	protected papiClient: PapiClient;

	constructor(protected client: Client, copyActionUUID = true)
	{
		this.papiClient = Helper.getPapiClient(client, copyActionUUID);
	}

	public async build(resource: string): Promise<AsyncResultObject>
	{
		const supportedResources = Object.keys(this.resourceFunctionsMap);
		if (!supportedResources.includes(resource))
		{
			throw new Error(`Invalid resource name ${resource}. Valid values are: '${supportedResources.join("',")}'`);
		}

		const res: AsyncResultObject = { success: true };
		try
		{
			await this.populateExternalUserResources(resource);
			await this.updatePnsSubscriptions(resource);

			console.log(`Trying to build table '${resource}' using functions '${this.resourceFunctionsMap[resource].join("', '")}' in file 'adal'...`);
			const promises = await Promise.allSettled(this.resourceFunctionsMap[resource].map(endpoint => this.singleBuild(endpoint)));
			for (let i = 0; i < promises.length; i++)
			{
				const promise = promises[i];

				if (promise.status === 'rejected')
				{
					res.success = false;
					res.errorMessage = res.errorMessage ? res.errorMessage + '\n' + promise.reason : promise.reason;
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
    		res.errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    	}
		return res;
	}

	/**
	Executes a single asynchronous build process for a given ADAL function and waits for its completion.
    @param funcName - The name of the function to execute.
    @throws An error if the async execution does not resolve after 30 retries, or if there is an error executing the function.
    @returns A Promise that resolves to a boolean that represents if the function execution was successful.
    */
	protected async singleBuild(funcName: string): Promise<void>
	{
		console.log(`Trying to build table using function '${funcName}' in file 'adal'...`);
		const retryParam = funcName.includes('?') ? '&retry=20' : '?retry=20'; // funcName might contain a query param
		const asyncCall = await this.papiClient.post(`/addons/api/async/${config.AddonUUID}/adal/${funcName}${retryParam}`, {});
		if(!asyncCall)
		{
			const errorMessage = `Error executing function '${funcName}' in file 'adal', got a null from async call.`;
			console.error(errorMessage);
			throw new Error(errorMessage);
		}

		const asyncHelperService = new AsyncHelperService(this.papiClient);
		const isAsyncRequestResolved = await asyncHelperService.pollExecution(this.papiClient, asyncCall.ExecutionUUID!);
		if(!isAsyncRequestResolved)
		{
			const errorMessage = `Error executing function '${funcName}' in file 'adal'. For more details see audit log: ${asyncCall.ExecutionUUID!}`;
			console.error(errorMessage);
			throw new Error(errorMessage);
		}

		console.log(`Successfully executed function '${funcName}' in file 'adal'.`);
	}


	protected async updatePnsSubscriptions(resource: string): Promise<void>
	{
		let pnsService: BasePNSService;
		switch (resource) 
		{
		case 'users':
		{
			pnsService = new UsersPNSService(this.client);
			await pnsService.subscribe();
			const externalUserResources = await ExternalUserResourcePNSService.getAllExternalUserResources(this.papiClient);
			for(const externalUserResource of externalUserResources)
			{
				const externalUserPnsService = new ExternalUserResourcePNSService(this.client, externalUserResource);
				await externalUserPnsService.subscribe();
			}
			break;
		}
		case 'account_users':
		{
			pnsService = new AccountUsersPNSService(this.client);
			await pnsService.subscribe();
			break;
		}
		}
	}

	private async populateExternalUserResources(resource: string)
	{
		// relevant only for users resource, need to be refactored
		if(resource == 'users')
		{
			const externalUserResources = await ExternalUserResourcePNSService.getAllExternalUserResources(this.papiClient);
			for(const externalUserResource of externalUserResources)
			{
				this.resourceFunctionsMap.users.push(`build_users_from_external_user_resource?resource=${externalUserResource}`);
			}
		}
	}

	/**
	 * Build tables in ADAL. The building process is done in parallel for all tables.
	 * @param {string[]} tablesNames - The names of the tables to build. 
	 * @returns 
	 */
	public async buildTables(tablesNames: string[]): Promise<AsyncResultObject>
	{
		const resultObject: AsyncResultObject = {success: true};

		const promises = await Promise.allSettled(tablesNames.map(tableName => this.build(tableName)));
	
		for (const promise of promises)
		{
			if(promise.status === 'rejected')
			{
				resultObject.success = false;
				resultObject.errorMessage = promise.reason instanceof Error ? promise.reason.message : 'Unknown error';
			}
			else
			{
				resultObject.success = resultObject.success && promise.value.success;
				resultObject.errorMessage = resultObject.errorMessage ? `${resultObject.errorMessage}/n ${promise.value.errorMessage}` : promise.value.errorMessage;
			}
		}

		return resultObject;
	}

	public async postUpgradeOperations(): Promise<AsyncResultObject>
	{
		console.log('STARTING POST UPGRADE OPERATIONS');
		const res = { success: true };
		res['resultObject'] = {};
		const asyncHelperService = new AsyncHelperService(this.papiClient);
		const tablesToBuild: string[] = ['users', 'account_users'];
		try
		{
			for (const tableName of tablesToBuild)
			{
				res['resultObject'][`create_${tableName}_schema`] = await this.updateSchema(tableName);
			}
		}
		catch(error)
		{
			res.success = false;
			res['errorMessage'] = error instanceof Error ? error.message : 'Unknown error occurred.';
		}

		await asyncHelperService.waitForAsyncJob(60);

		console.log('TABLES TO BUILD: ', JSON.stringify(tablesToBuild));

		const buildTables = await this.buildTables(tablesToBuild);

		if(!buildTables.success)
		{
			res.success = false;
			res['errorMessage'] = buildTables.errorMessage;
		}
		else
		{
			res['resultObject']['buildTables'] = buildTables;
		}

		console.log('FINISHED POST UPGRADE OPERATIONS');

		return res;
	}

	private async updateSchema(schemaName: string, ): Promise<AddonDataScheme | undefined>
	{
		const schema =  await this.papiClient.addons.data.schemes.name(schemaName).get();
		if(schema.Type !== 'data')
		{
			console.log(`UPDATING '${schemaName}' SCHEMA`);
			schema.Fields = resourceNameToSchemaMap[schemaName].Fields;
			schema.Type = resourceNameToSchemaMap[schemaName].Type;
	
			return await this.papiClient.addons.data.schemes.post(schema);
		}
	}

	public async runPostUpgradeOperations(): Promise<AddonAPIAsyncResult>
	{
		return await this.papiClient.addons.api.uuid(config.AddonUUID).async().file('adal').func('post_upgrade_operations').post();
	}

}
