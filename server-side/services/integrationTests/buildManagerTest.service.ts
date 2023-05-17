import { PapiClient } from '@pepperi-addons/papi-sdk';

import config from '../../../addon.config.json';
import { BuildManagerService } from '../buildManager.service';
import { TestBody } from './entities';

export class BuildManagerTestService extends BuildManagerService
{
	constructor(papiClient: PapiClient, protected testBody: TestBody)
	{
		super(papiClient);
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
