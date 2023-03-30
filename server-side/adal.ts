import { Client, Request } from '@pepperi-addons/debug-server'
import { UsersPNSService } from "./services/usersPns.service";
import { AccountUsersPNSService } from "./services/accountUsersPns.service";
import { BuildService } from './services/build.service';
import { BuildUsersService } from './services/buildUsers.service';

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

export async function build_users_table(client: Client, request: Request) 
{
	const service = new BuildUsersService(client);
	if (request.method == 'POST') 
	{
		return await service.buildAdalTable(request.body.CurrentPages[0], request.body.CurrentPages[1]);
	}
	else
	{
		throw new Error('Bad request');
	}
}

// export async function build(client: Client, request: Request) 
// {
// 	const service = new BuildService(client);
// 	if (request.method == 'POST') 
// 	{
// 		return await service.build();
// 	}
// 	else
// 	{
// 		throw new Error('Bad request');
// 	}
// }

