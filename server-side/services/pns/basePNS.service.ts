import { PapiClient } from '@pepperi-addons/papi-sdk';
import config from '../../../addon.config.json';
import { CORE_ADDON_UUID } from 'core-resources-shared';
import { PnsParams } from '../../models/metadata';

export abstract class BasePNSService 
{

	protected papiClient: PapiClient;

	constructor(papiClient: PapiClient)
	{
		this.papiClient = papiClient;
	}

    abstract getSubscribeParamsSets(): PnsParams[];

	// this is the handler function that will be called when a PNS is triggered
	abstract updateAdalTable(messageFromPNS: any): Promise<void>;

	public async subscribe(): Promise<void>
	{
    	const paramsSets = this.getSubscribeParamsSets();
    	for (const params of paramsSets)
    	{
    		await this.papiClient.notification.subscriptions.upsert({
    			AddonUUID: config.AddonUUID,
    			AddonRelativeURL: params.AddonRelativeURL,
    			Type: "data",
    			Name: params.Name,
    			FilterPolicy: {
    				Action:[params.Action],
    				Resource:[params.Resource],
    				AddonUUID:[CORE_ADDON_UUID]
    			}
    		})
    	}
	}

}
