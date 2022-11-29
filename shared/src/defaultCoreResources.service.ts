import BaseCoreService from "./core.service";


class DefaultCoreResourcesService extends BaseCoreService
{
	protected validateResourceBeforeReturn(resource: any): void
	{
		// Do nothing
	}



	protected async modifyGetResourcesRequest(): Promise<void>
	{
		// Do nothing
	}


	protected async modifySearchRequest(): Promise<void>
	{
		// Do nothing
	}
}

export default DefaultCoreResourcesService;
