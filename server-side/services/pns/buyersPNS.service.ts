import { PnsParams, User } from '../../models/metadata';
import { BasePNSService } from './basePNS.service';
import { BuyersGetterService } from '../getters/buyersGetter.service';
import { AddonData, PapiClient } from '@pepperi-addons/papi-sdk';
import { AdalService } from '../adal.service';
import config from '../../../addon.config.json'
import { resourceNameToSchemaMap } from '../../resourcesSchemas';

export class BuyersPNSService extends BasePNSService
{

	protected buyersGetterService: BuyersGetterService;
	protected adalService: AdalService;
	private udcAddonUUID = "122c0e9d-c240-4865-b446-f37ece866c22";

	constructor(papiClient: PapiClient)
	{
		super(papiClient);
		this.buyersGetterService = new BuyersGetterService(papiClient);
		this.adalService = new AdalService(papiClient);
	}

	getSubscribeParamsSets(): PnsParams[]
	{
		// Users will be notified according to those fields, which are mutual for users and buyers
		let regularFields = Object.keys(resourceNameToSchemaMap['users'].Fields ?? {});
		regularFields = regularFields.filter(field => field != 'UserType');

		// for users maintenance
		return [
			{
				AddonRelativeURL: "/adal/update_users_from_buyers",
				Name: "buyersChanged",
				Action: "update",
				Resource: "Buyers",
				ModifiedFields: regularFields,
				AddonUUID: this.udcAddonUUID
			},
			{
				AddonRelativeURL: "/adal/update_users_state", 
				Name: "buyersUserFieldChanged", 
				Action: "update", 
				Resource: "Buyers", 
				ModifiedFields: ["User"], 
				AddonUUID: this.udcAddonUUID
			},
			{
				AddonRelativeURL: "/adal/insert_users_from_buyers",
				 Name: "buyersAdded", 
				 Action: "insert", 
				 Resource: "Buyers",
				 AddonUUID: this.udcAddonUUID
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

	async updateUsersState(messageFromPNS: any): Promise<void>
	{
		console.log("USERS STATE UPDATE FROM BUYERS PNS TRIGGERED");
		const buyersKeys = messageFromPNS.Message.ModifiedObjects.map(obj => obj.ObjectKey);
		console.log("BUYERS KEYS: " + JSON.stringify(buyersKeys));
		const updatedBuyersByKeysRes = await this.buyersGetterService.getObjectsByKeys(buyersKeys, 'User');
		const updatedBuyers = updatedBuyersByKeysRes.Objects;
		const buyersContainedInUsers = await this.adalService.searchResource('users', {KeyList: buyersKeys});
		const newUsers: AddonData[] = [];
		const noLongerUsers: AddonData[] = [];
		for(const buyer of updatedBuyers)
		{
			if(!buyer.User && buyersContainedInUsers.Objects.find(user => user.Key==buyer.Key)) 
			{
				// buyer is being hided from adal users because he is no longer a user
				buyer.Hidden = true;
				noLongerUsers.push(buyer);
			}
			else if(buyer.User)
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
}
