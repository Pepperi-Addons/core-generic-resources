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
			this._requestedFields = await this.resourceHelperService.buildRequestedFields(this.getResourceName());
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

    async upsertObjects(fixedObjects: any[])
    {
    	return await this.resourceHelperService.batchUpsert(fixedObjects, this.getResourceName());
    }

}
