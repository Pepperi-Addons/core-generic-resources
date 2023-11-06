import { AddonData, BatchApiResponse, PapiClient, SearchBody, SearchData } from '@pepperi-addons/papi-sdk';
import { BaseGetterService } from '../getters/baseGetter.service';
import { IBuildServiceParams } from './iBuildServiceParams';
import { AsyncResultObject } from '../../constants';
import { BuildOperations as EtlOperations} from '@pepperi-addons/etl-sdk';
import { BuildService as EtlService } from '@pepperi-addons/etl-sdk/dist/builders/build';
import { AdalService } from '../adal.service';
import { Client, Request } from '@pepperi-addons/debug-server/dist';
import { Helper } from 'core-resources-shared';
import SystemHealthService from '../systemHealth.service';


export class BaseBuildService implements EtlOperations<AddonData, AddonData, any>
{
	protected readonly pageSize = 500;
	protected baseGetterService: BaseGetterService;
	protected etlService: EtlService<AddonData, AddonData, any>;
	protected adalService: AdalService;
	private papiClient: PapiClient;
	protected systemHealthService: SystemHealthService;


	constructor(private client: Client, protected buildServiceParams: IBuildServiceParams, externalUserResource?: string) 
	{
		// If externalUserResource is not provided, undefined is passed and the constructor ignores it.
		this.papiClient = Helper.getPapiClient(client);
		this.baseGetterService = new this.buildServiceParams.baseGetterService(this.papiClient, externalUserResource);
		this.adalService = new AdalService(this.papiClient);
		this.etlService = new buildServiceParams.etlService(buildServiceParams.adalTableName, this);
		this.systemHealthService = new SystemHealthService(client);
	}

	getObjectsByPage(page: number, pageSize: number, additionalFields?: string | undefined): Promise<AddonData[]>
	{
		throw new Error('Method not implemented.');
	}

	//#region BuildService implementation

	// These functions are exposed here so they can be called from the buildService object,
	// while retaining the 'this' scope of the BaseBuildService class.

	async searchObjectsByPage(page: number, pageSize: number, additionalFields?: string[]): Promise<SearchData<AddonData>>
	{
		return await this.baseGetterService.getObjectsByPage(page, pageSize, additionalFields);
	}

	fixObjects(objects: AddonData[]): AddonData[]
	{
		return this.baseGetterService.fixObjects(objects);
	}

	async batchUpsert(resourceName: string, objects: AddonData[]): Promise<BatchApiResponse[]>
	{
		const res = await this.adalService.batchUpsert(resourceName, objects);
		return res;
	}
	//#endregion

	/**
	 * Hides all items in the ADAL table, and build the table again.
	 * @param body - Must be the entire body of the request,
	 * to support retries in an async call.
	 * @returns {AsyncResultObject} - A promise that resolves to the result of the build
	 */
	public async cleanBuildAdalTable(request: Request): Promise<AsyncResultObject>
	{
		let res: AsyncResultObject = await this.hideAdalItems();

		if (res.success)
		{
			res = await this.buildAdalTable(request);
		}

		return res;	
	}

	public async buildAdalTable(request: Request): Promise<AsyncResultObject>
	{
		
		const isAsync = this.client.isAsync?.();
		const requestedRetries: number = request.query?.retry;
		const numberOfTry: number = this.client.NumberOfTry ?? 0;

		if(isAsync)
		{
			const nucleusIsLoaded = await this.papiClient.get('/distributor/InNucleus');
			if(!nucleusIsLoaded && numberOfTry < requestedRetries)
			{
				// Wait for 5 minutes, then retry
				const delay = 5 * 60 * 1000; // 5 minutes in milliseconds
				this.client.Retry(delay);
			}

		}
    	await this.baseGetterService.preBuildLogic();
		
		let buildTableRes;
		let buildError: Error | undefined;

		try
		{
			console.log(`BODY SENT TO ETL SERVICE BUILD: ${JSON.stringify(request.body)}`);
			buildTableRes = await this.etlService.buildTable(request.body);
			console.log(`BODY AFTER BUILD IS DONE: ${JSON.stringify(request.body)}`);

			// In case timeout reached
			if(isAsync && !buildTableRes.success && buildTableRes.timeoutReached)
			{
				// Sending an alert in case all retries failed, relevant only for async calls
				if(numberOfTry == requestedRetries)
				{
					await this.systemHealthService.sendAlertToCoreResourcesAlertsChannel(
						`Error on Building ${this.buildServiceParams.adalTableName} table`,
						 JSON.stringify(buildTableRes.errorMessage)
					);
				}
				else
				{
					// Retry after waiting 10 seconds, to continue the build process
					const delay = 10 * 1000;
					this.client.Retry(delay);
				}
			}
				
		}
		catch(error)
		{
			buildError = error as Error;
			await this.systemHealthService.sendAlertToCoreResourcesAlertsChannel(
				`Error on Building ${this.buildServiceParams.adalTableName} table`,
				 JSON.stringify(buildError.message)
			);

		}
		finally
		{
			await this.baseGetterService.postBuildLogic();
		}

		if(buildError)
		{
			throw buildError;
		}


		return buildTableRes;
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
