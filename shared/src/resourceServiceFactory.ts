import AccountsCoreService from "./accountsCore.service";
import { Request } from '@pepperi-addons/debug-server';
import DefaultCoreResourcesService from "./defaultCoreResources.service";
import BaseCoreService from "./core.service";
import { IApiService } from "./iApi.service";

export class CoreResourceServiceFactory
{
	public static getResourceService(resourceName: string, request: Request, papiService: IApiService): BaseCoreService
	{
		switch(resourceName)
		{
		case "accounts":
			return new AccountsCoreService(resourceName, request, papiService)
		default:
			return new DefaultCoreResourcesService(resourceName, request, papiService);
		}
	}
}
