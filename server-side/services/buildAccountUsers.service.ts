import { BuildService } from './build.service';
import { PapiGetterService } from './papiGetter.service';
import { Client } from '@pepperi-addons/debug-server';
import { PapiAccountUsersService } from './papiAccountUsers.service';

export class BuildAccountUsersService extends BuildService 
{
	papiGetterService: PapiGetterService;

	constructor(client: Client) 
	{
		super(client);
		this.papiGetterService = new PapiAccountUsersService(client);
	}
	
	async buildAdalTable(body: any): Promise<any> 
	{
		return await this.buildAdalTableHelper('account_users', body);
	}
}
