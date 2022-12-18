import { CoreService } from './core.service';
import { Helper } from './helper';
import { ICoreService } from './iCoreService';
import deepClone from 'lodash.clonedeep'

export class AccountUsersCoreService extends CoreService implements ICoreService
{

	public async getResourceByUniqueField()
	{
		const res = await this.iApiService.getResourceByUniqueField(this.resource, this.request.query.field_id, this.request.query.value, this.request.query.where);
		const translatedResult = this.translateAccountAndUserPropertiesToReferenceFields([res])[0];
		return translatedResult;
	}

	public async createResource()
	{
		const res = await this.iApiService.createResource(this.resource, this.request.body);
		const translatedResult = this.translateAccountAndUserPropertiesToReferenceFields([res])[0];
		return translatedResult;
	}

	public async getResources()
	{
		const queryParams: string = Helper.queryParamsToString(this.request.query);
		const res = await this.iApiService.getResources(this.resource, queryParams, undefined);
		const translatedResult = this.translateAccountAndUserPropertiesToReferenceFields(res);
		return translatedResult;
	}

	public async getResourceByKey()
	{
		const res = await this.iApiService.getResourceByKey(this.resource, this.request.query.key, this.request.query.where);
		const translatedResult = this.translateAccountAndUserPropertiesToReferenceFields([res])[0];
		return translatedResult;
	}

	public async search()
	{
		const res = await this.iApiService.searchResource(this.resource, this.request.body);
		res.Objects = this.translateAccountAndUserPropertiesToReferenceFields(res.Objects);
		return res;
	}

	protected translateAccountAndUserPropertiesToReferenceFields(objects: Array<any>): Array<any>
	{
		return objects.map(object => 
		{
			const objectCopy = deepClone(object);

			if(objectCopy.hasOwnProperty('Account'))
			{
				objectCopy.Account = objectCopy.Account.Data.UUID;
			}

			if(objectCopy.hasOwnProperty('User'))
			{
				objectCopy.User = objectCopy.User.Data.UUID;
			}

			return objectCopy;
		})
	}
}
