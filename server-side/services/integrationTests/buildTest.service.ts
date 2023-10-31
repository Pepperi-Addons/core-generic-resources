import { Helper } from 'core-resources-shared';
import { IBuildServiceParams } from '../builders/iBuildServiceParams';
import { BaseBuildService } from '../builders/build.service';
import { TestBody } from './entities';
import { PapiGetterTestWrapperService } from './papiGetterTestWrapper.service';
import { Client } from '@pepperi-addons/debug-server/dist';


export class BuildTestService extends BaseBuildService
{
	constructor(client: Client, buildServiceParams: IBuildServiceParams, protected testBody: TestBody)
	{
		super(client, buildServiceParams);
		const papiClient = Helper.getPapiClient(client);
		// Override the papiGetterService that's initiated in super with a test wrapper
		this.baseGetterService = new PapiGetterTestWrapperService(papiClient, this.baseGetterService, testBody);
	}
}
