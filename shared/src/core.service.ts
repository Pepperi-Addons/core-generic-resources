import { Request } from '@pepperi-addons/debug-server';
import { Helper } from './helper';
import { IApiService } from './iApi.service';
import { ICoreService } from './ICoreService';

export class CoreService implements ICoreService
{
    
	constructor(protected resource: string, protected request: Request, protected iApiService: IApiService)
	{}

	public async getResourceByUniqueField()
	{
		const res = await this.iApiService.getResourceByUniqueField(this.resource, this.request.query.field_id, this.request.query.value, this.request.query.where);
		return res;
	}

	public async createResource()
	{
		return await this.iApiService.createResource(this.resource, this.request.body);
	}

	public async getResources()
	{
		const queryParams: string = Helper.queryParamsToString(this.request.query);
		return await this.iApiService.getResources(this.resource, queryParams, undefined);
	}

	public async getResourceByKey()
	{
		const res = await this.iApiService.getResourceByKey(this.resource, this.request.query.key, this.request.query.where);
		return res;
	}

	public async search()
	{
		return await this.iApiService.searchResource(this.resource, this.request.body);
	} 
}
