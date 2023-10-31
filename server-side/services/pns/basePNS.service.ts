import { PapiClient } from '@pepperi-addons/papi-sdk';
import config from '../../../addon.config.json';
import { CORE_ADDON_UUID, Helper } from 'core-resources-shared';
import { PnsParams } from '../../models/metadata';
import SystemHealthService from '../systemHealth.service';
import { Client } from '@pepperi-addons/debug-server/dist';

export abstract class BasePNSService 
{

	protected papiClient: PapiClient;
	protected systemHealthService: SystemHealthService;

	constructor(client: Client, private pnsMessage: string)
	{
		this.papiClient = Helper.getPapiClient(client);
		this.systemHealthService = new SystemHealthService(client);
	}

    abstract getSubscribeParamsSets(): Promise<PnsParams[]>;
	abstract chunkUpdateLogic(uuidsChunk: string[]): Promise<void>;

	// this is the handler function that will be called when a PNS is triggered
	async updateAdalTable(messageFromPNS: any): Promise<void>
	{
    	try
    	{
    		console.log(`${this.pnsMessage} PNS TRIGGERED`);
    		const objectsUUIDs = messageFromPNS.Message.ModifiedObjects.map(obj => obj.ObjectKey);
    		console.log("INCOMING UUIDS: " + JSON.stringify(objectsUUIDs));
    		const uuidsChunks = this.chunkifyKeysArray(objectsUUIDs);
    		for(const uuidsChunk of uuidsChunks)
    		{
    			await this.chunkUpdateLogic(uuidsChunk);
    		}
    		console.log(`${this.pnsMessage} PNS FINISHED`);
    	}
    	catch (error)
    	{
    		const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred.';
    		await this.systemHealthService.sendAlertToCoreResourcesAlertsChannel(`Error on ${this.pnsMessage} PNS`, JSON.stringify(errorMessage));
    	}
	}

	public async subscribe(): Promise<void>
	{
    	const paramsSets = await this.getSubscribeParamsSets();
    	for (const params of paramsSets)
    	{
    		await this.papiClient.notification.subscriptions.upsert({
    			AddonUUID: config.AddonUUID,
    			AddonRelativeURL: params.AddonRelativeURL,
    			Type: "data",
    			Name: params.Name,
    			FilterPolicy: {
    				Action:[params.Action],
					ModifiedFields: params.ModifiedFields,
    				Resource:[params.Resource],
    				AddonUUID:[params.AddonUUID ?? CORE_ADDON_UUID]
    			}
    		})
    	}
	}

	protected chunkifyKeysArray(keys: string[], chunkSize = 500): string[][]
	{
		const chunks: string[][] = [];
		for (let i = 0; i < keys.length; i += chunkSize) 
		{
			const chunk = keys.slice(i, i + chunkSize);
			chunks.push(chunk);
		}
		return chunks;
	}


}

