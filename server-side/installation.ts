
/*
The return object format MUST contain the field 'success':
{success:true}

If the result of your code is 'false' then return:
{success:false, erroeMessage:{the reason why it is false}}
The error Message is importent! it will be written in the audit log and help the user to understand what happen
*/

import { Client, Request } from '@pepperi-addons/debug-server'
import { PapiClient, Relation, Subscription } from '@pepperi-addons/papi-sdk';
import semverLessThanComparator from 'semver/functions/lt'
import { AccountsPapiService, CORE_ADDON_UUID, Helper, RESOURCE_TYPES, READONLY_RESOURCES } from 'core-resources-shared';
import { AddonUUID } from '../addon.config.json';
import { TSA_CREATION_SUBSCRIPTION_NAME, TSA_MODIFICATION_SUBSCRIPTION_NAME } from './tsa-service/constants';
import { SchemaService } from './schema.service';
import { UsersPNSService } from './services/pns/usersPNS.service';
import { AccountUsersPNSService } from './services/pns/accountUsersPNS.service';
import { BasePNSService } from './services/pns/basePNS.service';
import { BuyersPNSService } from './services/pns/buyersPNS.service';
import { BuildManagerService } from './services/buildManager.service'
import { resourceNameToSchemaMap } from './resourcesSchemas';
import { AsyncResultObject } from './constants';


export async function install(client: Client, request: Request): Promise<any> 
{
	const res = { success: true };

	const papiClient = Helper.getPapiClient(client);
	const schemaService = new SchemaService(papiClient);

	try 
	{
		res['resultObject'] = {};
		res['resultObject']['createSchemas'] = await schemaService.createCoreSchemas();
		await createDimxRelations(client, papiClient);
		await upsertSubscriptionToTsaCreation(papiClient);
		await upsertSubscriptionToTsaModification(papiClient);
		res['resultObject']['buildTables'] = await buildTables(papiClient, Object.keys(resourceNameToSchemaMap).filter(resourceName => resourceNameToSchemaMap[resourceName].Type !== 'papi'));
		await pnsSubscriptions(papiClient);
	}
	catch (error) 
	{
		res.success = false;
		res['errorMessage'] = error instanceof Error ? error.message : 'Unknown error occurred.';
	}

	return res;
}

export async function uninstall(client: Client, request: Request): Promise<any> 
{
	const res = { success: true };

	const papiClient = Helper.getPapiClient(client);
	try
	{
		await removeDimxRelations(client, papiClient);
		const hideSubscription = true;
		await upsertSubscriptionToTsaCreation(papiClient, hideSubscription);
		await upsertSubscriptionToTsaModification(papiClient, hideSubscription);
	}
	catch(error)
	{
		res.success = false;
		res['errorMessage'] = error;
	}

	return res;
}

