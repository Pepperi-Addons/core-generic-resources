import { PnsParams } from '../../models/metadata';
import { BasePNSService } from './basePNS.service';
import { ExternalUserResourceGetterService } from '../getters/externalUserResourceGetter.service';
import { AddonData, AddonDataScheme, FindOptions, PapiClient } from '@pepperi-addons/papi-sdk';
import { AdalService } from '../adal.service';
import { resourceNameToSchemaMap } from '../../resourcesSchemas';
import config from '../../../addon.config.json';
import { AccountUsersGetterService } from '../getters/accountUsersGetter.service';

export class ExternalUserResourcePNSService extends BasePNSService
{

	protected externalUserResourceGetterService: ExternalUserResourceGetterService;
	protected adalService: AdalService;
	private udcAddonUUID = "122c0e9d-c240-4865-b446-f37ece866c22";

	constructor(papiClient: PapiClient, protected externalUserResource: string)
	{
		super(papiClient);
		this.externalUserResourceGetterService = new ExternalUserResourceGetterService(papiClient, externalUserResource);
		this.adalService = new AdalService(papiClient);
	}

	async getSubscribeParamsSets(): Promise<PnsParams[]>
	{
		// Users will be notified according to those fields, which are mutual for users and externalUserResource
		let regularFields = Object.keys(resourceNameToSchemaMap['users'].Fields ?? {});
		regularFields = regularFields.filter(field => field != 'UserType');
		
		const externalAddonUUID = await this.getExternalAddonUUID();

		// for users maintenance
		return [
			{
				AddonRelativeURL: `/adal/update_users_from_external_user_resource?resource=${this.externalUserResource}`,
				Name: `${this.externalUserResource}Changed`,
				Action: "update",
				Resource: this.externalUserResource,
				ModifiedFields: regularFields,
				AddonUUID: externalAddonUUID
			},
			{
				AddonRelativeURL: `/adal/external_user_resource_active_state_changed?resource=${this.externalUserResource}`, 
				Name: `${this.externalUserResource}ActiveFieldChanged`,
				Action: "update", 
				Resource: this.externalUserResource,
				ModifiedFields: ["Active"], 
				AddonUUID: externalAddonUUID
			},
			{
				AddonRelativeURL: `/adal/update_users_from_external_user_resource?resource=${this.externalUserResource}`,
				 Name: `${this.externalUserResource}Added`, 
				 Action: "insert", 
				 Resource: this.externalUserResource,
				 AddonUUID: externalAddonUUID
			},
			{
				AddonRelativeURL: `/adal/update_account_buyers?resource=${this.externalUserResource}`,
				 Name: `updateAccountBuyersOnNewBuyers`, 
				 Action: "insert", 
				 Resource: this.externalUserResource,
				 AddonUUID: externalAddonUUID
			}
		]
	}

	async updateAdalTable(messageFromPNS: any): Promise<void>
	{
		console.log("USERS UPDATE FROM BUYERS PNS TRIGGERED");
		const externalUserResourceKeys = messageFromPNS.Message.ModifiedObjects.map(obj => obj.ObjectKey);
		console.log("BUYERS KEYS: " + JSON.stringify(externalUserResourceKeys));

		const externalUserResourceByKeysRes = await this.externalUserResourceGetterService.getObjectsByKeys(externalUserResourceKeys);
		const updatedExternalUserResource = externalUserResourceByKeysRes.Objects;
		const fixedExternalUserResource = this.externalUserResourceGetterService.fixObjects(updatedExternalUserResource);

		await this.adalService.batchUpsert('users', fixedExternalUserResource);
		console.log("USERS UPDATE FROM BUYERS PNS FINISHED");
	}

	async updateAccountBuyersOnNewBuyers(messageFromPNS: any): Promise<void>
	{
		console.log("NEW BUYERS ADDED, UPDATING ACCOUNT BUYERS");
		const externalUserResourceKeys = messageFromPNS.Message.ModifiedObjects.map(obj => obj.ObjectKey);
		console.log("BUYERS KEYS: " + JSON.stringify(externalUserResourceKeys));
		const externalUserResourceByKeysRes = await this.externalUserResourceGetterService.getObjectsByKeys(externalUserResourceKeys);
		const updatedExternalUserResourceObjects = externalUserResourceByKeysRes.Objects;

		// Active buyers has account_buyers relations 
		// which should be upserted to account_users adal table
		await this.upsertAccountBuyersRelations(updatedExternalUserResourceObjects);
	}

	async externalUserResourceActiveStateChanged(messageFromPNS: any): Promise<void>
	{
		console.log("BUYERS ACTIVE STATE PNS TRIGGERED");
		const externalUserResourceKeys = messageFromPNS.Message.ModifiedObjects.map(obj => obj.ObjectKey);
		console.log("BUYERS KEYS: " + JSON.stringify(externalUserResourceKeys));
		const updatedExternalUserResourceByKeysRes = await this.externalUserResourceGetterService.getObjectsByKeys(externalUserResourceKeys, 'Active');
		const updatedExternalUserResourceObjects = updatedExternalUserResourceByKeysRes.Objects;

		// Active buyers has account_buyers relations 
		// which should be upserted to account_users adal table
		await this.upsertAccountBuyersRelations(updatedExternalUserResourceObjects);

		const externalUserResourceContainedInUsers = await this.adalService.searchResource('users', {KeyList: externalUserResourceKeys});
		const newUsers: AddonData[] = [];
		const noLongerUsers: AddonData[] = [];
		for(const obj of updatedExternalUserResourceObjects)
		{
			if(!obj.Active && externalUserResourceContainedInUsers.Objects.find(user => user.Key==obj.Key)) 
			{
				// obj is being hided from adal users because he is no longer a user
				obj.Hidden = true;
				noLongerUsers.push(obj);
			}
			else if(obj.Active)
			{
				newUsers.push(obj);
			}
		}
		const usersToUpsert = newUsers.concat(noLongerUsers);
		if(usersToUpsert.length > 0)
		{
			const fixedUsers = this.externalUserResourceGetterService.fixObjects(usersToUpsert);
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

	// upserting new account_buyers for active buyers
	async upsertAccountBuyersRelations(objects: any[]): Promise<void>
	{
		console.log("UPSERTING ACCOUNT BUYERS RELATIONS");
		const accountUsersGetter = new AccountUsersGetterService(this.papiClient);
		
		// filtering out non active buyers
		const KeysList = objects.filter(obj => obj.Active).map(obj =>obj.Key);
		const uuidsString = KeysList.map(uuid => `'${uuid}'`).join(',');
		const accountBuyersToUpsert = await this.papiClient.post('/account_buyers/search', {where: `User.UUID in (${uuidsString})`});

		const fixedAccountBuyers = accountUsersGetter.fixObjects(accountBuyersToUpsert);

		await this.adalService.batchUpsert('account_users', fixedAccountBuyers);
		console.log("ACCOUNT BUYERS UPSERTED");
	}
}
