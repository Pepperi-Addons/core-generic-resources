
import { ErrorWithStatus } from './errorWithStatus';
import { IApiService, CORE_BASE_URL} from 'core-resources-shared';
import { PapiClient } from '@pepperi-addons/papi-sdk';


export default class PapiService implements IApiService
{
	constructor(protected papiClient: PapiClient) 
	{}

	createResource(resourceName: string, body: any)
	{
		try
		{
			return this.papiClient.post(`${CORE_BASE_URL}/resources?resource_name=${resourceName}`, body);
		}
		catch(error)
		{
			throw new ErrorWithStatus(error);
		}
	}

	async getResources(resourceName: string, query: string, whereClause: string | undefined)
	{
		try
		{
			return await this.papiClient.get(`${CORE_BASE_URL}/resources?resource_name=${resourceName}${query ? '&' + query : ''}${whereClause ? '&' + whereClause : ''}`);
		}
		catch(error)
		{
			throw new ErrorWithStatus(error);
		}
	}

	async getResourceByKey(resourceName: string, key: string, whereClause = ''): Promise<any> 
	{
		try
		{
			return await this.papiClient.get(`${CORE_BASE_URL}/resources?resource_name=${resourceName}&key=${key}${whereClause ? '&' + whereClause : ''}`);
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
			return await this.papiClient.get(`${CORE_BASE_URL}/get_by_unique_field?resource_name=${resourceName}&field_id=${uniqueFieldId}&value=${value}${whereClause ? '&' + whereClause : ''}`);
		}
		catch(error)
		{
			throw new ErrorWithStatus(error);
		}
	}

	async searchResource(resourceName: string, body: void)
	{
		try
		{
			return await this.papiClient.post(`${CORE_BASE_URL}/search?resource_name=${resourceName}`, body);
		}
		catch(error)
		{
			throw new ErrorWithStatus(error);
		}
	}

	isAccountTypeDefinitionFilteringRequired(): boolean {
		return true;
	}

	async getAccountTypeDefinitionID(): Promise<any> 
	{
		return await this.papiClient.get(`/types?where=Type=35 and Name like 'Customer'`);
	}
}

