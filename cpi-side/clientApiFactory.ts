import { IApiService } from "core-resources-shared";
import CatalogClientApiService from "./catalogsClientApi.service";

export default class ClientApiFactory
{
    public static getClientApi(resourceName: string): IApiService
    {
        switch(resourceName)
        {
            case 'catalogs':
                {
                    return new CatalogClientApiService();
                }
            default:
                {
                    throw new Error(`Requested resource '${resourceName}' is not supported.`);
                }
        }
    }
}
