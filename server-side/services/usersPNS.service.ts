import { User } from '../models/resources';
import { BasePNSService } from './basePNS.service';

export class UsersPNSService extends BasePNSService 
{

	async subscribeToPNS() 
	{
		// for users maintenance
		await this.subscribe("/adal/update_users", "papiUsersChanged", "update", "users");
		await this.subscribe("/adal/update_users", "papiUsersAdded", "insert", "users");
		await this.subscribe("/adal/update_users_from_contacts", "papiContactsChanged", "update", "contacts");
	}

	getResourceName(): string 
	{
		return 'users';
	}

	async updateUsers(messageFromPNS: any) 
	{
		console.log("USERS UPDATE PNS TRIGGERED");
		let updatedPapiUsers = await this.getPapiUpdatedObjects(messageFromPNS, 'users');
		updatedPapiUsers = this.replaceUUIDs(updatedPapiUsers);
		const batchUpsertResponse = await this.upsertObjects(updatedPapiUsers);
		console.log("USERS UPDATE PNS FINISHED. BATCH UPSERT RESPONSE: " + JSON.stringify(batchUpsertResponse));
	}

	async updateUsersFromContacts(messageFromPNS: any) 
	{
		console.log("USERS UPDATE FROM CONTACTS PNS TRIGGERED");
		const papiUpdatedContacts = await this.getPapiUpdatedObjects(messageFromPNS, 'contacts', 'IsBuyer');
		const usersToUpdate: User[] = [];
		const contactsUUIDs = messageFromPNS.FilterAttributes.ModifiedObjects;
		const contactsContainedInUsers = await this.resourceHelperService.getByKeys(contactsUUIDs, this.getResourceName());
		for(const contact of papiUpdatedContacts) 
		{
			this.resourceHelperService.replaceUUIDWithKey(contact);
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
		const batchUpsertResponse = await this.upsertObjects(usersToUpdate);
		console.log("USERS UPDATE FROM CONTACTS PNS FINISHED. BATCH UPSERT RESPONSE: " + JSON.stringify(batchUpsertResponse));
	}
}
