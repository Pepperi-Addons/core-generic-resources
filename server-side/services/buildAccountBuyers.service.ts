import { BuildService } from './build.service';
import { PapiGetterService } from './papiGetter.service';
import { Client } from '@pepperi-addons/debug-server';
import { PapiAccountBuyersService } from './papiAccountBuyers.service';

export class BuildAccountBuyersService extends BuildService 
{
	papiGetterService: PapiGetterService;

	constructor(client: Client) 
	{
		super(client);
		this.papiGetterService = new PapiAccountBuyersService(client);
	}
	
	async buildAdalTable(body: any): Promise<any> 
	{
		return await this.buildAdalTableHelper('account_users', body);
	}
}
