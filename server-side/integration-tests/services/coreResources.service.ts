import { PapiClient, SearchData, AddonData, SearchBody, FindOptions, Account } from '@pepperi-addons/papi-sdk';
import { v4 as uuid } from 'uuid';
import { AddonUUID } from '../../../addon.config.json';
import { TestBody } from '../../services/integrationTests/entities';
import { BuildManagerService } from '../../services/buildManager.service';
import { AsyncHelperService } from '../../services/asyncHelper.service';

export class CoreResourcesTestsService 
{
	dataObject: any; // the 'Data' object passed inside the http request sent to start the test -- put all the data you need here
	pageSize = 500;
	asyncHelperService: AsyncHelperService;

	constructor(public papiClient: PapiClient, public asyncPapiClient?: PapiClient)
	{
		this.asyncHelperService = new AsyncHelperService(papiClient);
	}

	async getGenericResourceObjects(resource: string, options?: FindOptions): Promise<AddonData[]> 
	{
		return await this.papiClient.resources.resource(resource).get(options);
	}

	/**
	 * Get all objects of a generic resource, using the search API and PageKey.
	 * @param resource {string} The name of the resource to get all objects of.
	 * @returns {Promise<AddonData[]>} All objects of the resource.
	 */
	async searchAllAdalGenericResourceObjects(resource: string, includeDeleted = true): Promise<AddonData[]> 
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

	async getGenericResource(resource: string, options?: FindOptions): Promise<AddonData[]> 
	{
		return await this.papiClient.resources.resource(resource).get(options);
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

	async getAllPapiGenericResourceObjects(resource: string): Promise<any[]> 
	{
		let page = 1;
		let totalObjects: any[] = [];
		let currentPageObjects: any[] = [];
		do 
		{
			currentPageObjects = await this.papiClient.resources.resource(resource).get({page_size: this.pageSize, page: page});
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

		return await this.asyncPapiClient?.addons.api.uuid(AddonUUID).file('adal').func('build').post({resource: resource}, testData);
	}

	async buildRoleRolesTable(testData?: TestBody): Promise<any>
	{
		return await this.asyncPapiClient?.addons.api.uuid(AddonUUID).file('adal').func('clean_build_role_roles').post({}, testData);
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
		const schema = await this.papiClient.addons.data.schemes.name(tableName).get();
		await this.papiClient.post(`/addons/data/schemes/${tableName}/purge`);
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

	async runPostUpgradeOperations()
	{
		const asyncHelperService = new AsyncHelperService(this.papiClient);
		const asyncCall = await this.asyncPapiClient?.post(`/addons/api/${AddonUUID}/adal/run_post_upgrade_operations`, {});
		if(!asyncCall)
		{
			const errorMessage = `Error executing run_post_upgrade_operations in file 'adal', got a null from async call.`;
			console.error(errorMessage);
			throw new Error(errorMessage);
		}
		const isAsyncRequestResolved = await asyncHelperService.pollExecution(this.asyncPapiClient!, asyncCall.ExecutionUUID!);
		if(!isAsyncRequestResolved)
		{
			const errorMessage = `Error executing run_post_upgrade_operations in file 'adal'. For more details see audit log: ${asyncCall.ExecutionUUID!}`;
			console.error(errorMessage);
			throw new Error(errorMessage);
		}

		console.log(`Successfully executed run_post_upgrade_operations in file 'adal'.`);
	}

	async isBuyerManagementInstalled(): Promise<boolean>
	{
		const usersSchema = await this.papiClient.addons.data.schemes.name('users').get();
		// ExternalUserResourcesRegistration on users scheme indicates that Buyer Management is installed
		return usersSchema.Internals?.ExternalUserResourcesRegistration?.length > 0;
	}

	async installBuyerManagementAddon(): Promise<void>
	{
		const asyncHelperService = new AsyncHelperService(this.papiClient);
		const buyerManagementAddonUUID = "ee953146-b133-4ba2-bdc4-dd15ac2b76a4";
		const versions = await this.papiClient.addons.versions.find({where: `AddonUUID='${buyerManagementAddonUUID}'`, order_by: `"CreationDateTime" desc`});
		const latest = versions[0].Version;
		const asyncInstall = await this.asyncPapiClient!.addons.installedAddons.addonUUID(buyerManagementAddonUUID).install(latest);
		const isAsyncRequestResolved = await asyncHelperService.pollExecution(this.asyncPapiClient!, asyncInstall.ExecutionUUID!);
		if(!isAsyncRequestResolved)
		{
			const errorMessage = `Error installing buyer management addon. For more details see audit log: ${asyncInstall.ExecutionUUID!}`;
			console.error(errorMessage);
			throw new Error(errorMessage);
		}
		
		console.log(`Successfully installed buyer management addon.`);
	}

	generateUUID(): string
	{
		return uuid();
	}
}
