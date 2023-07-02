import { Client, Request } from '@pepperi-addons/debug-server'
import { UsersPNSService } from "./services/pns/usersPNS.service";
import { AccountUsersPNSService } from "./services/pns/accountUsersPNS.service";
import * as Builders from "./services/builders";
import { Helper } from 'core-resources-shared';
import { BuyersPNSService } from './services/pns/buyersPNS.service';
import { BuildManagerService } from './services/buildManager.service';
import { IBuildServiceParams } from './services/builders';
import { TestBody } from './services/integrationTests/entities';
import { BuildTestService } from './services/integrationTests/buildTest.service';
import { BuildManagerTestService } from './services/integrationTests/buildManagerTest.service';
import { AsyncResultObject } from './constants';

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

export async function update_users_from_buyers(client: Client, request: Request) 
{
	switch(request.method)
	{
	case 'POST':
	{
		const papiClient = Helper.getPapiClient(client);
		const service = new BuyersPNSService(papiClient);
		return await service.updateAdalTable(request.body);
	}
	default:
	{
		throw new Error(`Unsupported method: ${request.method}`);
	}
	}
}

export async function buyers_active_state_changed(client: Client, request: Request) 
{
	switch(request.method)
	{
	case 'POST':
	{
		const papiClient = Helper.getPapiClient(client);
		const service = new BuyersPNSService(papiClient);
		return await service.buyersActiveStateChanged(request.body);
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

export async function build_users(client: Client, request: Request): Promise<AsyncResultObject>
{
	return await buildSpecificTable(client, request, Builders.BuildUsersParams);
}

export async function build_users_from_buyers(client: Client, request: Request) 
{
	return await buildSpecificTable(client, request, Builders.BuildUsersFromBuyersParams);
}

export async function build_account_users(client: Client, request: Request) : Promise<AsyncResultObject>
{
	return await buildSpecificTable(client, request, Builders.BuildAccountUsersParams);
}

export async function build_account_buyers(client: Client, request: Request) 
{
	return await buildSpecificTable(client, request, Builders.BuildAccountBuyersParams);
}

export async function clean_build_role_roles(client: Client, request: Request): Promise<AsyncResultObject>
{
	return await cleanBuildSpecificTable(client, request, Builders.BuildRoleRolesParams);
}


export async function build(client: Client, request: Request): Promise<AsyncResultObject> 
{
	switch(request.method)
	{
	case 'POST':
	{
		const papiClient = Helper.getPapiClient(client);
		let service: BuildManagerService;
		if(request.body?.IsTest)
		{
			service = new BuildManagerTestService(papiClient, request.body);
		}
		else
		{
			service = new BuildManagerService(papiClient);
		}

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
async function buildSpecificTable(client: Client, request: Request, buildServiceParams: Builders.IBuildServiceParams): Promise<AsyncResultObject>
{
	 switch (request.method)
	 {
	 case 'POST':
	 {
		 const service = getBuildService(client, buildServiceParams, request.body);
		 return await service.buildAdalTable(request.body);
	 }
	 default:
	 {
		 throw new Error(`Unsupported method: ${request.method}`);
	 }
	 }
}
/**
 * Clear and then build a specific table, based on the passed buildServiceParams
 * @param client 
 * @param request 
 * @param buildServiceParams 
 * @throws Error if the method is not supported
 * @returns A promise that resolves to the result of the build
 */
async function cleanBuildSpecificTable(client: Client, request: Request, buildServiceParams: Builders.IBuildServiceParams): Promise<AsyncResultObject>
{
	  switch (request.method)
	  {
	  case 'POST':
	  {
		  const service = getBuildService(client, buildServiceParams, request.body);
		  return await service.cleanBuildAdalTable(request.body);
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
function getBuildService(client: Client, iBuildServiceParams: IBuildServiceParams, requestBody: TestBody): Builders.BaseBuildService
{
	let buildService: Builders.BaseBuildService;
	const papiClient = Helper.getPapiClient(client);

	if(requestBody?.IsTest)
	{
		buildService = new BuildTestService(papiClient, iBuildServiceParams, requestBody);
	}
	else
	{
		buildService = new Builders.BaseBuildService(papiClient, iBuildServiceParams);
	}

	return buildService;
}
