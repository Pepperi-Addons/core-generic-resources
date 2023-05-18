import { PapiClient } from '@pepperi-addons/papi-sdk';
import config from '../../addon.config.json';

export class BuildManagerService
{
	/**
	A map between ADAL resource name and the endpoints needed
	in order to build that ADAL table.
	*/
	protected resourceFunctionsMap: {[key: string]: string[]} = {
		users: ['build_users', 'build_users_from_contacts'],
		account_users: ['build_account_users', 'build_account_buyers'],
		role_roles: ['build_role_roles']
	};

	constructor(protected papiClient: PapiClient)
	{}

	public async build(resource: string): Promise<any>
	{
		const supportedResources = Object.keys(this.resourceFunctionsMap);
		if (!supportedResources.includes(resource))
		{
			throw new Error(`Invalid resource name. Valid values are: '${supportedResources.join("',")}'`);
		}

		const res = { success: true };
		try
		{
			
			const promises = await Promise.allSettled(this.resourceFunctionsMap[resource].map(endpoint => this.singleBuild(endpoint)));

			for (let i = 0; i < promises.length; i++)
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
    Executes a single asynchronous build process for a given ADAL function and waits for its completion.
    @param funcName - The name of the function to execute.
    @throws An error if the async execution does not resolve after 30 retries, or if there is an error executing the function.
    @returns A Promise that resolves to a boolean that represents if the function execution was successful.
    */
	protected async singleBuild(funcName: string): Promise<void>
	{
		const asyncCall = await this.papiClient.addons.api.uuid(config.AddonUUID).async().file('adal').func(funcName).post({retry: 1}, {fromPage: 1});
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
	}

	/** Poll an ActionUUID until it resolves to success our failure. The returned promise resolves to a boolean - true in case the execution was successful, false otherwise.
	* @param ExecutionUUID the executionUUID which should be polled.
	* @param interval the time interval in ms which will be waited between polling retries.
	* @param maxAttempts the maximum number of polling retries before giving up polling. Default value is 600, allowing for 9 minutes of polling, allowing graceful exit for install. 
	*/
	protected async pollExecution(papiClient: PapiClient, ExecutionUUID: string, interval = 1000, maxAttempts = 540): Promise<boolean>
	{
		let attempts = 0;

		const executePoll = async (resolve, reject) =>
		{
			const result = await papiClient.auditLogs.uuid(ExecutionUUID).get();
			attempts++;

			if (this.isAsyncExecutionOver(result))
			{
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
}