export async function upgrade(client: Client, request: Request): Promise<any> 
{
	const res = { success: true };

	if (request.body.FromVersion && semverLessThanComparator(request.body.FromVersion, '0.6.24')) 
	{
		const papiClient = Helper.getPapiClient(client);
		const schemaService = new SchemaService(papiClient);
		try
		{
			// Switch to hardcoded schemas
			res['resultObject'] = await schemaService.createCoreSchemas();
			// account_users DIMX relations should be updated with the new (empty) relative url
			await createDimxRelations(client, papiClient, ["account_users"]);
		}
		catch (error) 
		{
	
			res.success = false;
			res['errorMessage'] = error instanceof Error ? error.message : 'Unknown error occurred.';

			return res;
		}
	}
	else if(request.body.FromVersion && semverLessThanComparator(request.body.FromVersion, '0.6.27'))
	{
		const papiClient = Helper.getPapiClient(client);
		try 
		{
			// No need for filtering of Hidden account_users,
			// Starting at Core 0.6.31 this is handled in Core
			// for all resources.
			await createDimxRelations(client, papiClient, ["account_users"]);
		}
		catch (error) 
		{
	
			res.success = false;
			res['errorMessage'] = error instanceof Error ? error.message : 'Unknown error occurred.';

			return res;
		}
	}
	
	if(request.body.FromVersion && semverLessThanComparator(request.body.FromVersion, '0.6.33'))
	{
		const papiClient = Helper.getPapiClient(client);
		const schemaService = new SchemaService(papiClient);
		try 
		{
			// Fix 'accounts' and 'contacts' schemas
			// For more information please see the following:
			// https://pepperi.atlassian.net/browse/DI-22492
			// https://pepperi.atlassian.net/browse/DI-22490
			res['resultObject'] = await schemaService.createCoreSchemas(["accounts", "contacts"]);
		}
		catch (error) 
		{
	
			res.success = false;
			res['errorMessage'] = error instanceof Error ? error.message : 'Unknown error occurred.';

			return res;
		}
	}

	if (request.body.FromVersion && semverLessThanComparator(request.body.FromVersion, '0.6.8')) 
	{
		const papiClient = Helper.getPapiClient(client);
		try 
		{
			await createDimxRelations(client, papiClient);
		}
		catch (error) 
		{
			res.success = false;
			res['errorMessage'] = error instanceof Error ? error.message : 'Unknown error occurred.';

			return res;
		}
	}

	if(request.body.FromVersion && semverLessThanComparator(request.body.FromVersion, '0.7.2'))
	{
		const papiClient = Helper.getPapiClient(client);
		const schemaService = new SchemaService(papiClient);
		try 
		{

			res['resultObject'] = await schemaService.createCoreSchemas(["employees", "account_employees"]);
			await createDimxRelations(client, papiClient, ["employees", "account_employees"]);

		}
		catch (error) 
		{
			res.success = false;
			res['errorMessage'] = error instanceof Error ? error.message : 'Unknown error occurred.';

			return res;
		}
	}
	// Add FromERPIntegration field to account_employees
	else if(request.body.FromVersion && semverLessThanComparator(request.body.FromVersion, '0.7.5'))
	{
		const papiClient = Helper.getPapiClient(client);
		const schemaService = new SchemaService(papiClient);
		try 
		{

			res['resultObject'] = await schemaService.createCoreSchemas(["account_employees"]);

		}
		catch (error) 
		{
			res.success = false;
			res['errorMessage'] = error instanceof Error ? error.message : 'Unknown error occurred.';

			return res;
		}
	}

	else if(request.body.FromVersion && semverLessThanComparator(request.body.FromVersion, '0.7.32'))
	{
		const papiClient = Helper.getPapiClient(client);
		const schemaService = new SchemaService(papiClient);
		try 
		{

			res['resultObject'] = await schemaService.createCoreSchemas(["roles"]);
			await createDimxRelations(client, papiClient, ["roles"]);



		}
		catch (error) 
		{
			res.success = false;
			res['errorMessage'] = error instanceof Error ? error.message : 'Unknown error occurred.';

			return res;
		}
	}

	if(request.body.FromVersion && semverLessThanComparator(request.body.FromVersion, '0.7.9'))
	{
		const papiClient = Helper.getPapiClient(client);
		try 
		{
			await upsertSubscriptionToTsaCreation(papiClient);
		}
		catch (error) 
		{
			res.success = false;
			res['errorMessage'] = error instanceof Error ? error.message : 'Unknown error occurred.';

			return res;
		}
	}

	if(request.body.FromVersion && semverLessThanComparator(request.body.FromVersion, '0.7.13'))
	{
		const papiClient = Helper.getPapiClient(client);
		try 
		{
			const schemaService = new SchemaService(papiClient);
			// Update 'employees' schema to contain 'Name' field
			res['resultObject'] = await schemaService.createCoreSchemas(["employees"]);
		}
		catch (error) 
		{
			res.success = false;
			res['errorMessage'] = error instanceof Error ? error.message : 'Unknown error occurred.';

			return res;
		}
	}

	if(request.body.FromVersion && semverLessThanComparator(request.body.FromVersion, '0.7.23'))
	{
		const papiClient = Helper.getPapiClient(client);
		try 
		{
			await upsertSubscriptionToTsaModification(papiClient);
		}
		catch (error) 
		{
			res.success = false;
			res['errorMessage'] = error instanceof Error ? error.message : 'Unknown error occurred.';

			return res;
		}
	}

	// create a new profiles schema
	if(request.body.FromVersion && semverLessThanComparator(request.body.FromVersion, '0.7.27'))
	{
		const papiClient = Helper.getPapiClient(client);
		const schemaService = new SchemaService(papiClient);
		try 
		{
			res['resultObject'] = await schemaService.createCoreSchemas(["profiles"]);
		}
		catch (error) 
		{
			res.success = false;
			res['errorMessage'] = error instanceof Error ? error.message : 'Unknown error occurred.';

			return res;
		}
	}

	// Add profiles and roles references to employees schema, as well as new Phone field
	if(request.body.FromVersion && semverLessThanComparator(request.body.FromVersion, '0.7.56'))
	{
		const papiClient = Helper.getPapiClient(client);
		const schemaService = new SchemaService(papiClient);
		try 
		{
			res['resultObject'] = await schemaService.createCoreSchemas(["employees"]);
		}
		catch (error) 
		{
			res.success = false;
			res['errorMessage'] = error instanceof Error ? error.message : 'Unknown error occurred.';

			return res;
		}
	}

	// Create new schemas and run build process for 'role_roles' schemas.
	if(request.body.FromVersion && semverLessThanComparator(request.body.FromVersion, '0.7.44'))
	{
		const papiClient = Helper.getPapiClient(client);
		const schemaService = new SchemaService(papiClient);
		//const schemaNames = ['users', 'account_users'];
		const schemaNames = ['role_roles'];

		try 
		{
			// create new schemas, including for 'roles' which has changed.
			await schemaService.createCoreSchemas([...schemaNames, 'roles']);
			res['resultObject'] = await buildTables(papiClient, schemaNames);
		}
		catch (error) 
		{
			res.success = false;
			res['errorMessage'] = error instanceof Error ? error.message : 'Unknown error occurred.';

			return res;
		}
	}

	return res;
}

