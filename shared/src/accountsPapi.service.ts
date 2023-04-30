import { PapiService } from './papi.service';
import deepClone from 'lodash.clonedeep'
import { IAccountsApiService } from './iAccountsApi.service';
import { Helper } from './helper';
import { ErrorWithStatus } from './errorWithStatus';


export class AccountsPapiService extends PapiService implements IAccountsApiService
{
	
	async getResources(resourceName: string, query: string, whereClause: string | undefined)
	{
		const queryAsObject = Helper.queryStringToParams(query);
		queryAsObject.where = await this.concatFilteringWhereClause(queryAsObject.where)
		query = Helper.queryParamsToString(queryAsObject);
		return await super.getResources(resourceName, query, whereClause);
	}

	async getResourceByKey(resourceName: string, key: string, whereClause = ''): Promise<any> 
	{
		try
		{
			const res = await super.getResourceByKey(resourceName, key, whereClause);
			await this.validateResourceBeforeReturn(res);
			return res;
		}
		catch(error)
		{
			throw new ErrorWithStatus(error);
		}
	}

	async getResourceByUniqueField(resourceName: string, uniqueFieldId: string, value: string, whereClause = '')
	{
		try
		{
			const res = await super.getResourceByUniqueField(resourceName, uniqueFieldId, value, whereClause);
			await this.validateResourceBeforeReturn(res);
			return res;
		}
		catch(error)
		{
			throw new ErrorWithStatus(error);
		}
	}

	async searchResource(resourceName: string, body: any)
	{
		try
		{
			const bodyCopy = deepClone(body);
			bodyCopy.Where = await this.concatFilteringWhereClause(bodyCopy.Where)
			return await super.searchResource(resourceName, bodyCopy);
		}
		catch(error)
		{
			throw new ErrorWithStatus(error);
		}
	}

	async getAccountTypeDefinitionID(): Promise<any> 
	{
		const res = await this.papiClient.get(`/types?where=Type=35 and Name like 'Customer'`);
		return res;
	}

	async concatFilteringWhereClause(whereClause: string): Promise<string> 
	{
		const typeDefinitionID = (await this.getAccountTypeDefinitionID())[0].InternalID;
		return `TypeDefinitionID=${typeDefinitionID}${whereClause ? ' AND (' + whereClause + ')' : ''}`;
	}

	async validateResourceBeforeReturn(resource: any): Promise<void>
	{
		const typeDefinitionID = await this.getAccountTypeDefinitionID();
		if(resource.TypeDefinitionID !== typeDefinitionID[0].InternalID) 
		{
			const errorMessage = `Resource type definition ID ${resource.typeDefinitionID} does not match expected type definition ID ${typeDefinitionID}`;
			console.error(errorMessage);

			const error: any = new Error(`Could not find resource.`);
			error.code = 404;

			throw error;
		}
	}
}
