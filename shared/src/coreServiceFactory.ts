import { AccountUsersCoreService } from "./accountUsersCore.service";
import { IApiService } from "./iApi.service";
import { Request } from '@pepperi-addons/debug-server';
import { CoreService } from "./core.service";


export class CoreServiceFactory
{
	static getCoreService(resourceName: string, request: Request, iApiService: IApiService)
	{
		switch(resourceName)
		{
		case "account_users":
		{
			return new AccountUsersCoreService(resourceName, request, iApiService)
		}
		default:
		{
			return new CoreService(resourceName, request, iApiService);
		}
		}
	}
}
