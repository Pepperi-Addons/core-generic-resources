import { Request } from '@pepperi-addons/debug-server';
import { Helper } from './helper';
import PapiService from './papi.service';

abstract class BaseCoreService 
{
    
	constructor(protected resource: string, protected request: Request, protected papiService: PapiService)
	{}

	protected abstract validateResourceBeforeReturn(resource: any): void;
	protected abstract modifyGetResourcesRequest(): Promise<void>;
	protected abstract modifySearchRequest(): Promise<void>;

	public async getResourceByUniqueField()
	{
		const res = await this.papiService.getResourceByUniqueField(this.resource, this.request.query.field_id, this.request.query.value, this.request.query.where);
		await this.validateResourceBeforeReturn(res);
		return res;
	}

	public createResource()
	{
		return this.papiService.createResource(this.resource, this.request.body);
	}

	public async getResources()
	{
		await this.modifyGetResourcesRequest();
		const queryParams: string = Helper.queryParamsToString(this.request.query);
		return this.papiService.getResources(this.resource, queryParams);
	}

	public async getResourceByKey()
	{
		const res = await this.papiService.getResourceByKey(this.resource, this.request.query.key, this.request.query.where);
		await this.validateResourceBeforeReturn(res);
		return res;
	}

	public async search()
	{
		await this.modifySearchRequest();
		return this.papiService.searchResource(this.resource, this.request.body);
	} 
}

export default BaseCoreService;