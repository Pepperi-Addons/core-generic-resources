
/*
The return object format MUST contain the field 'success':
{success:true}

If the result of your code is 'false' then return:
{success:false, erroeMessage:{the reason why it is false}}
The error Message is importent! it will be written in the audit log and help the user to understand what happen
*/

import { Client, Request } from '@pepperi-addons/debug-server'
import { PapiClient, Relation } from '@pepperi-addons/papi-sdk';
import semverLessThanComparator from 'semver/functions/lt'
import { AccountsPapiService, Helper, RESOURCE_TYPES, READONLY_RESOURCES } from 'core-resources-shared';
import { resourceNameToSchemaMap } from './resourcesSchemas';
import { UsersPNSService } from './services/pns/usersPNS.service';
import { AccountUsersPNSService } from './services/pns/accountUsersPNS.service';
import { BasePNSService } from './services/pns/basePNS.service';
import { ContactsPNSService } from './services/pns/contactsPNS';

export async function install(client: Client, request: Request): Promise<any> 
{
	const res = { success: true };

	const papiClient = Helper.getPapiClient(client);
	try 
	{
		res['resultObject'] = await createCoreSchemas(papiClient);
		await createDimxRelations(client, papiClient);
		await subscriptions(papiClient);
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
		try
		{
			// Switch to hardcoded schemas
			res['resultObject'] = await createCoreSchemas(papiClient);
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
		try 
		{
			// Fix 'accounts' and 'contacts' schemas
			// For more information please see the following:
			// https://pepperi.atlassian.net/browse/DI-22492
			// https://pepperi.atlassian.net/browse/DI-22490
			res['resultObject'] = await createCoreSchemas(papiClient, ["accounts", "contacts"]);
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
		try 
		{

			res['resultObject'] = await createCoreSchemas(papiClient, ["employees", "account_employees"]);
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
		try 
		{

			res['resultObject'] = await createCoreSchemas(papiClient, ["account_employees"]);

		}
		catch (error) 
		{
			res.success = false;
			res['errorMessage'] = error instanceof Error ? error.message : 'Unknown error occurred.';

			return res;
		}
	}

	if(request.body.FromVersion && semverLessThanComparator(request.body.FromVersion, '0.7.26'))
	{
		const papiClient = Helper.getPapiClient(client);
		try 
		{
			// purging schemas with same names as the new ones, which have different types
			await purgeGivenSchemas(papiClient, ['users', 'account_users']);
			await subscriptions(papiClient);
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
	return { success: true, resultObject: {} }
}

async function createCoreSchemas(papiClient: PapiClient, resourcesList: string[] = RESOURCE_TYPES) 
{
	const resObject = { schemas: Array<any>() }

	for (const resource of resourcesList) 
	{
		try 
		{
			resObject.schemas.push(await papiClient.addons.data.schemes.post(resourceNameToSchemaMap[resource]));
		}
		catch (error) 
		{
			throw new Error(`Failed to create schema ${resource}: ${error}`);
		}
	}

	return resObject;
}

async function createDimxRelations(client: Client, papiClient: PapiClient, resourcesList: string[] = RESOURCE_TYPES) 
{
	const isHidden = false;
	await postDimxRelations(client, isHidden, papiClient, resourcesList);
}

async function removeDimxRelations(client: Client, papiClient: PapiClient, resourcesList: string[] = RESOURCE_TYPES) 
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

async function createMissingSchemas(papiClient: PapiClient, client: Client)
{
	const missingSchemas: Array<string> = await getMissingSchemas(papiClient);

	return await createCoreSchemas(papiClient, missingSchemas);
}

async function getMissingSchemas(papiClient: PapiClient)
{
	const existingSchemas = (await papiClient.addons.data.schemes.get({fields: ['Name']})).map(obj => obj.Name);

	const missingSchemas: Array<string> = RESOURCE_TYPES.filter(resource => !existingSchemas.includes(resource));

	return missingSchemas;
}

async function purgeGivenSchemas(papiClient: PapiClient, schemasNames: string[])
{
	for(const schemaName of schemasNames)
	{
		await papiClient.post(`/addons/data/schemes/${schemaName}/purge`);
	}
}

async function subscribeToPNS(pnsService: BasePNSService)
{
	await pnsService.subscribe();
}

async function subscriptions(papiClient: PapiClient)
{
	await subscribeToPNS(new UsersPNSService(papiClient));
	await subscribeToPNS(new ContactsPNSService(papiClient));
	await subscribeToPNS(new AccountUsersPNSService(papiClient));
}
