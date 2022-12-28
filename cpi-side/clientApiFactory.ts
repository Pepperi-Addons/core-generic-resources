import { AccountsPapiService, IApiService } from "core-resources-shared";
import OfflineAccountsClientApiService from "./offlineAccountsClientApi.service";
import BaseClientApiService from "./baseClientApi.service";
import CatalogClientApiService from "./catalogsClientApi.service";

export default class ClientApiFactory
{
	public static async getClientApi(resourceName: string): Promise<IApiService>
	{
		switch(resourceName)
		{
		case 'catalogs':
		{
			return new CatalogClientApiService();
		}
		case 'accounts':
		{
			const isWebApp = await global['app']['wApp']['isWebApp']();
			const isBuyer = await global['app']['wApp']['isBuyer']();
			
			if(isWebApp && !isBuyer)
			{
				const papiClient = await pepperi.papiClient;
				return new AccountsPapiService(papiClient);
			}
			else
			{
				return new OfflineAccountsClientApiService();
			}
		}
		default:
		{
			return new BaseClientApiService();
		}
		}
	}
}
