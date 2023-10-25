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
	private upsertingAddon:string;
	
	constructor(papiClient: PapiClient,private client: Client, private request: Request)
	{
		super(papiClient);

		this.upsertingAddon = request.header['x-pepperi-upsertaddon'];
	}

	override async createResource(resourceName: string, body: any) : Promise<any>
	{
		if(this.upsertingAddon != LEGACY_SETTINGS_UUID)
			throw new Error(`Creation of '${resourceName}' is not supported`);
		return await this.papiClient.addons.data.uuid(this.client.AddonUUID).table("roles").upsert(body);
	}


}
