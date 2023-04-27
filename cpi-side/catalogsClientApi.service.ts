import { IApiService } from "core-resources-shared";
import BaseClientApiService from "./baseClientApi.service";


export default class CatalogClientApiService extends BaseClientApiService implements IApiService
{
	
	async createResource(resourceName: string, body: any): Promise<any> 
	{
		// Not supported by catalogs in cpi side.
		throw new Error("Method not implemented.");
	}
}
