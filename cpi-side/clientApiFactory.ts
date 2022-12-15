import { IApiService } from "core-resources-shared";
import AccountsClientApiService from "./accountsClientApi.service";
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
		case 'accounts':
		{
			return new AccountsClientApiService();
		}
		default:
		{
			return new BaseClientApiService();
		}
		}
	}
}
