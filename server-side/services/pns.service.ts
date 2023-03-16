import { PapiClient } from '@pepperi-addons/papi-sdk';
import { Client } from '@pepperi-addons/debug-server';
import config from '../../addon.config.json';
import { ResourceHelperService } from './resourceHelper.service';
import { User } from '../models/resources';

export class PNSService {

    papiClient: PapiClient;
    resourceHelperService: ResourceHelperService;
    requestedUserFields: string;

    constructor(private client: Client) {
        this.papiClient = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
            addonUUID: client.AddonUUID,
            addonSecretKey: client.AddonSecretKey,
            actionUUID: client.ActionUUID
        });
        this.resourceHelperService = new ResourceHelperService(client);
        this.requestedUserFields = "UUID,FirstName,LastName,Name,Email,InternalID,ExternalID,Mobile";
    }
    
    async subscribeToUsersPNS() {
        const coreAddonUUID = "00000000-0000-0000-0000-00000000c07e";
        await this.papiClient.notification.subscriptions.upsert({
            AddonUUID: config.AddonUUID,
            AddonRelativeURL: "/adal/update_users",
            Type: "data",
            Name: "papiUsersChanged",
            FilterPolicy: {
                Action:['update'],
                Resource:['users'],
                AddonUUID:[coreAddonUUID]
            }
        })
        await this.papiClient.notification.subscriptions.upsert({
            AddonUUID: config.AddonUUID,
            AddonRelativeURL: "/adal/update_users",
            Type: "data",
            Name: "papiUsersChanged",
            FilterPolicy: {
                Action:['insert'],
                Resource:['users'],
                AddonUUID:[coreAddonUUID]
            }
        })
        await this.papiClient.notification.subscriptions.upsert({
            AddonUUID: config.AddonUUID,
            AddonRelativeURL: "/adal/update_users_from_contacts",
            Type: "data",
            Name: "papiContactsChanged",
            FilterPolicy: {
                Action:['update'],
                Resource:['contacts'],
                AddonUUID:[coreAddonUUID]
            }
        })
    }

    async updateUsers(messageFromPNS: any) {
        console.log("USERS UPDATE PNS TRIGGERED");
        console.log(JSON.stringify(messageFromPNS));
        const usersUUIDs = messageFromPNS.FilterAttributes.ModifiedObjects;
        const papiUpdatedUsers = await this.papiClient.post(`/users/search`,{
            UUIDList: usersUUIDs,
            Fields: this.requestedUserFields
        });
        papiUpdatedUsers.forEach(user => this.resourceHelperService.replaceUUIDWithKey(user));
        const batchUpsertResponse = await this.resourceHelperService.upsert(papiUpdatedUsers, 'users');
        console.log("USERS UPDATE PNS FINISHED. BATCH UPSERT RESPONSE: " + JSON.stringify(batchUpsertResponse));
    }

    async updateUsersFromContacts(messageFromPNS: any) {
        console.log("USERS UPDATE FROM CONTACTS PNS TRIGGERED");
        console.log(JSON.stringify(messageFromPNS));
        const contactsUUIDs = messageFromPNS.FilterAttributes.ModifiedObjects;
        const papiUpdatedContacts = await this.papiClient.post(`/contacts/search`,{
            UUIDList: contactsUUIDs,
            Fields: `${this.requestedUserFields},IsBuyer`
        });
        let usersToUpdate: User[] = [];
        const contactsContainedInUsers = await this.resourceHelperService.getByKeys(contactsUUIDs, 'users');
        papiUpdatedContacts.forEach(async contact => {
            this.resourceHelperService.replaceUUIDWithKey(contact);
            if(contact.IsBuyer==false && contactsContainedInUsers.Objects.find(user => user.Key==contact.Key)) {
                // hard delete the contact, which is no longer a user
                await this.papiClient.post(`/users/${contact.Key}/hard_delete`);
            } else if(contact.IsBuyer==true) {
                usersToUpdate.push(contact);
            }
        });
        const batchUpsertResponse = await this.resourceHelperService.upsert(usersToUpdate, 'users');
        console.log("USERS UPDATE FROM CONTACTS PNS FINISHED. BATCH UPSERT RESPONSE: " + JSON.stringify(batchUpsertResponse));
    }
}