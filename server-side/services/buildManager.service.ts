import { PapiClient } from '@pepperi-addons/papi-sdk';
import config from '../../addon.config.json';
import { AsyncResultObject } from '../constants';
import { UsersPNSService } from './pns/usersPNS.service';
import { BasePNSService } from './pns/basePNS.service';
import { AccountUsersPNSService } from './pns/accountUsersPNS.service';
import { ExternalUserResourcePNSService } from './pns/externalUserResourcePNS.service';
import { SchemaService } from '../schema.service';
import { CoreResourcesTestsService } from '../integration-tests/services/coreResources.service';
import { resourceNameToSchemaMap } from '../resourcesSchemas';

export class BuildManagerService
{
	/**
	A map between ADAL resource name and the endpoints needed
	in order to build that ADAL table.
	*/
	protected resourceFunctionsMap: {[key: string]: string[]} = {
		users: ['build_users'],
		account_users: ['build_account_users', 'build_account_buyers'],
		// role_roles: ['clean_build_role_roles']
	};

	constructor(protected papiClient: PapiClient)
	{}

	public async build(resource: string): Promise<AsyncResultObject>
	{
		const supportedResources = Object.keys(this.resourceFunctionsMap);
		if (!supportedResources.includes(resource))
		{
			throw new Error(`Invalid resource name. Valid values are: '${supportedResources.join("',")}'`);
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
		const asyncCall = await this.papiClient.post(`/addons/api/async/${config.AddonUUID}/adal/${funcName}`, {fromPage: 1}) //addons.api.uuid(config.AddonUUID).async().file('adal').func(funcName).post({retry: 1}, {fromPage: 1});
		if(!asyncCall)
		{
			const errorMessage = `Error executing function '${funcName}' in file 'adal', got a null from async call.`;
			console.error(errorMessage);
			throw new Error(errorMessage);
		}

		const isAsyncRequestResolved = await this.pollExecution(this.papiClient, asyncCall.ExecutionUUID!);
		if(!isAsyncRequestResolved)
		{
			const errorMessage = `Error executing function '${funcName}' in file 'adal'. For more details see audit log: ${asyncCall.ExecutionUUID!}`;
			console.error(errorMessage);
			throw new Error(errorMessage);
		}

		console.log(`Successfully executed function '${funcName}' in file 'adal'.`);
	}

	/** Poll an ActionUUID until it resolves to success our failure. The returned promise resolves to a boolean - true in case the execution was successful, false otherwise.
	* @param ExecutionUUID the executionUUID which should be polled.
	* @param interval the time interval in ms which will be waited between polling retries.
	* @param maxAttempts the maximum number of polling retries before giving up polling. Default value is 540, allowing for 9 minutes of polling, allowing graceful exit for install. 
	*/
	public async pollExecution(papiClient: PapiClient, ExecutionUUID: string, interval = 1000, maxAttempts = 540): Promise<boolean>
	{
		let attempts = 0;

		const executePoll = async (resolve, reject) =>
		{
			console.log(`Polling ${ExecutionUUID}, attempt number ${attempts} out of ${maxAttempts}`);
			const result = await papiClient.auditLogs.uuid(ExecutionUUID).get();
			attempts++;

			if (this.isAsyncExecutionOver(result))
			{
				console.log(`Finished polling ${ExecutionUUID}, it's status is ${result.Status.Name}`);
				return resolve(result.Status.Name === 'Success');
			}
			else if (maxAttempts && attempts === maxAttempts)
			{
				console.log(`Exceeded max attempts polling ${ExecutionUUID}`);

				return resolve(false);
			}
			else
			{
				setTimeout(executePoll, interval, resolve, reject);
			}
		};

		return new Promise<boolean>(executePoll);
	}

	/**
	 * Determines whether or not an audit log has finished executing.
	 * @param auditLog - The audit log to poll
	 * @returns 
	 */
	protected isAsyncExecutionOver(auditLog: any): boolean
	{
		return auditLog != null && (auditLog.Status.Name === 'Failure' || auditLog.Status.Name === 'Success');
	}


	protected async updatePnsSubscriptions(resource: string): Promise<void>
	{
		let pnsService: BasePNSService;
		switch (resource) 
		{
		case 'users':
		{
			pnsService = new UsersPNSService(this.papiClient);
			await pnsService.subscribe();
			const externalUserResources = await ExternalUserResourcePNSService.getAllExternalUserResources(this.papiClient);
			for(const externalUserResource of externalUserResources)
			{
				const externalUserPnsService = new ExternalUserResourcePNSService(this.papiClient, externalUserResource);
				await externalUserPnsService.subscribe();
			}
			break;
		}
		case 'account_users':
		{
			pnsService = new AccountUsersPNSService(this.papiClient);
			await pnsService.subscribe();
			break;
		}
		default:
		{
			throw new Error(`Invalid resource name. Valid values are: '${Object.keys(this.resourceFunctionsMap).join("',")}'`);
		}

		}
	}

	async populateExternalUserResources(resource: string)
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

	async buildTables(tablesNames: string[]): Promise<AsyncResultObject>
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

	async postUpgradeOperations(): Promise<any>
	{
		const res = { success: true };
		res['resultObject'] = {};
		const waiterService = new CoreResourcesTestsService(this.papiClient);
		const tablesToBuild = [];
		try 
		{
			res['resultObject']['createUsersSchema'] = await this.updateSchema('users', tablesToBuild);
			res['resultObject']['createAccountUsersSchema'] = await this.updateSchema('account_users', tablesToBuild);
			// waiting for Nebula to finish handling pns notifications
			await waiterService.waitForAsyncJob(60);
			res['resultObject']['buildTables'] = await this.buildTables(tablesToBuild);
		}
		catch (error)
		{
			res.success = false;
			res['errorMessage'] = error instanceof Error ? error.message : 'Unknown error occurred.';
		}
		return res;
	}

	async updateSchema(schemaName: string, tablesToBuild: string[]): Promise<any>
	{
		const schema =  await this.papiClient.addons.data.schemes.name(schemaName).get();
		// if schema type is data, it means that the schema was already updated and built
		if(schema.Type != 'data')
		{
			schema.Fields = resourceNameToSchemaMap[schemaName].Fields;
			schema.Type = resourceNameToSchemaMap[schemaName].Type;
			tablesToBuild.push(schemaName);
			return await this.papiClient.addons.data.schemes.post(schema);
		}
	}

	async runPostUpgradeOperations(): Promise<any>
	{
		return await this.papiClient.addons.api.uuid(config.AddonUUID).async().file('adal').func('post_upgrade_operations').post();
	}

}
