
import { PapiClient } from '@pepperi-addons/papi-sdk';
import { CORE_BASE_URL } from './constants';
import { ErrorWithStatus } from './errorWithStatus';
import { IApiService } from './iApi.service';
import config from '../../addon.config.json'


export class PapiService implements IApiService
{
	constructor(protected papiClient: PapiClient) 
	{}

	createResource(resourceName: string, body: any)
	{
		try
		{
			return this.papiClient.post(`${CORE_BASE_URL}/resources?resource_name=${resourceName}&addon_uuid=${config.AddonUUID}`, body);
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
			return await this.papiClient.get(`${CORE_BASE_URL}/resources?resource_name=${resourceName}&addon_uuid=${config.AddonUUID}${query ? '&' + query : ''}${whereClause ? '&' + whereClause : ''}`);
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
			return await this.papiClient.get(`${CORE_BASE_URL}/resources?resource_name=${resourceName}&addon_uuid=${config.AddonUUID}&key=${key}${whereClause ? '&' + whereClause : ''}`);
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
			return await this.papiClient.get(`${CORE_BASE_URL}/get_by_unique_field?resource_name=${resourceName}&addon_uuid=${config.AddonUUID}&field_id=${uniqueFieldId}&value=${value}${whereClause ? '&' + whereClause : ''}`);
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
			return await this.papiClient.post(`${CORE_BASE_URL}/search?resource_name=${resourceName}&addon_uuid=${config.AddonUUID}`, body);
		}
		catch(error)
		{
			throw new ErrorWithStatus(error);
		}
	}
}
