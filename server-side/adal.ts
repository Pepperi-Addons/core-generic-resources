import { Client, Request } from '@pepperi-addons/debug-server'
import { UsersPNSService } from "./services/usersPns.service";
import { AccountUsersPNSService } from "./services/accountUsersPns.service";

export async function update_users(client: Client, request: Request) {
    const service = new UsersPNSService(client);
    if (request.method == 'POST') {
        return await service.updateUsers(request.body);
    }
    else{
        throw new Error('Bad request');
    }
};

export async function update_users_from_contacts(client: Client, request: Request) {
    const service = new UsersPNSService(client);
    if (request.method == 'POST') {
        return await service.updateUsersFromContacts(request.body);
    }
    else{
        throw new Error('Bad request');
    }
};

export async function update_account_users(client: Client, request: Request) {
    const service = new AccountUsersPNSService(client);
    if (request.method == 'POST') {
        return await service.updateAccountUsers(request.body);
    }
    else{
        throw new Error('Bad request');
    }
};