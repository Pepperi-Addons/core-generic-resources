
/*
The return object format MUST contain the field 'success':
{success:true}

If the result of your code is 'false' then return:
{success:false, erroeMessage:{the reason why it is false}}
The error Message is importent! it will be written in the audit log and help the user to understand what happen
*/

import { Client, Request } from '@pepperi-addons/debug-server'
import { PapiClient, Relation } from '@pepperi-addons/papi-sdk';
import semver from 'semver';
import { Helper, NUMBER_OF_USERS_ON_IMPORT_REQUEST, RESOURCE_TYPES } from 'core-resources-shared';

export async function install(client: Client, request: Request): Promise<any> 
{
	const res = { success: true };

	const papiClient = Helper.getPapiClient(client);
	try 
	{
		res['resultObject'] = await createCoreSchemas(papiClient);
		// Since we are waiting for https://pepperi.atlassian.net/browse/DI-21107
		// to implement https://pepperi.atlassian.net/browse/DI-21113
		// It was decided that for the time being DIMX won't be supported.
		// await createDimxRelations(client, papiClient);
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
	const res = { success: true };

	if (request.body.FromVersion && semver.compare(request.body.FromVersion, '0.6.5') < 0) 
	{
		const papiClient = Helper.getPapiClient(client);
		try 
		{
			// We need to re-upsert all schemas to pass Sync: true.
			res['resultObject'] = await createCoreSchemas(papiClient);
		}
		catch (error) 
		{
	
			res.success = false;
			res['errorMessage'] = error instanceof Error ? error.message : 'Unknown error occurred.';
		}
	}

	if (res.success && request.body.FromVersion && semver.compare(request.body.FromVersion, '0.6.0') < 0) 
	{
		try
		{
			res['resultObject'] = await createMissingSchemas(Helper.getPapiClient(client), client);
		}
		catch (error) 
		{
			res.success = false;
			res['errorMessage'] = error instanceof Error ? error.message : 'Unknown error occurred.';
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
		let schemaBody: any = {
			Name: resource,
			Type: 'papi',
			SyncData:
			{
				Sync: true,
			},
		};

		if (resource === 'account_users') 
		{
			schemaBody = addAccountUsersSpecificFields(schemaBody);
		}
		try 
		{
			resObject.schemas.push(await papiClient.post(`/addons/data/schemes`, schemaBody));
		}
		catch (error) 
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

function addAccountUsersSpecificFields(schemaBody: any): any 
{
	const alteredSchema = { ...schemaBody };
	alteredSchema.Fields =
	{
		Account:
		{
			Type: "Object",
			"Fields":
			{
				Data:
				{
					Type: "Object",
					"Fields":
					{
						InternalID:
						{
							Type: "Integer"
						},
						UUID:
						{
							Type: "String"
						},
						ExternalID:
						{
							Type: "String"
						}
					}
				},
				URI:
				{
					Type: "String"
				}
			}
		},
		User:
		{
			Type: "Object",
			"Fields":
			{
				Data:
				{
					Type: "Object",
					"Fields":
					{
						InternalID:
						{
							Type: "Integer"
						},
						UUID:
						{
							Type: "String"
						},
						ExternalID:
						{
							Type: "String"
						}
					}
				},
				URI:
				{
					Type: "String"
				}
			}
		}
	};

	return alteredSchema;
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
