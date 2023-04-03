import { User } from '../models/resources';
import { BasePNSService } from './basePNS.service';
import { Client } from '@pepperi-addons/debug-server';
import { PapiUsersService } from './papiUsers.service';
import { PapiContactsService } from './papiContacts.service';

export class UsersPNSService extends BasePNSService 
{

	protected papiUsersService: PapiUsersService;
	protected papiContactsService: PapiContactsService;

	constructor(client: Client) 
	{
		super(client);
		this.papiUsersService = new PapiUsersService(client);
		this.papiContactsService = new PapiContactsService(client);
	}

	async subscribeToPNS() 
	{
		// for users maintenance
		await this.subscribe("/adal/update_users", "papiUsersChanged", "update", "users");
		await this.subscribe("/adal/update_users", "papiUsersAdded", "insert", "users");
		await this.subscribe("/adal/update_users_from_contacts", "papiContactsChanged", "update", "contacts");
		// didn't subscribe to insert contacts, because new contact is not a buyer
	}

	getResourceName(): string 
	{
		return 'users';
	}

	async updateUsers(messageFromPNS: any) 
	{
		console.log("USERS UPDATE PNS TRIGGERED");
		const usersUUIDs = messageFromPNS.FilterAttributes.ModifiedObjects;
		let updatedPapiUsers = await this.papiUsersService.getPapiObjectsByUUIDs(usersUUIDs);
		updatedPapiUsers = this.papiUsersService.fixPapiObjects(updatedPapiUsers);
		const batchUpsertResponse = await this.adalHelperService.batchUpsert(updatedPapiUsers, 'users');
		console.log("USERS UPDATE PNS FINISHED. BATCH UPSERT RESPONSE: " + JSON.stringify(batchUpsertResponse));
	}

	async updateUsersFromContacts(messageFromPNS: any) 
	{
		console.log("USERS UPDATE FROM CONTACTS PNS TRIGGERED");
		const contactsUUIDs = messageFromPNS.FilterAttributes.ModifiedObjects;
		const updatedPapiContacts = await this.papiContactsService.getPapiObjectsByUUIDs(contactsUUIDs, 'IsBuyer');
		const usersToUpdate: User[] = [];
		const contactsContainedInUsers = await this.adalHelperService.getByKeys(contactsUUIDs, this.getResourceName());
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
		const batchUpsertResponse = await this.adalHelperService.batchUpsert(usersToUpdate, 'users');
		console.log("USERS UPDATE FROM CONTACTS PNS FINISHED. BATCH UPSERT RESPONSE: " + JSON.stringify(batchUpsertResponse));
	}
}
