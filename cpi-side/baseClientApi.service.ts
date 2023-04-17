import { AddonsApiGetParams, AddonsApiPostParams } from "@pepperi-addons/cpi-node/build/cpi-side/client-api";
import { IApiService, CORE_ADDON_UUID } from "core-resources-shared";
import config from '../addon.config.json';


export default class BaseClientApiService implements IApiService
{
	
	async createResource(resourceName: string, body: any): Promise<any> 
	{
		const postParams: AddonsApiPostParams = {
			body: body,
			url: `addon-cpi/${resourceName}?addon_uuid=${config.AddonUUID}`
		};
		const res = await pepperi.addons.api.uuid(CORE_ADDON_UUID).post(postParams);

		return res;
	}
	async getResources(resourceName: string, query: string, whereClause: string | undefined): Promise<any>
	{
		// Not implemented in cpi-side.
		// Cpi-side uses Search.
		throw new Error("Method not supported.");
	}
	async getResourceByKey(resourceName: string, key: string, whereClause: undefined): Promise<any> 
	{
		const getParams: AddonsApiGetParams = {
			url: `addon-cpi/${resourceName}/key/${key}?addon_uuid=${config.AddonUUID}`
		};
		const res = await pepperi.addons.api.uuid(CORE_ADDON_UUID).get(getParams);

		return res;
	}

	async getResourceByUniqueField(resourceName: string, uniqueFieldId: string, value: string, whereClause: undefined): Promise<any> 
	{
		const getParams: AddonsApiGetParams = {
			url: `addon-cpi/${resourceName}/unique/${uniqueFieldId}/${value}?addon_uuid=${config.AddonUUID}`
		};
		const res = await pepperi.addons.api.uuid(CORE_ADDON_UUID).get(getParams);

		return res;
	}

	async searchResource(resourceName: string, body: any): Promise<{"Objects": Array<any>, "Count"?: number}> 
	{
		const postParams: AddonsApiPostParams = {
			body: body,
			url: `addon-cpi/${resourceName}/search?addon_uuid=${config.AddonUUID}`
		};
		const res = await pepperi.addons.api.uuid(CORE_ADDON_UUID).post(postParams);

		return res;
	}

	async batchUpsert(resourceName: string, objects: Array<any>): Promise<Array<any>>
	{
		throw new Error('Not supported');
	}
}
