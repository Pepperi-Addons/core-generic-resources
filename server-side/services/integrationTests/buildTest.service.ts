import { PapiClient } from '@pepperi-addons/papi-sdk';

import { IBuildServiceParams } from '../builders/iBuildServiceParams';
import { BaseBuildService } from '../builders/build.service';
import { TestBody } from './entities';
import { PapiGetterTestWrapperService } from './papiGetterTestWrapper.service';


export class BuildTestService extends BaseBuildService
{
	constructor(papiClient: PapiClient, buildServiceParams: IBuildServiceParams, protected testBody: TestBody)
	{
		super(papiClient, buildServiceParams);
		// Override the papiGetterService that's initiated in super with a test wrapper
		this.baseGetterService = new PapiGetterTestWrapperService(papiClient, this.baseGetterService, testBody);
	}
}
