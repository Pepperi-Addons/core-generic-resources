import { BuildService } from './build.service';
import { PapiGetterService } from '../getters/papiGetter.service';
import { PapiAccountUsersGetterService } from '../getters/papiAccountUsersGetter.service';
import { PapiClient } from '@pepperi-addons/papi-sdk';

export class BuildAccountUsersService extends BuildService 
{
	papiGetterService: PapiGetterService;

	constructor(papiClient: PapiClient) 
	{
		super(papiClient);
		this.papiGetterService = new PapiAccountUsersGetterService(papiClient);
	}
	
	async buildAdalTable(body: any): Promise<any> 
	{
		return await this.buildAdalTableHelper('account_users', body);
	}
}
