import { BuildService } from './build.service';
import { PapiGetterService } from '../getters/papiGetter.service';
import { PapiUsersGetterService } from '../getters/papiUsersGetter.service';
import { PapiClient } from '@pepperi-addons/papi-sdk';

export class BuildUsersService extends BuildService 
{
	papiGetterService: PapiGetterService;

	constructor(papiClient: PapiClient) 
	{
		super(papiClient);
		this.papiGetterService = new PapiUsersGetterService(papiClient);
	}

	async buildAdalTable(body: any): Promise<any> 
	{
		return await this.buildAdalTableHelper('users', body);
	}
}
