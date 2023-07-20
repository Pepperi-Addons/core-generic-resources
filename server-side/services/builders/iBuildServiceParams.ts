import { BuildOperations as EtlOperations } from "@pepperi-addons/modelsdk";
import { BuildService as EtlService } from "@pepperi-addons/modelsdk/dist/builders/build";
import { AddonData, PapiClient } from "@pepperi-addons/papi-sdk";
import { BaseGetterService } from "../getters/baseGetter.service";

export interface IBuildServiceParams
{
    baseGetterService: new(papiClient: PapiClient, ...args) => BaseGetterService;
	adalTableName: string;
    etlService: new(tableName: string, buildOperations: EtlOperations<AddonData, AddonData, any>) =>  EtlService<AddonData, AddonData, any>
}
