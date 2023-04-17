import { Client, Request } from '@pepperi-addons/debug-server'
import { UsersPNSService } from "./services/pns/usersPNS.service";
import { AccountUsersPNSService } from "./services/pns/accountUsersPNS.service";
import { BuildUsersFromContactsService } from './services/builders/buildUsersFromContacts.service';
import { BuildAccountUsersService } from './services/builders/buildAccountUsers.service';
import { BuildAccountBuyersService } from './services/builders/buildAccountBuyers.service';
import { BuildUsersService } from './services/builders/buildUsers.service';
import { BuildManagerService } from './services/buildManager.service';
import { Helper } from 'core-resources-shared';
import { ContactsPNSService } from './services/pns/contactsPNS';

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
		const service = new BuildUsersService(papiClient);
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
		const service = new BuildUsersFromContactsService(papiClient);
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
		const service = new BuildAccountUsersService(papiClient);
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
		const service = new BuildAccountBuyersService(papiClient);
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

