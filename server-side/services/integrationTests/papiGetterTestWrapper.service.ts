import { PapiClient } from '@pepperi-addons/papi-sdk';
import { BaseGetterService } from '../getters/baseGetter.service';
import { TestBody } from './entities';
import { IApiService } from 'core-resources-shared';

class emptyiApiService implements IApiService 
{
	createResource(resourceName: string, body: any): Promise<any> 
	{
		return  Promise.resolve({});
	}
	getResources(resourceName: string, query: string, whereClause: string | undefined): Promise<Array<any>>
	{
		return  Promise.resolve([]);
	}
	getResourceByKey(resourceName: string, key: string, whereClause: undefined): Promise<any> 
	{
		return  Promise.resolve({});
	}
	getResourceByUniqueField(resourceName: string, uniqueFieldId: string, value: string, whereClause: undefined): Promise<any>
	{
		return  Promise.resolve({});
	}
	searchResource(resourceName: string, body: any): Promise<{Objects: Array<any>;Count?: number;}>
	{
		return  Promise.resolve({Objects: []});
	}
	batchUpsert(resourceName: string, objects: Array<any>): Promise<Array<any>>
	{
		return  Promise.resolve([]);
	}
}

export class PapiGetterTestWrapperService extends BaseGetterService
{

	constructor(papiClient: PapiClient, protected wrappedPapiGetter: BaseGetterService, protected testBody: TestBody)
	{
		super(papiClient, new emptyiApiService());
	}

	public getResourceName(): string
	{
		return this.wrappedPapiGetter.getResourceName();
	}

	public async buildFixedFieldsString(): Promise<string>
	{
		return await this.wrappedPapiGetter.buildFixedFieldsString();
	}

	public additionalFix(object): void
	{
		this.wrappedPapiGetter.additionalFix(object);
	}

	public override async getObjectsByPage(whereClause: string, page: number, pageSize: number, additionalFields?: string): Promise<any[]>
	{
    	// If the testBody has TestInputObjects[this.getResourceName()], return objects from it appropriate to the page and pageSize
		// Page and pageSize are 1-based
		let res: any[];
		if(this.testBody.TestInputObjects && this.testBody.TestInputObjects[this.getResourceName()])
		{
			const startIndex = (page - 1) * pageSize;
			const endIndex = startIndex + pageSize - 1;
			res = this.testBody.TestInputObjects[this.getResourceName()].slice(startIndex, endIndex);
		}
		else
		{
			res = await this.wrappedPapiGetter.getObjectsByPage(whereClause, page, pageSize, additionalFields);
		}

		return res;
	}

	public override async getObjectsByKeys(UUIDs: string[], additionalFields?: string): Promise<any[]>
	{
    	// If the testBody has TestInputObjects[this.getResourceName()], return objects from it appropriate to the UUIDs
		let res: any;
		if(this.testBody.TestInputObjects && this.testBody.TestInputObjects[this.getResourceName()])
		{
			res = this.testBody.TestInputObjects[this.getResourceName()].filter(obj => UUIDs.includes(obj.UUID));
		}
		else
		{
			res = await this.wrappedPapiGetter.getObjectsByKeys(UUIDs, additionalFields);
		}

		return res;
	}

	public override fixObjects(papiObjects: any[]): any[]
	{
		return this.wrappedPapiGetter.fixObjects(papiObjects);
	}
}
