import { Request } from '@pepperi-addons/debug-server';
import { Helper } from './helper';
import PapiService from './papi.service';

class CoreService 
{
    
	constructor(private resource: string, private request: Request, private papiService: PapiService)
	{}

	getResourceByUniqueField()
	{
		return this.papiService.getResourceByUniqueField(this.resource, this.request.query.field_id, this.request.query.value);
	}

	createResource()
	{
		return this.papiService.createResource(this.resource, this.request.body);
	}

	getResources()
	{
		const queryParams: string = Helper.queryParamsToString(this.request.query);
		return this.papiService.getResources(this.resource, queryParams);
	}

	getResourceByKey()
	{
		return this.papiService.getResourceByKey(this.resource, this.request.query.key);
	}

	search()
	{
		return this.papiService.searchResource(this.resource, this.request.body);
	} 
}

export default CoreService;