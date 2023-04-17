import { IApiService } from "core-resources-shared";
import BaseClientApiService from "./baseClientApi.service";


export default class CatalogClientApiService extends BaseClientApiService implements IApiService
{
	
	async createResource(resourceName: string, body: any): Promise<any> 
	{
		// Not supported by catalogs in cpi side.
		throw new Error("Method not implemented.");
	}

	async batchUpsert(resourceName: string, objects: Array<any>): Promise<Array<any>>
	{
		throw new Error('Not supported');
	}
}
