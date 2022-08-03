import { Client, Request } from '@pepperi-addons/debug-server';
import CoreService from './core.service';
import { Helper } from './helper';
import PapiService from './papi.service';

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

async function searchFunctionAdapter(client: Client, request: Request, resourceName: string)
{
	return genericAdapter(client, request, resourceName, search);
}
// #endregion



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
	const papiService = getPapiService(client);
	const core = new CoreService(request.query?.resource_name, request, papiService);
	return core;
}

function getPapiService(client: Client) 
{
	const papiClient = Helper.getPapiClient(client);
	const papiService = new PapiService(papiClient);
	return papiService;
}