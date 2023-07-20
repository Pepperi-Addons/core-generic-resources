import { Client, Request } from '@pepperi-addons/debug-server'
import { UsersPNSService } from "./services/pns/usersPNS.service";
import { AccountUsersPNSService } from "./services/pns/accountUsersPNS.service";
import * as Builders from "./services/builders";
import { Helper } from 'core-resources-shared';
import { ExternalUserResourcePNSService } from './services/pns/externalUserResourcePNS.service';
import { BuildManagerService } from './services/buildManager.service';
import { IBuildServiceParams } from './services/builders';
import { TestBody } from './services/integrationTests/entities';
import { BuildTestService } from './services/integrationTests/buildTest.service';
import { BuildManagerTestService } from './services/integrationTests/buildManagerTest.service';
import { AsyncResultObject } from './constants';
import { RegistrationService } from './services/registration.service';

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

export async function update_users_from_external_user_resource(client: Client, request: Request) 
{
	switch(request.method)
	{
	case 'POST':
	{
		const papiClient = Helper.getPapiClient(client);
		const service = new ExternalUserResourcePNSService(papiClient, request.query.resource);
		return await service.updateAdalTable(request.body);
	}
	default:
	{
		throw new Error(`Unsupported method: ${request.method}`);
	}
	}
}

export async function external_user_resource_active_state_changed(client: Client, request: Request) 
{
	switch(request.method)
	{
	case 'POST':
	{
		const papiClient = Helper.getPapiClient(client);
		const service = new ExternalUserResourcePNSService(papiClient, request.query.resource);
		return await service.externalUserResourceActiveStateChanged(request.body);
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

export async function build_users(client: Client, request: Request) : Promise<AsyncResultObject>
{
	return await buildSpecificTable(client, request, Builders.BuildUsersParams);
}

export async function build_users_from_external_user_resource(client: Client, request: Request) 
{
	return await buildSpecificTable(client, request, Builders.BuildUsersFromExternalUserResourceParams);
}

export async function build_account_users(client: Client, request: Request) : Promise<AsyncResultObject>
{
	return await buildSpecificTable(client, request, Builders.BuildAccountUsersParams);
}

export async function build_account_buyers(client: Client, request: Request) : Promise<AsyncResultObject>
{
	return await buildSpecificTable(client, request, Builders.BuildAccountBuyersParams);
}

export async function clean_build_role_roles(client: Client, request: Request): Promise<AsyncResultObject>
{
	return await cleanBuildSpecificTable(client, request, Builders.BuildRoleRolesParams);
}


export async function build(client: Client, request: Request) : Promise<AsyncResultObject> 
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
		 const service = getBuildService(client, buildServiceParams, request);
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
function getBuildService(client: Client, iBuildServiceParams: IBuildServiceParams, request: any): Builders.BaseBuildService
{
	let buildService: Builders.BaseBuildService;
	const papiClient = Helper.getPapiClient(client);

	if(request.body?.IsTest)
	{
		buildService = new BuildTestService(papiClient, iBuildServiceParams, request.body);
	}
	else
	{
		buildService = new Builders.BaseBuildService(papiClient, iBuildServiceParams, request.query.resource);
	}

	return buildService;
}

/**
 * Register given generic-resource as a source for adal users table
 * @param client 
 * @param request 
 * @throws Error if the method is not supported
 * @returns A promise that resolves to the result of the registration
 */
export async function register_for_external_user_resource(client: Client, request: Request) 
{
	switch(request.method)
	{
	case 'POST':
	{
		const papiClient = Helper.getPapiClient(client);
		const service = new RegistrationService(papiClient);
		return await service.registerForExternalUserResource(request.body?.ResourceName);
	}
	default:
	{
		throw new Error(`Unsupported method: ${request.method}`);
	}
	}
}

export async function delete_old_buyers_subscriptions(client: Client, request: Request)
{
	const papiClient = Helper.getPapiClient(client);
	const service = new ExternalUserResourcePNSService(papiClient, "");
	await service.deleteOldBuyersSubscriptions(papiClient);
}
