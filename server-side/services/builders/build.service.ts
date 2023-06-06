import { AddonData, BatchApiResponse, PapiClient } from '@pepperi-addons/papi-sdk';
import { BaseGetterService } from '../getters/baseGetter.service';
import { IBuildServiceParams } from './iBuildServiceParams';
import { BuildService, BuildOperations } from '@pepperi-addons/modelsdk';
import { AdalService } from '../adal.service';


export class BaseBuildService
{
	protected readonly pageSize = 500;
	protected baseGetterService: BaseGetterService;
	protected buildService: BuildService<AddonData,AddonData,BatchApiResponse>;

	constructor(papiClient: PapiClient, protected buildServiceParams: IBuildServiceParams)
	{
		this.baseGetterService = new this.buildServiceParams.baseGetterService(papiClient);
		const adalService = new AdalService(papiClient);
		const buildOperations: BuildOperations<AddonData,string,BatchApiResponse> = {
			getObjectsByPage: this.baseGetterService.getObjectsByPage,
			fixObjects: this.baseGetterService.fixObjects,
			batchUpsert: adalService.batchUpsert
		}
		this.buildService = new BuildService(buildServiceParams.adalTableName, buildOperations);
	}

	public async buildAdalTable(body: any): Promise<any>
	{
    	return await this.buildService.buildTable(body);
	}
}
