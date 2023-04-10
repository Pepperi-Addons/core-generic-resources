import { Client, Request } from '@pepperi-addons/debug-server';
import { AccountsPapiService, CoreServiceFactory, Helper, IApiService, PapiService } from 'core-resources-shared'
import { TsaService } from './tsa-service/tsa.service';

// #region get by key
export async function get_items_by_key(client: Client, request: Request) 
{
	return await resourcesFunctionAdapter(client, request, "items");
}

export async function get_accounts_by_key(client: Client, request: Request) 
{
	return await resourcesFunctionAdapter(client, request, "accounts");
}

export async function get_users_by_key(client: Client, request: Request) 
{
	return await resourcesFunctionAdapter(client, request, "users");
}

export async function get_catalogs_by_key(client: Client, request: Request) 
{
	return await resourcesFunctionAdapter(client, request, "catalogs");
}

export async function get_account_users_by_key(client: Client, request: Request) 
{
	return await resourcesFunctionAdapter(client, request, "account_users");
}

export async function get_contacts_by_key(client: Client, request: Request) 
{
	return await resourcesFunctionAdapter(client, request, "contacts");
}

export async function get_employees_by_key(client: Client, request: Request) 
{
	return await resourcesFunctionAdapter(client, request, "employees");
}
// #endregion

// #region GET/POST

export async function items(client: Client, request: Request) 
{
	return await resourcesFunctionAdapter(client, request, "items");
}

export async function accounts(client: Client, request: Request) 
{
	return await resourcesFunctionAdapter(client, request, "accounts");
}

export async function users(client: Client, request: Request) 
{
	return await resourcesFunctionAdapter(client, request, "users");
}

export async function catalogs(client: Client, request: Request) 
{
	return await resourcesFunctionAdapter(client, request, "catalogs");
}

export async function account_users(client: Client, request: Request) 
{
	return await resourcesFunctionAdapter(client, request, "account_users");
}

export async function contacts(client: Client, request: Request) 
{
	return await resourcesFunctionAdapter(client, request, "contacts");
}

export async function employees(client: Client, request: Request) 
{
	return await resourcesFunctionAdapter(client, request, "employees");
}
// #endregion

// #region get by unique field
export async function get_items_by_unique_field(client: Client, request: Request) 
{
	return await getByUniqueFieldFunctionAdapter(client, request, "items");
}

export async function get_accounts_by_unique_field(client: Client, request: Request) 
{
	return await getByUniqueFieldFunctionAdapter(client, request, "accounts");
}

export async function get_users_by_unique_field(client: Client, request: Request) 
{
	return await getByUniqueFieldFunctionAdapter(client, request, "users");
}

export async function get_catalogs_by_unique_field(client: Client, request: Request) 
{
	return await getByUniqueFieldFunctionAdapter(client, request, "catalogs");
}

export async function get_account_users_by_unique_field(client: Client, request: Request) 
{
	return await getByUniqueFieldFunctionAdapter(client, request, "account_users");
}

export async function get_contacts_by_unique_field(client: Client, request: Request) 
{
	return await getByUniqueFieldFunctionAdapter(client, request, "contacts");
}

export async function get_employees_by_unique_field(client: Client, request: Request) 
{
	return await getByUniqueFieldFunctionAdapter(client, request, "employees");
}

async function getByUniqueFieldFunctionAdapter(client: Client, request: Request, resourceName: string)
{
	return genericAdapter(client, request, resourceName, get_by_unique_field);
}
// #endregion

// #region search
export async function items_search(client: Client, request: Request) 
{
	return await searchFunctionAdapter(client, request, "items");
}

export async function accounts_search(client: Client, request: Request) 
{
	return await searchFunctionAdapter(client, request, "accounts");
}

export async function users_search(client: Client, request: Request) 
{
	return await searchFunctionAdapter(client, request, "users");
}

