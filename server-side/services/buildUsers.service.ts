import { BuildService } from './build.service';
import { PapiGetterService } from './papiGetter.service';
import { Client } from '@pepperi-addons/debug-server';
import { PapiUsersService } from './papiUsers.service';

export class BuildUsersService extends BuildService 
{
	papiGetterService: PapiGetterService;

	constructor(client: Client) 
	{
		super(client);
		this.papiGetterService = new PapiUsersService(client);
	}

	async buildAdalTable(body: any): Promise<any> 
	{
		return await this.buildAdalTableHelper('users', body);
	}
}
