import { IApiService } from "./iApi.service";
import { Request } from '@pepperi-addons/debug-server';
import { CoreService } from "./core.service";


export class CoreServiceFactory
{
	static getCoreService(resourceName: string, request: Request, iApiService: IApiService)
	{
		switch(resourceName)
		{
		default:
		{
			return new CoreService(resourceName, request, iApiService);
		}
		}
	}
}
