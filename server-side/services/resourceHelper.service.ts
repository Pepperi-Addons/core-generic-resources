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

    async getByKeys(keys: string[], resource: string) {
        return await this.papiClient.addons.data.search.uuid(config.AddonUUID).table(resource).post({KeyList: keys});
    }

    replaceUUIDWithKey(user) {
        user["Key"] = user["UUID"];
        delete user["UUID"];
    }

}