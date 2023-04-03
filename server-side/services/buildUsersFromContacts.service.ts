import { BuildService } from './build.service';
import { PapiContactsService } from './papiContacts.service';
import { PapiGetterService } from './papiGetter.service';
import { Client } from '@pepperi-addons/debug-server';

export class BuildUsersFromContactsService extends BuildService 
{
	papiGetterService: PapiGetterService;

	constructor(client: Client) 
	{
		super(client);
		this.papiGetterService = new PapiContactsService(client);
	}

	async buildAdalTable(body: any): Promise<any> 
	{
		return await this.buildAdalTableHelper('users', body, 'IsBuyer=true');
	}
}
