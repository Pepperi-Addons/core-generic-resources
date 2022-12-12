import { Request } from '@pepperi-addons/debug-server';
import { Helper } from './helper';
import { IApiService } from './iApi.service';

abstract class BaseCoreService 
{
    
	constructor(protected resource: string, protected request: Request, protected iApiService: IApiService)
	{}

	protected abstract validateResourceBeforeReturn(resource: any): void;
	protected abstract modifyGetResourcesRequest(): Promise<void>;
	protected abstract modifySearchRequest(): Promise<void>;

	public async getResourceByUniqueField()
	{
		const res = await this.iApiService.getResourceByUniqueField(this.resource, this.request.query.field_id, this.request.query.value, this.request.query.where);
		await this.validateResourceBeforeReturn(res);
		return res;
	}

	public createResource()
	{
		return this.iApiService.createResource(this.resource, this.request.body);
	}

	public async getResources()
	{
		await this.modifyGetResourcesRequest();
		const queryParams: string = Helper.queryParamsToString(this.request.query);
		return this.iApiService.getResources(this.resource, queryParams, undefined);
	}

	public async getResourceByKey()
	{
		const res = await this.iApiService.getResourceByKey(this.resource, this.request.query.key, this.request.query.where);
		await this.validateResourceBeforeReturn(res);
		return res;
	}

	public async search()
	{
		await this.modifySearchRequest();
		return this.iApiService.searchResource(this.resource, this.request.body);
	} 
}

export default BaseCoreService;