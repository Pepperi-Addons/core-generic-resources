import { PapiClient } from '@pepperi-addons/papi-sdk';
import { PapiGetterService } from '../getters/papiGetter.service';
import { TestBody } from './entities';


export class PapiGetterTestWrapperService extends PapiGetterService
{

	constructor(papiClient: PapiClient, protected wrappedPapiGetter: PapiGetterService, protected testBody: TestBody)
	{
		super(papiClient);
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

	public override async getPapiObjectsByPage(whereClause: string, page: number, pageSize: number, additionalFields?: string): Promise<any[]>
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
			res = await this.wrappedPapiGetter.getPapiObjectsByPage(whereClause, page, pageSize, additionalFields);
		}

		return res;
	}

	public override async getPapiObjectsByUUIDs(UUIDs: string[], additionalFields?: string): Promise<any[]>
	{
    	// If the testBody has TestInputObjects[this.getResourceName()], return objects from it appropriate to the UUIDs
		let res: any;
		if(this.testBody.TestInputObjects && this.testBody.TestInputObjects[this.getResourceName()])
		{
			res = this.testBody.TestInputObjects[this.getResourceName()].filter(obj => UUIDs.includes(obj.UUID));
		}
		else
		{
			res = await this.wrappedPapiGetter.getPapiObjectsByUUIDs(UUIDs, additionalFields);
		}

		return res;
	}
}
