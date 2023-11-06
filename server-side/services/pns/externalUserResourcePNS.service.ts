import { PnsParams } from '../../models/metadata';
import { BasePNSService } from './basePNS.service';
import { ExternalUserResourceGetterService } from '../getters/externalUserResourceGetter.service';
import { AddonData, AddonDataScheme, FindOptions, PapiClient } from '@pepperi-addons/papi-sdk';
import { AdalService } from '../adal.service';
import { resourceNameToSchemaMap } from '../../resourcesSchemas';
import config from '../../../addon.config.json';
import { Helper } from 'core-resources-shared';
import { Client } from '@pepperi-addons/debug-server/dist';

export class ExternalUserResourcePNSService extends BasePNSService
{

	protected externalUserResourceGetterService: ExternalUserResourceGetterService;
	protected adalService: AdalService;

	constructor(client: Client, protected externalUserResource: string)
	{
		super(client, "USERS UPDATE FROM BUYERS");
		const papiClient = Helper.getPapiClient(client);
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

	async chunkUpdateLogic(uuidsChunk: string[]): Promise<void> 
	{
		const externalUserResourceByKeysRes = await this.externalUserResourceGetterService.getObjectsByKeys(uuidsChunk);
		const updatedExternalUserResource = externalUserResourceByKeysRes.Objects;
		const fixedExternalUserResource = this.externalUserResourceGetterService.fixObjects(updatedExternalUserResource);
		await this.adalService.batchUpsert('users', fixedExternalUserResource);
	}

	async updateAccountBuyersOnNewBuyers(messageFromPNS: any): Promise<void>
	{
		try
		{
			console.log("NEW BUYERS ADDED, UPDATING ACCOUNT BUYERS");
			const externalUserResourceKeys = messageFromPNS.Message.ModifiedObjects.map(obj => obj.ObjectKey);
			console.log("BUYERS KEYS: " + JSON.stringify(externalUserResourceKeys));
			const externalUserResourceByKeysRes = await this.externalUserResourceGetterService.getObjectsByKeys(externalUserResourceKeys, ['Active']);
			const updatedExternalUserResourceObjects = externalUserResourceByKeysRes.Objects;

			// Active buyers has account_buyers relations 
			// which should be upserted to account_users adal table
			await this.upsertAccountBuyersRelations(updatedExternalUserResourceObjects);
		}
		catch (error)
		{
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred.';
			await this.systemHealthService.sendAlertToCoreResourcesAlertsChannel("Error on updating account_buyers on new buyers PNS", JSON.stringify(errorMessage));
		}
	}

	async externalUserResourceActiveStateChanged(messageFromPNS: any): Promise<void>
	{
		try
		{
			console.log("BUYERS ACTIVE STATE PNS TRIGGERED");
			const externalUserResourceKeys = messageFromPNS.Message.ModifiedObjects.map(obj => obj.ObjectKey);
			console.log("BUYERS KEYS: " + JSON.stringify(externalUserResourceKeys));
			const updatedExternalUserResourceByKeysRes = await this.externalUserResourceGetterService.getObjectsByKeys(externalUserResourceKeys, ['Active']);
			const updatedExternalUserResourceObjects = updatedExternalUserResourceByKeysRes.Objects;

			// Active buyers has account_buyers relations 
			// which should be upserted to account_users adal table
			await this.upsertAccountBuyersRelations(updatedExternalUserResourceObjects);

			const externalUserResourceContainedInUsersDict = await this.buildContainedUsersDict(externalUserResourceKeys);
			const newUsers: AddonData[] = [];
			const noLongerUsers: AddonData[] = [];
			for(const obj of updatedExternalUserResourceObjects)
			{
				if(!obj.Active && externalUserResourceContainedInUsersDict[obj.Key as string]) 
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
				await this.adalService.chunkifiedBatchUpsert('users', fixedUsers);
				console.log("USERS STATE UPDATE FROM BUYERS PNS FINISHED");
			}
		}
		catch (error)
		{
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred.';
			await this.systemHealthService.sendAlertToCoreResourcesAlertsChannel("Error on active state changed PNS", JSON.stringify(errorMessage));
		}
	}

	public static async getAllExternalUserResources(papiClient: PapiClient): Promise<string[]>
	{
		const usersSchema = await papiClient.addons.data.schemes.name('users').get();
		let externalUserResources = usersSchema.Internals?.ExternalUserResourcesRegistration ?? [];
		externalUserResources = externalUserResources.map(obj => obj.Resource);
		const validExternalUserResources: string[] = [];
		for(const resource of externalUserResources)
		{
			if(await this.schemeExists(papiClient, resource))
			{
				validExternalUserResources.push(resource);
			}
		}
		return validExternalUserResources;
	}

	public static async schemeExists(papiClient: PapiClient, schemeName: string): Promise<boolean> 
	{
		// getting schemes not owned by this addon 
		// requires sending the request without addonUUID header
		delete papiClient["options"]["addonUUID"];

		const schemesFound = await papiClient.addons.data.schemes.get({where: `Name=${schemeName}`});

		// restoring addonUUID header
		papiClient["options"]["addonUUID"] = config.AddonUUID;

		return schemesFound.length > 0;
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
		
		// filtering out non active buyers
		const keysList = objects.filter(obj => obj.Active).map(obj =>obj.Key);
		if(keysList.length > 0)
		{
			console.log("ACTIVE BUEYRS KEYS: " + JSON.stringify(keysList));
			const uuidsString = keysList.map(uuid => `'${uuid}'`).join(',');
			
			const body = {
				Where: `User.UUID in (${uuidsString})`,
				Fields: await this.accountBuyersFieldsString(),
				PageSize: -1
			}
			console.log("ACCOUNT BUYERS SEARCH BODY: " + JSON.stringify(body));
			const accountBuyersToUpsert = await this.papiClient.post('/account_buyers/search', body);
			const fixedAccountBuyers = accountBuyersToUpsert.map(obj => 
			{
				return {
					Key: obj.UUID,
					User: obj["User.UUID"],
					Account: obj["Account.UUID"],
					Hidden: obj.Hidden
				}
			});
			console.log("FIXED ACCOUNT BUYERS: " + JSON.stringify(fixedAccountBuyers));
			await this.adalService.chunkifiedBatchUpsert('account_users', fixedAccountBuyers);
			console.log("ACCOUNT BUYERS UPSERTED");
		}
	}

	async buildContainedUsersDict(externalUserResourceKeys: string[]): Promise<{[key: string]: any}>
	{
		const externalUserResourceContainedInUsers = await this.adalService.searchResource('users', {KeyList: externalUserResourceKeys});
		const externalUserResourceContainedInUsersDict = {};
		for(const user of externalUserResourceContainedInUsers.Objects)
		{
			externalUserResourceContainedInUsersDict[user.Key as string] = user;
		}
		console.log("CONTAINED USERS DICT: " + JSON.stringify(externalUserResourceContainedInUsersDict));
		return externalUserResourceContainedInUsersDict;
	}

	async accountBuyersFieldsString(): Promise<string>
	{
		const fieldsForSearch: string[] = ["UUID"];
		const fieldsObjects = resourceNameToSchemaMap["account_buyers"].Fields;
		for(const key in fieldsObjects)
		{
			if(fieldsObjects[key].Type == "Resource")
			{
				fieldsForSearch.push(`${key}.UUID`);
			}
			else if(key != "Key") // Key is not a field in account_buyers
			{
				fieldsForSearch.push(key);
			}
		}
		return fieldsForSearch.join(',');
	}
}
