import { Client, Request } from '@pepperi-addons/debug-server'
import { UsersPNSService } from "./services/pns/usersPNS.service";
import { AccountUsersPNSService } from "./services/pns/accountUsersPNS.service";
import * as Builders from "./services/builders";
import { Helper } from 'core-resources-shared';
import { ContactsPNSService } from './services/pns/contactsPNS.service';
import { BuildManagerService } from './services/buildManager.service';
import { IBuildServiceParams } from './services/builders';

export async function update_users(client: Client, request: Request) 
{
	switch(request.method)
	{
	case 'POST':
	{
		const papiClient = Helper.getPapiClient(client);
		const service = new UsersPNSService(papiClient);
		return await service.updateAdalTable(request.body);
	}
	default:
	{
		throw new Error(`Unsupported method: ${request.method}`);
	}
	}
}

export async function update_users_from_contacts(client: Client, request: Request) 
{
	switch(request.method)
	{
	case 'POST':
	{
		const papiClient = Helper.getPapiClient(client);
		const service = new ContactsPNSService(papiClient);
		return await service.updateAdalTable(request.body);
	}
	default:
	{
		throw new Error(`Unsupported method: ${request.method}`);
	}
	}
}

export async function update_account_users(client: Client, request: Request) 
{
	switch(request.method)
	{
	case 'POST':
	{
		const papiClient = Helper.getPapiClient(client);
		const service = new AccountUsersPNSService(papiClient);
		return await service.updateAdalTable(request.body);
	}
	default:
	{
		throw new Error(`Unsupported method: ${request.method}`);
	}
	}
}

export async function build_users(client: Client, request: Request) 
{
	switch(request.method)
	{
	case 'POST':
	{
		const service = getBuildService(client, Builders.BuildUsersParams);
		return await service.buildAdalTable(request.body);
	}
	default:
	{
		throw new Error(`Unsupported method: ${request.method}`);
	}
	}
}

export async function build_users_from_contacts(client: Client, request: Request) 
{
	switch(request.method)
	{
	case 'POST':
	{
		const service = getBuildService(client, Builders.BuildUsersFromContactsParams);
		return await service.buildAdalTable(request.body);
	}
	default:
	{
		throw new Error(`Unsupported method: ${request.method}`);
	}
	}
}

export async function build_account_users(client: Client, request: Request) 
{
	switch(request.method)
	{
	case 'POST':
	{
		const service = getBuildService(client, Builders.BuildAccountUsersParams);
		return await service.buildAdalTable(request.body);
	}
	default:
	{
		throw new Error(`Unsupported method: ${request.method}`);
	}
	}
}

export async function build_account_buyers(client: Client, request: Request) 
{
	switch(request.method)
	{
	case 'POST':
	{
		const service = getBuildService(client, Builders.BuildAccountBuyersParams);
		return await service.buildAdalTable(request.body);
	}
	default:
	{
		throw new Error(`Unsupported method: ${request.method}`);
	}
	}
}

export async function build_role_roles(client: Client, request: Request)
{
	switch
	(request.method)
	{
	case 'POST':
	{
		const service = getBuildService(client, Builders.BuildRoleRolesParams);
		return await service.buildAdalTable(request.body);
	}
	default:
	{
		throw new Error(`Unsupported method: ${request.method}`);
	}
	}
}


export async function build(client: Client, request: Request) 
{
	switch(request.method)
	{
	case 'POST':
	{
		const papiClient = Helper.getPapiClient(client);
		const service = new BuildManagerService(papiClient);
		return await service.build(request.query?.resource);
	}
	default:
	{
		throw new Error(`Unsupported method: ${request.method}`);
	}
	}
}

function getBuildService(client: Client, iBuildServiceParams: IBuildServiceParams): Builders.BuildService
{
	const papiClient = Helper.getPapiClient(client);
	const buildServiceParams: Builders.IBuildServiceParams = iBuildServiceParams;
	const service = new Builders.BuildService(papiClient, buildServiceParams);
	return service;
}
