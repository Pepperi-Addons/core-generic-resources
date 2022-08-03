import { PapiClient } from '@pepperi-addons/papi-sdk';

export class PapiService 
{
	private readonly coreBaseUrl = '/addons/api/00000000-0000-0000-0000-00000000c07e/data_source_api';

	constructor(protected papiClient: PapiClient) 
	{}

	createResource(resourceName: string, body: any)
	{
		return this.papiClient.post(`${this.coreBaseUrl}/resources?resource_name=${resourceName}`, body);
	}

	async getResources(resourceName: string, query: string)
	{
		return this.papiClient.get(`${this.coreBaseUrl}/resources?resource_name=${resourceName}${query ? '&' + query : ''}`);
	}

	async getResourceByKey(resourceName: string, key: string): Promise<any> 
	{
		return this.papiClient.get(`${this.coreBaseUrl}/resources?resource_name=${resourceName}&key=${key}`);
	}

	async getResourceByUniqueField(resourceName: string, uniqueFieldId: string, value: string)
	{
		return this.papiClient.get(`${this.coreBaseUrl}/get_by_unique_field?resource_name=${resourceName}&field_id=${uniqueFieldId}&value=${value}`);
	}

	async searchResource(resourceName: string, body: void)
	{
		return this.papiClient.post(`${this.coreBaseUrl}/search?resource_name=${resourceName}`, body);
	}
}

export default PapiService;