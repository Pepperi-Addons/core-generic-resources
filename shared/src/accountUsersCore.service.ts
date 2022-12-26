import { CoreService } from './core.service';
import { Helper } from './helper';
import { ICoreService } from './iCoreService';
import deepClone from 'lodash.clonedeep'
import { DimxObject } from './constants';

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
		const papiBody = this.translateAccountAndUserReferenceFieldsToPapi([this.request.body])[0];

		const res = await this.iApiService.createResource(this.resource, papiBody);

		const translatedResult = this.translateAccountAndUserPropertiesToReferenceFields([res])[0];
		return translatedResult;
	}

	public async getResources()
	{
		// If not include_deleted=true, add 'Hidden=0' to where clause.
		// Otherwise PAPI returns NULL values for hidden account_users.
		// For more information see: https://pepperi.atlassian.net/browse/DI-22222
		if(!this.request.query.include_deleted)
		{
			this.request.query.where = this.filterHiddenObjects(this.request.query.where);
		}
		
		const queryParams: string = Helper.queryParamsToString(this.request.query);
		const res = await this.iApiService.getResources(this.resource, queryParams, undefined);
		const translatedResult = this.translateAccountAndUserPropertiesToReferenceFields(res);
		return translatedResult;
	}

	private filterHiddenObjects(where: string): string 
	{
		return `Hidden=0 AND (${where})`;
	}

	public async getResourceByKey()
	{
		const res = await this.iApiService.getResourceByKey(this.resource, this.request.query.key, this.request.query.where);
		const translatedResult = this.translateAccountAndUserPropertiesToReferenceFields([res])[0];
		return translatedResult;
	}

	public async search()
	{
		// If not include_deleted=true, add 'Hidden=0' to where clause.
		// Otherwise PAPI returns NULL values for hidden account_users.
		// For more information see: https://pepperi.atlassian.net/browse/DI-22222
		if(!this.request.body.IncludeDeleted)
		{
			this.request.body.Where = this.filterHiddenObjects(this.request.body.Where);
		}

		const res = await this.iApiService.searchResource(this.resource, this.request.body);
		res.Objects = this.translateAccountAndUserPropertiesToReferenceFields(res.Objects);
		return res;
	}

	public dimxExport(): DimxObject
	{
		return this.dimxProcessing(this.translateAccountAndUserPropertiesToReferenceFields);
	}

	public dimxImport(): DimxObject
	{
		return this.dimxProcessing(this.translateAccountAndUserReferenceFieldsToPapi);
	}

	protected dimxProcessing(translationFunction: (objects: Array<any>) => Array<any>): DimxObject
	{
		const resultDimxObject: DimxObject = {DIMXObjects: []}

		for (let index = 0; index < this.request.body.DIMXObjects.length; index++) 
		{
			const originalDimxObject = this.request.body.DIMXObjects[index];
			try
			{
				resultDimxObject.DIMXObjects.push({
					Object: translationFunction([originalDimxObject.Object])[0],
					Status: originalDimxObject.Status
				});
			}
			catch(error)
			{
				const errorMessage = error instanceof Error ? error.message : `An unknown error occurred trying to manipulate object with key ${originalDimxObject.Object.Key}`;
				console.error(errorMessage);
				resultDimxObject.DIMXObjects.push({
					Status: "Error",
					Details: errorMessage
				});
			}
		}

		return resultDimxObject;
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

	protected translateAccountAndUserReferenceFieldsToPapi(objects: Array<any>): Array<any>
	{
		return objects.map(object => 
		{
			const objectCopy = deepClone(object);

			if(objectCopy.hasOwnProperty('Account'))
			{
				objectCopy.Account = { 
					Data: {
						UUID: objectCopy.Account
					}
				}
			}

			if(objectCopy.hasOwnProperty('User'))
			{
				objectCopy.User = {
					Data: {
						UUID: objectCopy.User
					}
				}
			}

			return objectCopy;
		})
	}
}
