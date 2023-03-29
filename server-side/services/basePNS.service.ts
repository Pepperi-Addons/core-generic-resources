import { PapiClient } from '@pepperi-addons/papi-sdk';
import { Client } from '@pepperi-addons/debug-server';
import config from '../../addon.config.json';
import { ResourceHelperService } from './resourceHelper.service';
import { Helper, CORE_ADDON_UUID } from 'core-resources-shared';


export abstract class BasePNSService 
{

	protected papiClient: PapiClient;
	protected resourceHelperService: ResourceHelperService;
	protected _requestedFields: string | undefined;
	protected resourceTypeFields: string[] = [];

	constructor(client: Client) 
	{
		this.papiClient = Helper.getPapiClient(client);
		this.resourceHelperService = new ResourceHelperService(client);
	}

	async getRequestedFields(): Promise<string> 
	{
		if(!this._requestedFields) 
		{
			this._requestedFields = await this.buildRequestedFields(this.getResourceName());
		}
		return this._requestedFields;
	}

    abstract getResourceName(): string;

    abstract subscribeToPNS(): void;

    async subscribe(addonRelativeURL: string, name: string, action: any, resource: string) 
    {
    	await this.papiClient.notification.subscriptions.upsert({
    		AddonUUID: config.AddonUUID,
    		AddonRelativeURL: addonRelativeURL,
    		Type: "data",
    		Name: name,
    		FilterPolicy: {
    			Action:[action],
    			Resource:[resource],
    			AddonUUID:[CORE_ADDON_UUID]
    		}
    	})
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

    async getPapiUpdatedObjects(messageFromPNS: any, resource: string, additionalFields?: string): Promise<any[]> 
    {
    	const fields = await this.getRequestedFields();
    	const resourceUUIDs = messageFromPNS.FilterAttributes.ModifiedObjects;
    	console.log(resourceUUIDs);
    	const papiUpdatedObjects = await this.papiClient.post(`/${resource}/search`,{
    		UUIDList: resourceUUIDs,
    		Fields: `${fields},${additionalFields}`
    	});
    	return papiUpdatedObjects;
    }

    replaceUUIDs(papiUpdatedObjects: any[]): any[] 
    {
    	for(const objIndex in papiUpdatedObjects) 
    	{
    		this.resourceHelperService.replaceUUIDWithKey(papiUpdatedObjects[objIndex]);
    	}
    	return papiUpdatedObjects;
    }

    async upsertObjects(fixedObjects: any[]) 
    {
    	return await this.resourceHelperService.batchUpsert(fixedObjects, this.getResourceName());
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


}
