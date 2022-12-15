import { IAccountsApiService } from "core-resources-shared";
import BaseClientApiService from "./baseClientApi.service";
import deepClone from "lodash.clonedeep";


export default class AccountsClientApiService extends BaseClientApiService implements IAccountsApiService
{
	readonly expectedAccountType = 'Customer';


	async getResourceByKey(resourceName: string, key: string, whereClause: undefined): Promise<any> 
	{
		const res = await super.getResourceByKey(resourceName, key, whereClause);
		await this.validateResourceBeforeReturn(res)

		return res;
	}

	async getResourceByUniqueField(resourceName: string, uniqueFieldId: string, value: string, whereClause: undefined): Promise<any> 
	{
		const res = await super.getResourceByUniqueField(resourceName, uniqueFieldId, value, whereClause);
		await this.validateResourceBeforeReturn(res);

		return res;
	}

	async searchResource(resourceName: string, body: any): Promise<{"Objects": Array<any>, "Count"?: number}> 
	{
		const bodyCopy = deepClone(body);
		bodyCopy.Where = await this.concatFilteringWhereClause(bodyCopy.Where);

		const res = await super.searchResource(resourceName, bodyCopy);

		return res;
	}

	async concatFilteringWhereClause(whereClause: string): Promise<string>
	{
		return `TypeDefinitionID=${this.expectedAccountType}${whereClause ? ' AND (' + whereClause + ')' : ''}`;
	}

	async validateResourceBeforeReturn(resource: any): Promise<void>
	{
		if(resource.Type !== this.expectedAccountType) 
		{
			const errorMessage = `An account of type ${resource.Type} does not match expected type ${this.expectedAccountType}`;
			console.error(errorMessage);

			const error: any = new Error(`Could not find resource.`);
			error.code = 404;

			throw error;
		}
	}
}
