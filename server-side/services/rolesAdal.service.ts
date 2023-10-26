import { BatchApiResponse, PapiClient } from '@pepperi-addons/papi-sdk';
import { IApiService } from 'core-resources-shared';
import config from '../../addon.config.json'
import { Helper } from 'core-resources-shared';
import { resourceNameToSchemaMap } from '../resourcesSchemas';
import { AdalService } from './adal.service';
import { Client, Request } from '@pepperi-addons/debug-server/dist';
import { LEGACY_SETTINGS_UUID } from '../constants';


export class RolesAdalService extends AdalService
{
	private ownerid:string;
	
	constructor(papiClient: PapiClient,private client: Client, private request: Request)
	{
		super(papiClient);
		this.ownerid = request.header['x-pepperi-ownerid'];// this is not documented and will not be documented
	}

	override async createResource(resourceName: string, body: any) : Promise<any>
	{
		if(this.ownerid != LEGACY_SETTINGS_UUID) //only legacy settigns can upsert roles 
			throw new Error(`Creation of '${resourceName}' is not supported`);
		return await this.papiClient.addons.data.uuid(this.client.AddonUUID).table("roles").upsert(body);
	}


}
