import { PapiClient } from '@pepperi-addons/papi-sdk';
import { Client } from '@pepperi-addons/debug-server';
import config from '../../addon.config.json';
import { Helper } from 'core-resources-shared';

export class ResourceHelperService 
{

	papiClient: PapiClient;
	resourceTypeFields: string[] = [];

	constructor(client: Client) 
	{
		this.papiClient = Helper.getPapiClient(client);
	}

	async batchUpsert(objects: any[], resource: string) 
	{
		return await this.papiClient.post(`/addons/data/batch/${config.AddonUUID}/${resource}`, {Objects: objects});
	}

	async getByKeys(keys: string[], resource: string) 
	{
		return await this.papiClient.addons.data.search.uuid(config.AddonUUID).table(resource).post({KeyList: keys});
	}

	async buildRequestedFields(schemeName: string): Promise<string> 
	{
		const scheme = await this.papiClient.addons.data.schemes.name(schemeName).get();
		// save fields of type "Resource" for later use
		for(const fieldName in scheme.Fields) 
		{
			if(scheme.Fields[fieldName].Type == "Resource") this.resourceTypeFields.push(fieldName);
		}
		const fields = Object.keys(scheme.Fields as any);
		fields.filter(f => f != 'Key');
		fields.push('UUID');
		return fields.join(',');
	}

	fixResourceTypeFields(papiUpdatedObjects: any[]): any[] 
	{
		for(const objIndex in papiUpdatedObjects) 
		{
			for(const field of this.resourceTypeFields) 
			{
				// based on resource type field structure
				papiUpdatedObjects[objIndex][field] = papiUpdatedObjects[objIndex][field].Data.UUID;
			}
		}
		return papiUpdatedObjects;
	}

	replaceUUIDWithKey(user) 
	{
		user["Key"] = user["UUID"];
		delete user["UUID"];
		return user;
	}

	replaceUUIDs(papiUpdatedObjects: any[]): any[] 
	{
		for(const objIndex in papiUpdatedObjects) 
		{
			papiUpdatedObjects[objIndex] = this.replaceUUIDWithKey(papiUpdatedObjects[objIndex]);
		}
		return papiUpdatedObjects;
	}

}
