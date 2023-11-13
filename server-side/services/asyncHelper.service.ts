import { PapiClient } from '@pepperi-addons/papi-sdk';

export class AsyncHelperService 
{

	constructor(public papiClient: PapiClient)
	{}

	/**
	 * Sleeps for the specified number of seconds
	 * @param seconds - number of seconds to wait for the async job to finish. Default is 30 seconds.
	 */
	public async waitForAsyncJob(seconds = 30): Promise<void> 
	{
		console.log(`Waiting for ${seconds} seconds for operation to catch up...`);
		Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, seconds * 1000);
		console.log(`Done waiting for operation`);
	}

	/** Poll an ActionUUID until it resolves to success our failure. The returned promise resolves to a boolean - true in case the execution was successful, false otherwise.
	* @param ExecutionUUID the executionUUID which should be polled.
	* @param interval the time interval in ms which will be waited between polling retries.
	* @param maxAttempts the maximum number of polling retries before giving up polling. Default value is 510, allowing for 8.5 minutes of polling, allowing graceful exit for install. 
	*/
	public async pollExecution(papiClient: PapiClient, ExecutionUUID: string, interval = 1000, maxAttempts = 510): Promise<boolean>
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

}
