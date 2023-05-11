import { Client, Request } from '@pepperi-addons/debug-server'
import { UsersPNSService } from "./services/pns/usersPNS.service";
import { AccountUsersPNSService } from "./services/pns/accountUsersPNS.service";
import * as Builders from "./services/builders";
import { Helper } from 'core-resources-shared';
import { ContactsPNSService } from './services/pns/contactsPNS.service';
import { BuildManagerService } from './services/buildManager.service';

export async function update_users(client: Client, request: Request) 
{
	if (request.method == 'POST') 
	{
		const papiClient = Helper.getPapiClient(client);
		const service = new UsersPNSService(papiClient);
		return await service.updateAdalTable(request.body);
	}
	else
	{
		throw new Error('Bad request');
	}
}

export async function update_users_from_contacts(client: Client, request: Request) 
{
	if (request.method == 'POST') 
	{
		const papiClient = Helper.getPapiClient(client);
		const service = new ContactsPNSService(papiClient);
		return await service.updateAdalTable(request.body);
	}
	else
	{
		throw new Error('Bad request');
	}
}

export async function update_account_users(client: Client, request: Request) 
{
	if (request.method == 'POST') 
	{
		const papiClient = Helper.getPapiClient(client);
		const service = new AccountUsersPNSService(papiClient);
		return await service.updateAdalTable(request.body);
	}
	else
	{
		throw new Error('Bad request');
	}
}

export async function build_users(client: Client, request: Request) 
{
	if (request.method == 'POST') 
	{
		const papiClient = Helper.getPapiClient(client);
		const buildServiceParams: Builders.IBuildServiceParams = Builders.BuildUsersParams;
		const service = new Builders.BuildService(papiClient, buildServiceParams);
		return await service.buildAdalTable(request.body);
	}
	else
	{
		throw new Error('Bad request');
	}
}

export async function build_users_from_contacts(client: Client, request: Request) 
{
	if (request.method == 'POST')
	{
		const papiClient = Helper.getPapiClient(client);
		const buildServiceParams: Builders.IBuildServiceParams = Builders.BuildUsersFromContactsParams;
		const service = new Builders.BuildService(papiClient, buildServiceParams);
		return await service.buildAdalTable(request.body);
	}
	else
	{
		throw new Error('Bad request');
	}
}

export async function build_account_users(client: Client, request: Request) 
{
	if (request.method == 'POST')
	{
		const papiClient = Helper.getPapiClient(client);
		const buildServiceParams: Builders.IBuildServiceParams = Builders.BuildAccountUsersParams;
		const service = new Builders.BuildService(papiClient, buildServiceParams);
		return await service.buildAdalTable(request.body);
	}
	else
	{
		throw new Error('Bad request');
	}
}

export async function build_account_buyers(client: Client, request: Request) 
{
	if (request.method == 'POST')
	{
		const papiClient = Helper.getPapiClient(client);
		const buildServiceParams: Builders.IBuildServiceParams = Builders.BuildAccountBuyersParams;
		const service = new Builders.BuildService(papiClient, buildServiceParams);
		return await service.buildAdalTable(request.body);
	}
	else
	{
		throw new Error('Bad request');
	}
}

export async function build_role_roles(client: Client, request: Request)
{
	if (request.method == 'POST')
	{
		const papiClient = Helper.getPapiClient(client);
		const buildServiceParams: Builders.IBuildServiceParams = Builders.BuildRoleRolesParams;
		const service = new Builders.BuildService(papiClient, buildServiceParams);
		return await service.buildAdalTable(request.body);
	}
	else
	{
		throw new Error('Bad request');
	}
}

export async function build(client: Client, request: Request) 
{
	if (request.method == 'POST')
	{
		const papiClient = Helper.getPapiClient(client);
		const service = new BuildManagerService(papiClient);
		return await service.build(request.query?.resource);
	}
	else
	{
		throw new Error('Bad request');
	}
}

