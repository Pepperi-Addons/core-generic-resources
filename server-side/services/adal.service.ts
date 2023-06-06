import { BatchApiResponse, PapiClient } from '@pepperi-addons/papi-sdk';
import { ErrorWithStatus } from 'core-resources-shared';
import { IApiService } from 'core-resources-shared';
import config from '../../addon.config.json'
import { Helper } from 'core-resources-shared';
import { resourceNameToSchemaMap } from '../resourcesSchemas';


export class AdalService implements IApiService
{
	constructor(protected papiClient: PapiClient)
	{}

	createResource(resourceName: string, body: any) : Promise<any>
	{
		throw new Error(`Creation of '${resourceName}' is not supported`);
	}

	async getResources(resourceName: string, query: string, whereClause: string | undefined)
	{
		try
		{
			const queryParams = Helper.queryStringToParams(query);
			return await this.papiClient.addons.data.uuid(config.AddonUUID).table(resourceName).find(queryParams);
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
			return await this.papiClient.addons.data.uuid(config.AddonUUID).table(resourceName).key(key).get();
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
			this.validateUniqueKeyPrerequisites(resourceName, uniqueFieldId, value);
			const returnedObjects = await this.papiClient.addons.data.uuid(config.AddonUUID).table(resourceName).find({where: `${uniqueFieldId}='${value}'`});
			if(returnedObjects.length > 0) 
			{
				return returnedObjects[0];
			}
			throw new Error('Object ID does not exist.');
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
			if(body.UniqueFieldID && body.UniqueFieldList.length > 0) 
			{
				const valuesString = body.UniqueFieldList.map(field => `'${field}'`).join(',');
				body.Where = `${body.Where} AND ${body.UniqueFieldID} in (${valuesString})`;
			}
			return await this.papiClient.addons.data.search.uuid(config.AddonUUID).table(resourceName).post(body);
		}
		catch(error)
		{
			throw new ErrorWithStatus(error);
		}
	}

	async batchUpsert(resourceName: string,objects: any[]): Promise<BatchApiResponse[]> 
	{
		let res: BatchApiResponse[] = [];

		if(objects.length > 0) // ADAL doesn't support empty batch
		{
			res = await this.papiClient.addons.data.uuid(config.AddonUUID).table(resourceName).batch(objects);
		}
		
		return res;
	}

	validateUniqueKeyPrerequisites(resourceName: string, requestedFieldId: string, requestedValue: string)
	{
		const schemeFields = resourceNameToSchemaMap[resourceName].Fields ?? {};
		const uniqueFields = Object.keys(schemeFields).filter(field => schemeFields[field].Unique);
		uniqueFields.push('Key');
		if (!(requestedFieldId && requestedValue))
		{
			throw new Error(`Missing the required field_id or value query parameters.`);
		}

		if(!uniqueFields.includes(requestedFieldId))
		{
			throw new Error(`The field_id query parameter is not valid. Supported field_ids are: ${uniqueFields.join(", ")}`);
		}
	}
}