export async function catalogs_search(client: Client, request: Request) 
{
	return await searchFunctionAdapter(client, request, "catalogs");
}

export async function account_users_search(client: Client, request: Request) 
{
	return await searchFunctionAdapter(client, request, "account_users");
}

export async function contacts_search(client: Client, request: Request) 
{
	return await searchFunctionAdapter(client, request, "contacts");
}

export async function employees_search(client: Client, request: Request) 
{
	return await searchFunctionAdapter(client, request, "employees");
}

async function searchFunctionAdapter(client: Client, request: Request, resourceName: string)
{
	return genericAdapter(client, request, resourceName, search);
}
// #endregion

export async function handle_tsa_creation(client: Client, request: Request)
{
	console.log('Handling TSA creation');

	const papiClient = Helper.getPapiClient(client);
	const tsaService = new TsaService(papiClient);

	const modifiedObjectKeys = request.body.Message?.ModifiedObjects?.map(modifiedObject => modifiedObject?.ObjectKey);
	return await tsaService.createTsaFieldsOnSchemas(modifiedObjectKeys);
}

export async function handle_tsa_modifications(client: Client, request: Request)
{
	console.log('Handling TSA modifications');

	const papiClient = Helper.getPapiClient(client);
	const tsaService = new TsaService(papiClient);

	const modifiedObjects: { Key: string; OldName: string; }[] = request.body.Message?.ModifiedObjects?.map(modifiedObject => 
		({ Key: modifiedObject?.ObjectKey, OldName: modifiedObject?.ModifiedFields[0].OldValue }
	));

	return await tsaService.modifyTsaFieldsOnSchemas(modifiedObjects);
}

async function resourcesFunctionAdapter(client: Client, request: Request, resourceName: string)
{
	return genericAdapter(client, request, resourceName, resources);
}

async function genericAdapter(client: Client, request: Request, resourceName: string, adaptedFunction: (client: Client, request: Request) => Promise<any>)
{
	const requestCopy = {...request};
	requestCopy.query.resource_name = resourceName;
	return adaptedFunction(client, requestCopy);
}

async function resources(client: Client, request: Request) 
{
	console.log(`Query received: ${JSON.stringify(request.query)}`);

	switch (request.method) 
	{
	case "GET":
	{
		const coreService = getCoreService(client, request);

		if(request.query.key)
		{
			return await coreService.getResourceByKey();
		}
		else
		{
			return await coreService.getResources();
		}
	}
	case "POST":
	{
		const coreService = getCoreService(client, request);
		return await coreService.createResource();
	}
	default:
	{
		throw new Error(`Unsupported method: ${request.method}`);
	}
	}
}

async function get_by_unique_field(client: Client, request: Request) 
{
	console.log(`Query received: ${JSON.stringify(request.query)}`);

	switch (request.method) 
	{
	case "GET":
	{
		const coreService = getCoreService(client, request);
		return await coreService.getResourceByUniqueField();
	}
	default:
	{
		throw new Error(`Unsupported method: ${request.method}`);
	}
	}
}

async function search(client: Client, request: Request) 
{
	console.log(`Query received: ${JSON.stringify(request.query)}`);

	switch (request.method) 
	{
	case "POST":
	{
		const coreService = getCoreService(client, request);
		return coreService.search();
	}
	default:
	{
		throw new Error(`Unsupported method: ${request.method}`);
	}
	}
}

function getCoreService(client: Client, request: Request)
{
	const papiService = getPapiService(client, request);
	const core = CoreServiceFactory.getCoreService(request.query?.resource_name, request, papiService);
	return core;
}

function getPapiService(client: Client, request: Request): IApiService
{
	const papiClient = Helper.getPapiClient(client);
	switch(request.query?.resource_name)
	{
	case('accounts'):
	{
		return new AccountsPapiService(papiClient);
	}
	default:
	{
		return new PapiService(papiClient);
	}
	}
}
