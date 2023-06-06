import { PapiClient } from "@pepperi-addons/papi-sdk";
import { BaseGetterService } from "./baseGetter.service";
import { ISearchService } from "core-resources-shared";

export class BuyersGetterService extends BaseGetterService
{ 
	constructor(papiClient: PapiClient)
	{
		super(papiClient, new SearchBuyersService(papiClient), "User != ''");
	}

	getResourceName(): string
	{
		return 'Buyers';
	}

	async buildFixedFieldsString(): Promise<string> 
	{
		let fields = await this.getSchemeFields('users');
		fields = fields.filter(field => field != 'UserType');
		const fieldsString = fields.join(',');
		console.log("BUYERS FIELDS STRING: " + fieldsString);
		return fieldsString;
	}

	additionalFix(object: any): void
	{
		object["UserType"] = "Buyer";
		object["Name"] = `${object["FirstName"]} ${object["LastName"]}`;
		delete object["User"];
	}
}

class SearchBuyersService implements ISearchService
{
	constructor(private papiClient: PapiClient)
	{}
	async searchResource(resourceName: string, body: any): Promise<{Objects: Array<any>;Count?: number;}>
	{
		return await this.papiClient.resources.resource(resourceName).search(body);
	}
}