export async function downgrade(client: Client, request: Request): Promise<any> 
{
	const res: AsyncResultObject = { success: true };

	if(request.body.ToVersion && semverLessThanComparator(request.body.ToVersion, '0.7.0'))
	{
		res.success = false;
		res.errorMessage = 'Downgrade to version lower than 0.7.0 is not supported. Kindly uninstall the addon, allow some time for PNS, and install the required version again.';
	}

	return res;
}

async function createDimxRelations(client: Client, papiClient: PapiClient, resourcesList: string[] = RESOURCE_TYPES) 
{
	const isHidden = false;
	await postDimxRelations(client, isHidden, papiClient, resourcesList);
}

export async function removeDimxRelations(client: Client, papiClient: PapiClient, resourcesList: string[] = RESOURCE_TYPES) 
{
	const isHidden = true;
	await postDimxRelations(client, isHidden, papiClient, resourcesList);
}

// 'excludedResources' is used for resources that should not be available for import
async function postDimxImportRelations(client: Client, isHidden: boolean, papiClient: PapiClient, resourcesList: string[], excludedResources: string[] = READONLY_RESOURCES) 
{
	const filteredResources = resourcesList.filter(resource => !excludedResources.includes(resource));
	for (const resource of filteredResources)
	{
		await postDimxImportRelation(client, isHidden, papiClient, resource);
	}
}

async function postDimxExportRelations(client: Client, isHidden: boolean, papiClient: PapiClient, resourcesList: string[]) 
{
	for (const resource of resourcesList) 
	{
		await postDimxExportRelation(client, isHidden, papiClient, resource);
	}
}

async function postDimxRelations(client: Client, isHidden: boolean, papiClient: PapiClient, resourcesList: string[])
{
	await postDimxImportRelations(client, isHidden, papiClient, resourcesList);
	await postDimxExportRelations(client, isHidden, papiClient, resourcesList);
}

async function postDimxImportRelation(client: Client, isHidden: boolean, papiClient: PapiClient, resource: string): Promise<void>
{
	const importRelation: Relation = {
		RelationName: "DataImportResource",
		AddonUUID: client.AddonUUID,
		AddonRelativeURL: '',
		Name: resource,
		Type: 'AddonAPI',
		Source: 'papi',
		Hidden: isHidden
	};

	await upsertRelation(papiClient, importRelation);
}

async function postDimxExportRelation(client: Client, isHidden: boolean, papiClient: PapiClient, resource: string): Promise<void>
{
	const exportRelation: Relation = {
		RelationName: "DataExportResource",
		AddonUUID: client.AddonUUID,
		AddonRelativeURL: '',
		Name: resource,
		Type: 'AddonAPI',
		Source: 'papi',
		Hidden: isHidden
	};

	switch(resource)
	{
	case 'accounts':
	{
		// Get the DefaultDefinitionTypeID
		const papiService = new AccountsPapiService(papiClient);
		const typeDefinitionID = (await papiService.getAccountTypeDefinitionID())[0].InternalID;

		// Add the DefaultDefinitionTypeID to the where clauses on DIMX exports
		exportRelation['DataSourceExportParams'] = {ForcedWhereClauseAddition: `TypeDefinitionID=${typeDefinitionID}`};
		break;
	}		
	case 'account_users':
	{
		exportRelation['Source'] = 'adal';
		break;
	}
	case 'users':
	{
		exportRelation['Source'] = 'adal';
		break;
	}
	}

	await upsertRelation(papiClient, exportRelation);
}

