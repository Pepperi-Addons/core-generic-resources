import { PapiClient } from '@pepperi-addons/papi-sdk';

import { IBuildServiceParams } from '../builders/iBuildServiceParams';
import { BuildService } from '../builders/build.service';
import { TestBody } from './entities';
import { PapiGetterTestWrapperService } from './papiGetterTestWrapper.service';


export class BuildTestService extends BuildService
{
	constructor(papiClient: PapiClient, buildServiceParams: IBuildServiceParams, protected testBody: TestBody)
	{
		super(papiClient, buildServiceParams);
		// Override the papiGetterService that's initiated in super with a test wrapper
		this.papiGetterService = new PapiGetterTestWrapperService(papiClient, this.papiGetterService, testBody);
	}
}
