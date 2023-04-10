import { PapiClient } from '@pepperi-addons/papi-sdk';
import config from '../../../addon.config.json';
import { AdalHelperService } from '../adalHelper.service';
import { CORE_ADDON_UUID } from 'core-resources-shared';

export abstract class BasePNSService 
{

	protected papiClient: PapiClient;
	protected adalHelperService: AdalHelperService;

	constructor(papiClient: PapiClient)
	{
		this.papiClient = papiClient;
		this.adalHelperService = new AdalHelperService(papiClient);
	}

    abstract getResourceName(): string;

    abstract subscribeToPNS(): Promise<void>;

    protected async subscribe(addonRelativeURL: string, name: string, action: any, resource: string): Promise<void>
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
