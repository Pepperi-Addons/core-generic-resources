import { PapiClient, SearchData, AddonData, SearchBody, FindOptions, Account } from '@pepperi-addons/papi-sdk';
import { v4 as uuid } from 'uuid';
import { AddonUUID } from '../../../addon.config.json';
import { TestBody } from '../../services/integrationTests/entities';
import { resourceNameToSchemaMap } from '../../resourcesSchemas';

export class CoreResourcesTestsService 
{
	dataObject: any; // the 'Data' object passed inside the http request sent to start the test -- put all the data you need here
	pageSize = 500;

	constructor(public papiClient: PapiClient)
	{}

	async getGenericResourceObjects(resource: string): Promise<AddonData[]> 
	{
		return await this.papiClient.resources.resource(resource).get();
	}

	/**
	 * Get all objects of a generic resource, using the search API and PageKey.
	 * @param resource {string} The name of the resource to get all objects of.
	 * @returns {Promise<AddonData[]>} All objects of the resource.
	 */
	async getAllGenericResourceObjects(resource: string, includeDeleted = true): Promise<AddonData[]> 
	{
		const res: AddonData[] = [];

		let searchResponse: SearchData<AddonData>;
		let NextPageKey: string | undefined = undefined;

		do
		{
			const searchOptions: SearchBody = {
				...(NextPageKey && {PageKey: NextPageKey}),
				IncludeDeleted: includeDeleted
			};

			searchResponse = await this.searchGenericResource(resource, searchOptions);
			
			res.push(...searchResponse.Objects);
			NextPageKey = searchResponse.NextPageKey;
		}
		while (NextPageKey);

		return res;
	}

	async getGenericResourceByKey(resource: string, key: string): Promise<AddonData> 
	{
		return await this.papiClient.resources.resource(resource).key(key).get();
	}

	async getGenericResourceByUniqueField(resource: string, fieldID: string, key: string): Promise<AddonData> 
	{
		return await this.papiClient.resources.resource(resource).unique(fieldID).get(key);
	}

	async searchGenericResource(resource: string, searchBody: SearchBody): Promise<SearchData<AddonData>> 
	{
		return await this.papiClient.resources.resource(resource).search(searchBody);
	}

	async getPapiResourceObjects(resource: string): Promise<any[]> 
	{
		let page = 1;
		let totalObjects: any[] = [];
		let currentPageObjects: any[] = [];
		do 
		{
			currentPageObjects = await this.papiClient.get(`/${resource}?page_size=${this.pageSize}&page=${page}&include_deleted=true`);
			totalObjects = totalObjects.concat(currentPageObjects);
			page++;
		} while (currentPageObjects.length == this.pageSize);

		return totalObjects;
	}

	async createTestAccount(): Promise<Account> 
	{
		return await this.papiClient.accounts.upsert({
			UUID: uuid(),
			Email: "test@core-resources.com",
    		Name: "core-resources test account",
		});
	}

	// async papiBatchUpsert(resource: string, objects: any[]): Promise<any> {
	// 	return await this.papiClient.post(`/batch/${resource}`, objects);
	// }

	async createPapiUsers(count: number): Promise<any[]> 
	{
		const users: any[] = [];
		const unique = uuid();
		for(let i = 0; i < count; i++) 
		{
			const user = await this.papiClient.post('/createUser',{
				Email: `usertest${i}-${unique}@test.com`,
				FirstName: `usertest${i}-${unique}`,
				LastName: `usertest${i}-${unique}`
			});
			users.push(user);
		}
		return users;
	}

	async createPapiAccountUsers(users: any[], account): Promise<any[]> 
	{
		const accountUsers: any[] = [];
		for(let i = 0; i < users.length; i++) 
		{
			const user = await this.papiClient.post('/account_users',{
				Account: {
					"Data": {
						"InternalID": account.InternalID,
						"UUID": account.UUID,
						"ExternalID": null
					},
					"URI": `/accounts/${account.InternalID}}`
				},
				User: {
					"Data": {
						"InternalID": users[i].InternalID,
						"UUID": users[i].UUID,
						"ExternalID": null
					},
					"URI": `/users/${users[i].InternalID}}`
				}
			});
			accountUsers.push(user);
		}
		return accountUsers;
	}

