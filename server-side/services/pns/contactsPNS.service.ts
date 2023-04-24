import { PnsParams, User } from '../../models/metadata';
import { BasePNSService } from './basePNS.service';
import { PapiContactsGetterService } from '../getters/papiContactsGetter.service';
import { PapiClient } from '@pepperi-addons/papi-sdk';
import { AdalService } from '../adal.service';

// split this into usersPNS and contactsPNS
export class ContactsPNSService extends BasePNSService
{

	protected papiContactsService: PapiContactsGetterService;
	protected adalService: AdalService;

	constructor(papiClient: PapiClient)
	{
		super(papiClient);
		this.papiContactsService = new PapiContactsGetterService(papiClient);
		this.adalService = new AdalService(papiClient);
	}

	getSubscribeParamsSets(): PnsParams[]
	{
		// for users maintenance
		return [
			{AddonRelativeURL: "/adal/update_users_from_contacts", Name: "papiContactsChanged", Action: "update", Resource: "contacts"}
		]
		// didn't subscribe to insert contacts, because new contact is not a buyer
	}

	async updateAdalTable(messageFromPNS: any): Promise<void>
	{
		console.log("USERS UPDATE FROM CONTACTS PNS TRIGGERED");
		console.log(messageFromPNS);
		const contactsUUIDs = messageFromPNS.Message.ModifiedObjects.map(obj => obj.ObjectKey);
		console.log("CONTACTS UUIDS: " + JSON.stringify(contactsUUIDs));
		const updatedPapiContacts = await this.papiContactsService.getPapiObjectsByUUIDs(contactsUUIDs, 'IsBuyer');
		const usersToUpdate: User[] = [];
		const contactsContainedInUsers = await this.adalService.searchResource('users', {KeyList: contactsUUIDs});
		const fixedContacts = this.papiContactsService.fixPapiObjects(updatedPapiContacts);
		for(const contact of fixedContacts)
		{
			if(!contact.IsBuyer && contactsContainedInUsers.Objects.find(user => user.Key==contact.Key)) 
			{
				// hard delete the contact, which is no longer a user
				await this.papiClient.post(`/users/${contact.Key}/hard_delete`);
			}
			else if(contact.IsBuyer)
			{
				usersToUpdate.push(contact);
			}
		}
		if(usersToUpdate.length > 0)
		{
			const batchUpsertResponse = await this.adalService.batchUpsert('users', usersToUpdate);
			console.log("BATCH UPSERT RESPONSE: " + JSON.stringify(batchUpsertResponse));
		}
		console.log("USERS UPDATE FROM CONTACTS PNS FINISHED");	
	}
}
