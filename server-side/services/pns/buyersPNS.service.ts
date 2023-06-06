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
			{AddonRelativeURL: "/adal/update_users_from_buyers", Name: "buyersChanged", Action: "update", Resource: "buyers", ModifiedFields: regularFields},
			{AddonRelativeURL: "/adal/update_users_state", Name: "buyersUserFieldChanged", Action: "update", Resource: "buyers", ModifiedFields: ["User"]},
			{AddonRelativeURL: "/adal/insert_users_from_buyers", Name: "buyersAdded", Action: "insert", Resource: "buyers"}
		]
	}

	async updateAdalTable(messageFromPNS: any): Promise<void>
	{
		console.log("USERS UPDATE FROM BUYERS PNS TRIGGERED");
		const buyersKeys = messageFromPNS.Message.ModifiedObjects.map(obj => obj.ObjectKey);
		console.log("BUYERS KEYS: " + JSON.stringify(buyersKeys));
		const updatedBuyers = await this.buyersGetterService.getObjectsByKeys(buyersKeys);
		const fixedBuyers = this.buyersGetterService.fixObjects(updatedBuyers);
		await this.adalService.batchUpsert('users', fixedBuyers);
		console.log("USERS UPDATE FROM BUYERS PNS FINISHED");
	}

	async updateUsersState(messageFromPNS: any): Promise<void>
	{
		console.log("USERS STATE UPDATE FROM BUYERS PNS TRIGGERED");
		const buyersKeys = messageFromPNS.Message.ModifiedObjects.map(obj => obj.ObjectKey);
		console.log("BUYERS KEYS: " + JSON.stringify(buyersKeys));
		const updatedBuyers = await this.buyersGetterService.getObjectsByKeys(buyersKeys, 'User');
		const buyersContainedInUsers = await this.adalService.searchResource('users', {KeyList: buyersKeys});
		const newUsers: AddonData[] = [];
		for(const buyer of updatedBuyers)
		{
			if(!buyer.User && buyersContainedInUsers.Objects.find(user => user.Key==buyer.Key)) 
			{
				// hard delete the buyer(which is no longer a user) from adal users
				await this.papiClient.post(`/addons/data/${config.AddonUUID}/users/${buyer.Key}/hard_delete`, {Force: true});
			}
			else if(buyer.User)
			{
				newUsers.push(buyer);
			}
		}
		if(newUsers.length > 0)
		{
			const fixedBuyers = this.buyersGetterService.fixObjects(newUsers);
			await this.adalService.batchUpsert('users', fixedBuyers);
			console.log("USERS STATE UPDATE FROM BUYERS PNS FINISHED");
		}

	}
}
