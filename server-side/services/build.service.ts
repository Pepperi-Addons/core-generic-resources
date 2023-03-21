import { Helper, CORE_ADDON_UUID } from 'core-resources-shared';
import { AddonDataScheme, PapiClient, SchemeField } from '@pepperi-addons/papi-sdk';
import { Client } from '@pepperi-addons/debug-server';
import { ResourceHelperService } from './resourceHelper.service';

export class BuildService {
    papiClient: PapiClient;
    resourceHelperService: ResourceHelperService;
    currentPage: number = 1;
    pageSize: number = 500;

    constructor(client: Client) {
        this.papiClient = Helper.getPapiClient(client);
        this.resourceHelperService = new ResourceHelperService(client);
    }

    // TODO: split this class to usersBuild and accountUsersBuild

    async buildDataForAdal(resource, currentPages: number[]) {
        const res = { success: true };
        try {
            let results: any[];
            do {
                const fields = await this.resourceHelperService.buildRequestedFields(resource);
                results = await this.getSinglePageOfObjects(resource, fields, this.currentPage);
                this.currentPage++;
                // fix results and push to adal
            } while(results.length == this.pageSize);
        }
        catch (error) {
            res.success = false;
            res['errorMessage'] = error;
        }

        return res;
    }

    async getSinglePageOfObjects(resource: string, fields: string, page: number, pageSize: number = 500) {
        return await this.papiClient.post(`/${resource}/search`,{
            Fields: `${fields}`,
            PageSize: pageSize,
            Page: page
        });
    }

    async build() {
        //return this.papiClient.addons.api.uuid('').async().file('adal').func('build_data_for_adal').post({retry: 20},{})
    }
}