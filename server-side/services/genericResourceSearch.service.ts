import { ISearchService } from "core-resources-shared";
import { PapiClient } from "@pepperi-addons/papi-sdk";

export class GenericResourceSearchService implements ISearchService
{
	constructor(private papiClient: PapiClient)
	{}
	async searchResource(resourceName: string, body: any): Promise<{Objects: Array<any>;Count?: number;}>
	{
		return await this.papiClient.resources.resource(resourceName).search(body);
	}
}
