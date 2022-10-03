
/*
The return object format MUST contain the field 'success':
{success:true}

If the result of your code is 'false' then return:
{success:false, erroeMessage:{the reason why it is false}}
The error Message is importent! it will be written in the audit log and help the user to understand what happen
*/

import { Client, Request } from '@pepperi-addons/debug-server'
import { PapiClient, Relation } from '@pepperi-addons/papi-sdk';
import { NUMBER_OF_USERS_ON_IMPORT_REQUEST, RESOURCE_TYPES } from './constants';
import { Helper } from './helper';

export async function install(client: Client, request: Request): Promise<any> 
{
	const res = { success: true };
	
	const papiClient = Helper.getPapiClient(client);
	try
	{
		res['resultObject'] = await createCoreSchemas(papiClient, client);
		// Since we are waiting for https://pepperi.atlassian.net/browse/DI-21107
		// to implement https://pepperi.atlassian.net/browse/DI-21113
		// It was decided that for the time being DIMX won't be supported.
		// await createDimxRelations(client, papiClient);
	}
	catch(error)
	{
		res.success = false;
		res['errorMessage'] = error;
	}

	return res;
}

export async function uninstall(client: Client, request: Request): Promise<any> 
{
	const res = { success: true };

	// Since we are waiting for https://pepperi.atlassian.net/browse/DI-21107
	// to implement https://pepperi.atlassian.net/browse/DI-21113
	// It was decided that for the time being DIMX won't be supported.
	
	// const papiClient = Helper.getPapiClient(client);
	// try
	// {
	// 	await removeDimxRelations(client, papiClient);
	// }
	// catch(error)
	// {
	// 	res.success = false;
	// 	res['errorMessage'] = error;
	// }

	return res;
}

export async function upgrade(client: Client, request: Request): Promise<any> 
{
	return {success:true,resultObject:{}}
}

export async function downgrade(client: Client, request: Request): Promise<any> 
{
	return {success:true,resultObject:{}}
}

async function createCoreSchemas(papiClient: PapiClient, client: Client)
{
	const resObject = { schemas: Array<any>() }

	for (const resource of RESOURCE_TYPES)
	{
		const schemaBody = {
			Name: resource,
			Type: 'papi',
		};
		try
		{
			resObject.schemas.push(await papiClient.post(`/addons/data/schemes`, schemaBody));
		}
		catch(error)
		{
			throw new Error(`Failed to create schema ${resource}: ${error}`);
		}
	}

	return resObject;
}

async function createDimxRelations(client: Client, papiClient: PapiClient)
{
	const isHidden = false;
	await postDimxRelations(client, isHidden, papiClient);
}

async function removeDimxRelations(client: Client, papiClient: PapiClient)
{
	const isHidden = true;
	await postDimxRelations(client, isHidden, papiClient);
}

async function postDimxRelations(client: Client, isHidden: boolean, papiClient: PapiClient) 
{
	for (const resource of RESOURCE_TYPES) 
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

		// Since the creation of users takes a long while, there's a need to limit the number of posted users a single request
		if (resource === 'users') 
		{
			importRelation['MaxPageSize'] = NUMBER_OF_USERS_ON_IMPORT_REQUEST;
		}

		const exportRelation: Relation = {
			RelationName: "DataExportResource",
			AddonUUID: client.AddonUUID,
			AddonRelativeURL: '',
			Name: resource,
			Type: 'AddonAPI',
			Source: 'papi',
			Hidden: isHidden
		};

		await upsertRelation(papiClient, importRelation);
		await upsertRelation(papiClient, exportRelation);
	}
}

async function upsertRelation(papiClient: PapiClient, relation: Relation) 
{
	return papiClient.post('/addons/data/relations', relation);
}
