import { PapiClient } from '@pepperi-addons/papi-sdk';
import config from '../../../addon.config.json';
import { CORE_ADDON_UUID, Helper } from 'core-resources-shared';
import { PnsParams } from '../../models/metadata';
import SystemHealthService from '../systemHealth.service';
import jwtDecode from 'jwt-decode';
import { Client } from '@pepperi-addons/debug-server/dist';

export abstract class BasePNSService 
{

	protected papiClient: PapiClient;

	constructor(private client: Client, private pnsMessage: string)
	{
		this.papiClient = Helper.getPapiClient(client);
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
    		await this.sendAlertToCoreResourcesAlertsChannel(`Error on ${this.pnsMessage} PNS`, JSON.stringify(errorMessage));
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

	protected async sendAlertToCoreResourcesAlertsChannel(description: string, errorMessage: string): Promise<void> 
	{
		const jwt = <any>jwtDecode(this.client.OAuthAccessToken);
		const isAsync: boolean = this.client.isAsync!();
		const enviroment = jwt["pepperi.datacenter"];
		const distributorUUID = jwt["pepperi.distributoruuid"];
		const distributor: any = await this.papiClient.get("/distributor");

		const name = `<b>${enviroment.toUpperCase()}</b> - Core Resources PNS Error `;
		const message = `<b>Distributor:</b> ${distributor["InternalID"]} - ${distributor["Name"]}<br><b>DistUUID:</b> ${distributorUUID}<br><b>ActionUUID:</b> ${this.papiClient["options"]["actionUUID"]}<br><b>IsAsync operation: </b>${isAsync}
            <br><b style="color:red">ERROR!</b>
			<br>${errorMessage}<br>
			<br>`;

		const kms = await this.papiClient.get("/kms/parameters/core_resources_alertsUrl");

		await new SystemHealthService(this.papiClient).sendUserWebhookNotification(name, description, 'ERROR', message, "Always", kms.Value);
	}

}

