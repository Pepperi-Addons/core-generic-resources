
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
import { AccountsPapiService, Helper, NUMBER_OF_USERS_ON_IMPORT_REQUEST, RESOURCE_TYPES } from 'core-resources-shared';
import { resourceNameToSchemaMap } from './resourcesSchemas';

export async function install(client: Client, request: Request): Promise<any> 
{
	const res = { success: true };

	const papiClient = Helper.getPapiClient(client);
	try 
	{
		res['resultObject'] = await createCoreSchemas(papiClient);
		await createDimxRelations(client, papiClient);
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

	if(request.body.FromVersion && semverLessThanComparator(request.body.FromVersion, '0.7.1'))
	{
		const papiClient = Helper.getPapiClient(client);
		try 
		{

			res['resultObject'] = await createCoreSchemas(papiClient, ["employees"]);
			await createDimxRelations(client, papiClient, ["employees"]);

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

async function postDimxRelations(client: Client, isHidden: boolean, papiClient: PapiClient, resourcesList: string[]) 
{
	for (const resource of resourcesList) 
	{
		await postDimxImportRelation(client, isHidden, papiClient, resource);
		await postDimxExportRelation(client, isHidden, papiClient, resource);
	}
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

	switch(resource)
	{
	case 'users':
	{
		// Since the creation of users takes a long while, there's a need to limit the number of posted users a single request
		importRelation['MaxPageSize'] = NUMBER_OF_USERS_ON_IMPORT_REQUEST;
		break;
	}		
	case 'account_users':
	{
		importRelation.AddonRelativeURL = '';
		break;
	}

	}

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
		exportRelation.AddonRelativeURL = '';
		// No need for data source export params in account_users.
		// For more details see: https://pepperi.atlassian.net/browse/DI-22222
		exportRelation['DataSourceExportParams'] = {};
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
