import { PNSService } from "./services/pns.service";
import { Client, Request } from '@pepperi-addons/debug-server'

export async function update_users(client: Client, request: Request) {
    const service = new PNSService(client);
    if (request.method == 'POST') {
        return await service.updateUsers(request.body);
    }
    else{
        throw new Error('Bad request');
    }
};

export async function update_users_from_contacts(client: Client, request: Request) {
    const service = new PNSService(client);
    if (request.method == 'POST') {
        return await service.updateUsersFromContacts(request.body);
    }
    else{
        throw new Error('Bad request');
    }
};