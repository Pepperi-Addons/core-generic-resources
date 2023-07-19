import { PnsParams } from '../../models/metadata';
import { BasePNSService } from './basePNS.service';
import { BuyersGetterService } from '../getters/buyersGetter.service';
import { AddonData, AddonDataScheme, FindOptions, PapiClient } from '@pepperi-addons/papi-sdk';
import { AdalService } from '../adal.service';
import { resourceNameToSchemaMap } from '../../resourcesSchemas';
import config from '../../../addon.config.json';

export class BuyersPNSService extends BasePNSService
{

	protected buyersGetterService: BuyersGetterService;
	protected adalService: AdalService;
	private udcAddonUUID = "122c0e9d-c240-4865-b446-f37ece866c22";

	constructor(papiClient: PapiClient, protected externalUserResource: string)
	{
		super(papiClient);
		this.buyersGetterService = new BuyersGetterService(papiClient, externalUserResource);
		this.adalService = new AdalService(papiClient);
	}

	async getSubscribeParamsSets(): Promise<PnsParams[]>
	{
		// Users will be notified according to those fields, which are mutual for users and buyers
		let regularFields = Object.keys(resourceNameToSchemaMap['users'].Fields ?? {});
		regularFields = regularFields.filter(field => field != 'UserType');
		
		const externalAddonUUID = await this.getExternalAddonUUID();

		// for users maintenance
		// TODO: expose sub
		return [
			{
				AddonRelativeURL: `/adal/update_users_from_buyers?external_user_resource=${this.externalUserResource}`,
				Name: `${this.externalUserResource}Changed`,
				Action: "update",
				Resource: this.externalUserResource,
				ModifiedFields: regularFields,
				AddonUUID: externalAddonUUID
			},
			{
				AddonRelativeURL: `/adal/buyers_active_state_changed?external_user_resource=${this.externalUserResource}`, 
				Name: `${this.externalUserResource}ActiveFieldChanged`,
				Action: "update", 
				Resource: this.externalUserResource,
				ModifiedFields: ["Active"], 
				AddonUUID: externalAddonUUID
			},
			{
				AddonRelativeURL: `/adal/update_users_from_buyers?external_user_resource=${this.externalUserResource}`,
				 Name: `${this.externalUserResource}Added`, 
				 Action: "insert", 
				 Resource: this.externalUserResource,
				 AddonUUID: externalAddonUUID
			}
		]
	}

	async updateAdalTable(messageFromPNS: any): Promise<void>
	{
		console.log("USERS UPDATE FROM BUYERS PNS TRIGGERED");
		const buyersKeys = messageFromPNS.Message.ModifiedObjects.map(obj => obj.ObjectKey);
		console.log("BUYERS KEYS: " + JSON.stringify(buyersKeys));

		const buyersByKeysRes = await this.buyersGetterService.getObjectsByKeys(buyersKeys);
		const updatedBuyers = buyersByKeysRes.Objects;
		const fixedBuyers = this.buyersGetterService.fixObjects(updatedBuyers);

		await this.adalService.batchUpsert('users', fixedBuyers);
		console.log("USERS UPDATE FROM BUYERS PNS FINISHED");
	}

	async buyersActiveStateChanged(messageFromPNS: any): Promise<void>
	{
		console.log("BUYERS ACTIVE STATE PNS TRIGGERED");
		const buyersKeys = messageFromPNS.Message.ModifiedObjects.map(obj => obj.ObjectKey);
		console.log("BUYERS KEYS: " + JSON.stringify(buyersKeys));
		const updatedBuyersByKeysRes = await this.buyersGetterService.getObjectsByKeys(buyersKeys, 'Active');
		const updatedBuyers = updatedBuyersByKeysRes.Objects;
		const buyersContainedInUsers = await this.adalService.searchResource('users', {KeyList: buyersKeys});
		const newUsers: AddonData[] = [];
		const noLongerUsers: AddonData[] = [];
		for(const buyer of updatedBuyers)
		{
			if(!buyer.Active && buyersContainedInUsers.Objects.find(user => user.Key==buyer.Key)) 
			{
				// buyer is being hided from adal users because he is no longer a user
				buyer.Hidden = true;
				noLongerUsers.push(buyer);
			}
			else if(buyer.Active)
			{
				newUsers.push(buyer);
			}
		}
		const usersToUpsert = newUsers.concat(noLongerUsers);
		if(usersToUpsert.length > 0)
		{
			const fixedUsers = this.buyersGetterService.fixObjects(usersToUpsert);
			await this.adalService.batchUpsert('users', fixedUsers);
			console.log("USERS STATE UPDATE FROM BUYERS PNS FINISHED");
		}
	}

	public static async getAllExternalUserResources(papiClient: PapiClient): Promise<string[]>
	{
		const usersSchema = await papiClient.addons.data.schemes.name('users').get();
		let externalUserResources = usersSchema.Internals?.ExternalUserResourcesRegistration ?? [];
		externalUserResources = externalUserResources.map(obj => obj.Resource);
		return externalUserResources;
	}

	async deleteOldBuyersSubscriptions(papiClient: PapiClient): Promise<void>
	{
		await papiClient.notification.subscriptions.upsert({
			AddonUUID: config.AddonUUID,
			Name: "buyersChanged",
			Hidden: true
		} as any);
		await papiClient.notification.subscriptions.upsert({
			AddonUUID: config.AddonUUID,
			Name: "buyersActiveFieldChanged",
			Hidden: true
		} as any);
		await papiClient.notification.subscriptions.upsert({
			AddonUUID: config.AddonUUID,
			Name: "buyersAdded",
			Hidden: true
		} as any);
	}

	protected async getExternalAddonUUID(): Promise<string>
	{
		let externalScheme: AddonDataScheme;

		const findOptions: FindOptions = {where: `Name='${this.externalUserResource}'`};

		// getting schemes not owned by core-resources addon 
		// requires sending the request without addonUUID header
		delete this.papiClient["options"]["addonUUID"];
		const externalSchemeResult = await this.papiClient.addons.data.schemes.get(findOptions);

		if(externalSchemeResult.length > 0)
		{
			externalScheme = externalSchemeResult[0];
		}
		else
		{
			throw new Error(`External scheme ${this.externalUserResource} not found`);
		}

		// restoring addonUUID header
		this.papiClient["options"]["addonUUID"] = config.AddonUUID;

		return externalScheme.AddonUUID!;

	}
}
