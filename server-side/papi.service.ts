import { PapiClient } from '@pepperi-addons/papi-sdk';
import { CORE_BASE_URL } from './constants';

export class PapiService 
{
	constructor(protected papiClient: PapiClient) 
	{}

	createResource(resourceName: string, body: any)
	{
		return this.papiClient.post(`${CORE_BASE_URL}/resources?resource_name=${resourceName}`, body);
	}

	async getResources(resourceName: string, query: string)
	{
		return this.papiClient.get(`${CORE_BASE_URL}/resources?resource_name=${resourceName}${query ? '&' + query : ''}`);
	}

	async getResourceByKey(resourceName: string, key: string): Promise<any> 
	{
		return this.papiClient.get(`${CORE_BASE_URL}/resources?resource_name=${resourceName}&key=${key}`);
	}

	async getResourceByUniqueField(resourceName: string, uniqueFieldId: string, value: string)
	{
		return this.papiClient.get(`${CORE_BASE_URL}/get_by_unique_field?resource_name=${resourceName}&field_id=${uniqueFieldId}&value=${value}`);
	}

	async searchResource(resourceName: string, body: void)
	{
		return this.papiClient.post(`${CORE_BASE_URL}/search?resource_name=${resourceName}`, body);
	}
}

export default PapiService;