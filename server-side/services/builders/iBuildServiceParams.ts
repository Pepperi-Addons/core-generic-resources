import { PapiClient } from "@pepperi-addons/papi-sdk";
import { BaseGetterService } from "../getters/baseGetter.service";

export interface IBuildServiceParams
{
    baseGetterService: new(papiClient: PapiClient) => BaseGetterService;
	adalTableName: string;
	whereClause: string; 
}
