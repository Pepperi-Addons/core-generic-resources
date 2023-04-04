import { Client, Request } from '@pepperi-addons/debug-server'
import { UsersPNSService } from "./services/usersPns.service";
import { AccountUsersPNSService } from "./services/accountUsersPns.service";
import { BuildUsersService } from './services/buildUsers.service';
import { BuildUsersFromContactsService } from './services/buildUsersFromContacts.service';
import { BuildAccountUsersService } from './services/buildAccountUsers.service';
import { BuildAccountBuyersService } from './services/buildAccountBuyers.service';
import { AdalHelperService } from './services/adalHelper.service';

export async function update_users(client: Client, request: Request) 
{
	const service = new UsersPNSService(client);
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
	const service = new UsersPNSService(client);
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
	const service = new AccountUsersPNSService(client);
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
	const service = new BuildUsersService(client);
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
	const service = new BuildUsersFromContactsService(client);
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
	const service = new BuildAccountUsersService(client);
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
	const service = new BuildAccountBuyersService(client);
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
	const service = new AdalHelperService(client);
	if (request.method == 'POST')
	{
		return await service.build(request.query?.resource);
	}
	else
	{
		throw new Error('Bad request');
	}
}

