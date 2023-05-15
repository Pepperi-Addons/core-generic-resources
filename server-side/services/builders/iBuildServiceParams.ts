import { PapiClient } from "@pepperi-addons/papi-sdk";
import { PapiGetterService } from "../getters/papiGetter.service";

export interface IBuildServiceParams
{
    papiGetterService: new(papiClient: PapiClient) => PapiGetterService;
	adalTableName: string;
	whereClause: string; 
	/**
	 * If true, will delete all the data in the table before building it.
	 */
	shouldCleanBuild?: boolean;
}
