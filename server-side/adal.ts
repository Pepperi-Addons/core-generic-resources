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
	return await buildSpecificTable(client, request, Builders.BuildUsersParams);
}

export async function build_users_from_contacts(client: Client, request: Request) 
{
	return await buildSpecificTable(client, request, Builders.BuildUsersFromContactsParams);
}

export async function build_account_users(client: Client, request: Request) 
{
	return await buildSpecificTable(client, request, Builders.BuildAccountUsersParams);
}

export async function build_account_buyers(client: Client, request: Request) 
{
	return await buildSpecificTable(client, request, Builders.BuildAccountBuyersParams);
}

export async function build_role_roles(client: Client, request: Request)
{
	return await buildSpecificTable(client, request, Builders.BuildRoleRolesParams);
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

/**
 * Build a specific table, based on the passed buildServiceParams
 * @param client 
 * @param request 
 * @param buildServiceParams 
 * @throws Error if the method is not supported
 * @returns A promise that resolves to the result of the build
 */
 async function buildSpecificTable(client: Client, request: Request, buildServiceParams: Builders.IBuildServiceParams): Promise<any>
 {
	 switch (request.method)
	 {
	 case 'POST':
	 {
		 const service = getBuildService(client, buildServiceParams);
		 return await service.buildAdalTable(request.body);
	 }
	 default:
	 {
		 throw new Error(`Unsupported method: ${request.method}`);
	 }
	 }
 }

/**
 * Returns a build service, based on the passed buildServiceParams
 * @param client 
 * @param iBuildServiceParams 
 * @returns {Builders.BuildService} - A build service
 */
function getBuildService(client: Client, iBuildServiceParams: IBuildServiceParams): Builders.BuildService
{
	const papiClient = Helper.getPapiClient(client);
	const buildServiceParams: Builders.IBuildServiceParams = iBuildServiceParams;
	const service = new Builders.BuildService(papiClient, buildServiceParams);
	return service;
}
