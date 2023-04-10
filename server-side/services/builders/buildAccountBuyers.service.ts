import { BuildService } from './build.service';
import { PapiGetterService } from '../getters/papiGetter.service';
import { PapiAccountBuyersGetterService } from '../getters/papiAccountBuyersGetter.service';
import { PapiClient } from '@pepperi-addons/papi-sdk';

export class BuildAccountBuyersService extends BuildService 
{
	papiGetterService: PapiGetterService;

	constructor(papiClient: PapiClient) 
	{
		super(papiClient);
		this.papiGetterService = new PapiAccountBuyersGetterService(papiClient);
	}
	
	async buildAdalTable(body: any): Promise<any> 
	{
		return await this.buildAdalTableHelper('account_users', body);
	}
}
