import { CoreService } from './core.service';
import { Helper } from './helper';
import { ICoreService } from './iCoreService';

export class AccountUsersCoreService extends CoreService implements ICoreService
{
	public async getResources()
	{
		// If not include_deleted=true, add 'Hidden=0' to where clause.
		// Otherwise PAPI returns NULL values for hidden account_users.
		// For more information see: https://pepperi.atlassian.net/browse/DI-22222
		this.request.query.where = this.filterHiddenObjects(this.request.query.where, this.request.query.include_deleted);
		
		const queryParams: string = Helper.queryParamsToString(this.request.query);
		const res = await this.iApiService.getResources(this.resource, queryParams, undefined);
		return res;
	}

	private filterHiddenObjects(where: string | undefined, includeDeleted: boolean): string | undefined
	{
		const res = includeDeleted ? where : `Hidden=0${where ? ` AND (${where})` : ''}`;

		return res;
	}

	public async search()
	{
		// If not include_deleted=true, add 'Hidden=0' to where clause.
		// Otherwise PAPI returns NULL values for hidden account_users.
		// For more information see: https://pepperi.atlassian.net/browse/DI-22222
		this.request.body.Where = this.filterHiddenObjects(this.request.body.Where, this.request.body.IncludeDeleted);

		const res = await this.iApiService.searchResource(this.resource, this.request.body);
		return res;
	}
}
