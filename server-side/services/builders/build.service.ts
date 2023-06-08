import { AddonData, BatchApiResponse, PapiClient, SearchBody, SearchData } from '@pepperi-addons/papi-sdk';
import { BaseGetterService } from '../getters/baseGetter.service';
import { IBuildServiceParams } from './iBuildServiceParams';
import { AsyncResultObject } from '../../constants';
import { BuildService, BuildOperations } from '@pepperi-addons/modelsdk';
import { AdalService } from '../adal.service';


export class BaseBuildService implements BuildOperations<AddonData, string, any>
{
	protected readonly pageSize = 500;
	protected baseGetterService: BaseGetterService;
	protected buildService: BuildService<AddonData, AddonData, any>;
	protected adalService: AdalService;


	constructor(papiClient: PapiClient, protected buildServiceParams: IBuildServiceParams) 
	{
		this.baseGetterService = new this.buildServiceParams.baseGetterService(papiClient);
		this.adalService = new AdalService(papiClient);
		this.buildService = new BuildService(buildServiceParams.adalTableName, this);
	}

	//#region BuildService implementation

	// These functions are exposed here so they can be called from the buildService object,
	// while retaining the 'this' scope of the BaseBuildService class.

	async getObjectsByPage(page: number, pageSize: number, additionalFields?: string): Promise<AddonData[]>
	{
		return await this.baseGetterService.getObjectsByPage(page, pageSize, additionalFields);
	}

	fixObjects(objects: AddonData[]): string[]
	{
		return this.baseGetterService.fixObjects(objects);
	}

	async batchUpsert(resourceName: string, objects: string[]): Promise<BatchApiResponse[]>
	{
		return await this.adalService.batchUpsert(resourceName, objects);
	}
	//#endregion

	/**
	 * Hides all items in the ADAL table, and build the table again.
	 * @param body - used to pass the fromPage parameter. Must be the entire body of the request,
	 * to support retries in an async call.
	 * @returns {AsyncResultObject} - A promise that resolves to the result of the build
	 */
	public async cleanBuildAdalTable(body: any): Promise<AsyncResultObject>
	{
		let res: AsyncResultObject = await this.hideAdalItems();

		if (res.success)
		{
			res = await this.buildAdalTable(body);
		}

		return res;	
	}

	public async buildAdalTable(body: any): Promise<AsyncResultObject>
	{
    	return await this.buildService.buildTable(body);
	}

	/**
	 * Hides all objects in an ADAL table by setting the Hidden field to true and setting ExpirationDateTime to now.
	 */
	protected async hideAdalItems(): Promise<AsyncResultObject>
	{
		console.log(`HIDING ALL OBJECTS IN ${this.buildServiceParams.adalTableName}`);
		
		const res: AsyncResultObject = { success: true };

		let searchResponse: SearchData<AddonData>;
		let nextPageKey: string | undefined = undefined;
		// ExpirationDateTime must be a future time, otherwise an exception is thrown
		const minuteFromNow = new Date(new Date().getTime() + new Date(1000 * 60).getTime());
		try
		{
			do
			{
				const searchOptions: SearchBody = {
					...(nextPageKey && {PageKey: nextPageKey}),
					Fields: ["Key"],
					PageSize: this.pageSize
				};

				searchResponse = await this.adalService.searchResource(this.buildServiceParams.adalTableName, searchOptions);
				console.log(`HIDING ${searchResponse.Objects.length} OBJECTS IN ${this.buildServiceParams.adalTableName}`);
				
				// For each object, set the Hidden field to true, and set ExpirationDateTime to now
				for (const object of searchResponse.Objects)
				{
					object.Hidden = true;
					object.ExpirationDateTime = minuteFromNow;
				}

				// Batch upsert to adal
				await this.adalService.batchUpsert(this.buildServiceParams.adalTableName, searchResponse.Objects);

				nextPageKey = searchResponse.NextPageKey;
			}
			while (nextPageKey);
		}
		catch (error)
		{
			res.success = false;
			res.errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
			console.log(`HIDING ALL OBJECTS IN ${this.buildServiceParams.adalTableName} FAILED: ${res.errorMessage}`);
			return res;
		}

		console.log(`FINISHED HIDING ALL OBJECTS IN ${this.buildServiceParams.adalTableName}`);
		
		return res;
	}
}
