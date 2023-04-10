import { Client, Request } from '@pepperi-addons/debug-server'
import { UsersPNSService } from "./services/pns/usersPNS.service";
import { AccountUsersPNSService } from "./services/pns/accountUsersPNS.service";
import { BuildUsersFromContactsService } from './services/builders/buildUsersFromContacts.service';
import { BuildAccountUsersService } from './services/builders/buildAccountUsers.service';
import { BuildAccountBuyersService } from './services/builders/buildAccountBuyers.service';
import { BuildUsersService } from './services/builders/buildUsers.service';
import { AdalHelperService } from './services/adalHelper.service';
import { Helper } from 'core-resources-shared';

export async function update_users(client: Client, request: Request) 
{
	const papiClient = Helper.getPapiClient(client);
	const service = new UsersPNSService(papiClient);
	if (request.method == 'POST') 
	{
		return await service.updateUsers(request.body);
	}
	else
	{
		throw new Error('Bad request');
	}
}

export async function update_users_from_contacts(client: Client, request: Request) 
{
	const papiClient = Helper.getPapiClient(client);
	const service = new UsersPNSService(papiClient);
	if (request.method == 'POST') 
	{
		return await service.updateUsersFromContacts(request.body);
	}
	else
	{
		throw new Error('Bad request');
	}
}

export async function update_account_users(client: Client, request: Request) 
{
	const papiClient = Helper.getPapiClient(client);
	const service = new AccountUsersPNSService(papiClient);
	if (request.method == 'POST') 
	{
		return await service.updateAccountUsers(request.body);
	}
	else
	{
		throw new Error('Bad request');
	}
}

export async function build_users(client: Client, request: Request) 
{
	const papiClient = Helper.getPapiClient(client);
	const service = new BuildUsersService(papiClient);
	if (request.method == 'POST') 
	{
		return await service.buildAdalTable(request.body);
	}
	else
	{
		throw new Error('Bad request');
	}
}

export async function build_users_from_contacts(client: Client, request: Request) 
{
	const papiClient = Helper.getPapiClient(client);
	const service = new BuildUsersFromContactsService(papiClient);
	if (request.method == 'POST')
	{
		return await service.buildAdalTable(request.body);
	}
	else
	{
		throw new Error('Bad request');
	}
}

export async function build_account_users(client: Client, request: Request) 
{
	const papiClient = Helper.getPapiClient(client);
	const service = new BuildAccountUsersService(papiClient);
	if (request.method == 'POST')
	{
		return await service.buildAdalTable(request.body);
	}
	else
	{
		throw new Error('Bad request');
	}
}

export async function build_account_buyers(client: Client, request: Request) 
{
	const papiClient = Helper.getPapiClient(client);
	const service = new BuildAccountBuyersService(papiClient);
	if (request.method == 'POST')
	{
		return await service.buildAdalTable(request.body);
	}
	else
	{
		throw new Error('Bad request');
	}
}

export async function build(client: Client, request: Request) 
{
	const papiClient = Helper.getPapiClient(client);
	const service = new AdalHelperService(papiClient);
	if (request.method == 'POST')
	{
		return await service.build(request.query?.resource);
	}
	else
	{
		throw new Error('Bad request');
	}
}

