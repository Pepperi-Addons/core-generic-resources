import { PapiClient } from '@pepperi-addons/papi-sdk';
import { Client } from '@pepperi-addons/debug-server';
import config from '../../addon.config.json';
import { AccountUser, User } from '../models/resources';

export class ResourceHelperService {

    papiClient: PapiClient

    constructor(private client: Client) {
        this.papiClient = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
            addonUUID: client.AddonUUID,
            addonSecretKey: client.AddonSecretKey,
            actionUUID: client.ActionUUID
        });
    }

    async upsert(objects: any[], resource: string) {
        return await this.papiClient.post(`/addons/data/batch/${config.AddonUUID}/${resource}`, {Objects: objects});
    }

    async getByKey(key: string, resource: string) {
        const table = this.papiClient.addons.data.uuid(config.AddonUUID).table(resource);
        return await table.key(key).get();
    }

    replaceUUIDWithKey(user) {
        user["Key"] = user["UUID"];
        delete user["UUID"];
    }

}