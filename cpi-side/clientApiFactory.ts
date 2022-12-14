import { IApiService } from "core-resources-shared";
import BaseClientApiService from "./baseClientApi.service";
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
			return new BaseClientApiService();
		}
		}
	}
}