async function upsertRelation(papiClient: PapiClient, relation: Relation) 
{
	return papiClient.post('/addons/data/relations', relation);
}

/**
 * Create a subscription to TSA's creation
 * @param papiClient 
 */
async function upsertSubscriptionToTsaCreation(papiClient: PapiClient)

/**
 * Either hides or creates a subscription to TSA's creation, depending on the shouldHide parameter.
 * @param papiClient 
 * @param shouldHide 
 */
async function upsertSubscriptionToTsaCreation(papiClient: PapiClient, shouldHide: boolean)
async function upsertSubscriptionToTsaCreation(papiClient: PapiClient, shouldHide = false)
{
	const subscription: Subscription = {
		AddonUUID: AddonUUID,
		Name: TSA_CREATION_SUBSCRIPTION_NAME,
		Type: "data",
		FilterPolicy: {
			Action: ['insert'],
			AddonUUID: [CORE_ADDON_UUID],
			Resource: ['type_safe_attribute']
		},
		AddonRelativeURL: '/api/handle_tsa_creation',
		Hidden: shouldHide
	}
	
	await papiClient.notification.subscriptions.upsert(subscription);
}

/**
 * Create a subscription to TSA's modification
 * @param papiClient 
 */
 async function upsertSubscriptionToTsaModification(papiClient: PapiClient): Promise<void>

 /**
  * Either hides or creates a subscription to TSA's modification, depending on the shouldHide parameter.
  * @param papiClient 
  * @param shouldHide 
  */
 async function upsertSubscriptionToTsaModification(papiClient: PapiClient, shouldHide: boolean): Promise<void>
async function upsertSubscriptionToTsaModification(papiClient: PapiClient, shouldHide = false): Promise<void>
{
	 const subscription: Subscription = {
		 AddonUUID: AddonUUID,
		 Name: TSA_MODIFICATION_SUBSCRIPTION_NAME,
		 Type: "data",
		 FilterPolicy: {
			 Action: ['update'],
			 AddonUUID: [CORE_ADDON_UUID],
			 Resource: ['type_safe_attribute']
		 },
		 AddonRelativeURL: '/api/handle_tsa_modifications',
		 Hidden: shouldHide
	 }
	 
	 await papiClient.notification.subscriptions.upsert(subscription);
}

async function purgeSchemas(papiClient: PapiClient, schemasNames: string[]): Promise<void>
{
	for(const schemaName of schemasNames)
	{
		try
		{
			await papiClient.post(`/addons/data/schemes/${schemaName}/purge`);
		}
		catch(error)
		{
			console.log(`Failed to purge schema '${schemaName}'. Assuming it was previously purged or never existed, continuing installation. Error: ${error instanceof Error ? error.message : 'Unknown error'}'}}`);
		}
	}
}

async function subscribeToPNS(pnsService: BasePNSService): Promise<void>
{
	await pnsService.subscribe();
}

async function pnsSubscriptions(papiClient: PapiClient): Promise<void>
{
	await subscribeToPNS(new UsersPNSService(papiClient));
	await subscribeToPNS(new BuyersPNSService(papiClient));
	await subscribeToPNS(new AccountUsersPNSService(papiClient));

	// remove previous contacts subscription
	await papiClient.notification.subscriptions.upsert({
		AddonUUID: AddonUUID,
		Name: 'papiContactsChanged',
		AddonRelativeURL: '',
		FilterPolicy: {},
		Hidden: true
	});
}

async function buildTables(papiClient: PapiClient, tablesNames: string[]): Promise<AsyncResultObject>
{
	const resultObject: AsyncResultObject = {success: true};
	const buildManager = new BuildManagerService(papiClient);

	const promises = await Promise.allSettled(tablesNames.map(tableName => buildManager.build(tableName)));
	
	for (const promise of promises)
	{
		if(promise.status === 'rejected')
		{
			resultObject.success = false;
			resultObject.errorMessage = promise.reason instanceof Error ? promise.reason.message : 'Unknown error';
		}
		else
		{
			resultObject.success = resultObject.success && promise.value.success;
			resultObject.errorMessage = resultObject.errorMessage ? `${resultObject.errorMessage}/n ${promise.value.errorMessage}` : promise.value.errorMessage;
		}
	}

	return resultObject;
}