	async buildTable(resource: string, testData?: TestBody): Promise<any> 
	{
		return await this.papiClient.addons.api.uuid(AddonUUID).file('adal').func('build').post({resource: resource}, testData);
	}

	async buildBuyersTable(testData?: TestBody): Promise<any>
	{
		return await this.papiClient.addons.api.uuid(AddonUUID).file('adal').func('clean_build_role_roles').post({}, testData);
	}

	async buildRoleRolesTable(testData?: TestBody): Promise<any>
	{
		return await this.papiClient.addons.api.uuid(AddonUUID).file('adal').func('clean_build_role_roles').post({}, testData);
	}

	async cleanTable(resource: string): Promise<void> 
	{

		let searchResponse: SearchData<AddonData>;
		let NextPageKey: string | undefined = undefined;

		do
		{
			const searchOptions: SearchBody = {
				...(NextPageKey && {PageKey: NextPageKey}),
				Fields: ["Key"]
			};

			searchResponse = await this.searchGenericResource(resource, searchOptions);
			
			// For each object, set the Hidden field to true
			searchResponse.Objects.forEach(obj => obj.Hidden = true);

			// Batch upsert to adal
			if(searchResponse.Objects.length > 0)
			{
				await this.papiClient.post(`/addons/data/batch/${AddonUUID}/${resource}`, {Objects: searchResponse.Objects})
			}
			NextPageKey = searchResponse.NextPageKey;
		}
		while (NextPageKey);
	}	

	// purge then create the table
	async resetTable(tableName: string)
	{
		await this.papiClient.post(`/addons/data/schemes/${tableName}/purge`);
		const schema = resourceNameToSchemaMap[tableName];
		return await this.papiClient.addons.data.schemes.post(schema);
	}

	async createContact(contact) 
	{
		contact.UUID = uuid();
		return await this.papiClient.post(`/contacts`, contact);
	}

	// should be used by PNS tests
	async createContactsForTest(count: number, account: any): Promise<string[]> 
	{
		const contactsUUIDs: string[] = [];
		const unique = uuid();
		for(let i = 0; i < count; i++) 
		{
			const body = {
				FirstName: `test${i}-${unique}`,
				Email: `test${i}-${unique}@test.com`,
				IsBuyer: false,
				Account: {
					"Data": {
						"InternalID": account.InternalID,
						"UUID": account.UUID,
						"ExternalID": null
					},
					"URI": `/accounts/${account.InternalID}}`
				}
			}
			const created = await this.createContact(body);
			contactsUUIDs.push(created.UUID);
		}
		return contactsUUIDs;
	}

	async connectContacts(contactsUUIDs: string[]): Promise<any> 
	{
		return await this.papiClient.post(`/Contacts/ConnectAsBuyer`, {
			UUIDs: contactsUUIDs,
			SelectAll: false
		});
	}

	async disconnectBuyers(contactsUUIDs: string[]): Promise<any> 
	{
		return await this.papiClient.post(`/Contacts/DisconnectBuyer`, {
			UUIDs: contactsUUIDs,
			SelectAll: false
		});
	}

	async hideCreatedPapiObjects(resource: string, contactsUUIDs: any[]): Promise<void> 
	{
		const objects = contactsUUIDs.map(uuid => 
		{
			return {UUID: uuid, Hidden: true}
		});
		await this.papiClient.post(`/batch/${resource}`, objects);
	}

	/**
	 * Sleeps for the specified number of seconds
	 * @param seconds - number of seconds to wait for the async job to finish. Default is 30 seconds.
	 */
	async waitForAsyncJob(seconds = 30): Promise<void> 
	{
		console.log(`Waiting for ${seconds} seconds for operation to catch up...`);
		Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, seconds * 1000);
		console.log(`Done waiting for operation`);
	}

	async getAdalSchemeFieldsNames(resource: string): Promise<string[]> 
	{
		const schema = await this.papiClient.addons.data.schemes.name(resource).get();
		return Object.keys(schema.Fields!);
	}

	generateValidKey() 
	{
		return uuid();
	}

	getDifference(setA, setB) 
	{
		return new Set(
		  [...setA].filter(element => !setB.has(element))
		);
	  }
}
