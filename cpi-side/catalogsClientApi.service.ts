import { IApiService } from "core-resources-shared";
import { GetParams, GetResult, SearchParams } from "@pepperi-addons/client-api"
import AClientApiService from "./aClientApi.service";

export default class CatalogClientApiService extends AClientApiService implements IApiService
{
    createResource(resourceName: string, body: any): {} {
        // Not supported by catalogs in cpi side.
        throw new Error("Method not implemented.");
    }
    getResources(resourceName: string, query: string, whereClause: string | undefined): {} {
        // Not implemented in cpi-side.
        // Cpi-side uses Search.
        throw new Error("Method not implemented.");
    }
    async getResourceByKey(resourceName: string, key: string, whereClause: undefined): Promise<any> {
        const schemaFields = await this.getRequestedFields(resourceName);

        const getParams: GetParams<string> = {
            key: {
                UUID: key
            }, 
            fields: schemaFields
        };

        const getResult: GetResult<string> = await pepperi.api.catalogs.get(getParams);
        
        return getResult.object

    }

    getResourceByUniqueField(resourceName: string, uniqueFieldId: string, value: string, whereClause: undefined): {} {
        throw new Error("Method not implemented.");
    }

    async searchResource(resourceName: string, body: any): {} {
    }
    getAccountTypeDefinitionID(): Promise<any> {
        // Not needed in catalog
        throw new Error("Method not implemented.");
    }
}
