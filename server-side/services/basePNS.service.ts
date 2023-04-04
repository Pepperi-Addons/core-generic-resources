import { PapiClient } from '@pepperi-addons/papi-sdk';
import { Client } from '@pepperi-addons/debug-server';
import config from '../../addon.config.json';
import { AdalHelperService } from './adalHelper.service';
import { Helper, CORE_ADDON_UUID } from 'core-resources-shared';


export abstract class BasePNSService 
{

	protected papiClient: PapiClient;
	protected adalHelperService: AdalHelperService;

	constructor(client: Client)
	{
		this.papiClient = Helper.getPapiClient(client);
		this.adalHelperService = new AdalHelperService(client);
	}

    abstract getResourceName(): string;

    abstract subscribeToPNS(): Promise<void>;

    async subscribe(addonRelativeURL: string, name: string, action: any, resource: string): Promise<void>
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

}
