import config from '../../../addon.config.json';
import { BuildManagerService } from '../buildManager.service';
import { TestBody } from './entities';
import { Client } from '@pepperi-addons/debug-server/dist';

export class BuildManagerTestService extends BuildManagerService
{
	constructor(client: Client, protected testBody: TestBody)
	{
		super(client);
	}

	/**
    Executes a single asynchronous build process for a given ADAL function.
    @param funcName - The name of the function to execute.
    */
	protected override async singleBuild(funcName: string): Promise<any>
	{
		const singleBuildTestBody: TestBody = {
			...this.testBody,
			fromPage: 1
		};
		return await this.papiClient.addons.api.uuid(config.AddonUUID).async().file('adal').func(funcName).post({retry: 20}, singleBuildTestBody);
	}
}
