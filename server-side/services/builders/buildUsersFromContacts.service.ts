import { BuildService } from './build.service';
import { PapiContactsGetterService } from '../getters/papiContactsGetter.service';
import { PapiGetterService } from '../getters/papiGetter.service';
import { PapiClient } from '@pepperi-addons/papi-sdk';

export class BuildUsersFromContactsService extends BuildService 
{
	papiGetterService: PapiGetterService;

	constructor(papiClient: PapiClient) 
	{
		super(papiClient);
		this.papiGetterService = new PapiContactsGetterService(papiClient);
	}

	async buildAdalTable(body: any): Promise<any> 
	{
		return await this.buildAdalTableHelper('users', body, 'IsBuyer=true');
	}
}
