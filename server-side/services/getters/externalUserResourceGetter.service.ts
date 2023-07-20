import { PapiClient } from "@pepperi-addons/papi-sdk";
import { BaseGetterService } from "./baseGetter.service";
import { GenericResourceSearchService } from "../genericResourceSearch.service";

export class ExternalUserResourceGetterService extends BaseGetterService
{ 
	constructor(papiClient: PapiClient, protected externalUserResource: string)
	{
		super(papiClient, new GenericResourceSearchService(papiClient), "Active=true");
	}

	getResourceName(): string
	{
		return this.externalUserResource;
	}

	async buildFixedFieldsString(): Promise<string> 
	{
		let fields = await this.getSchemeFields('users');
		fields = fields.filter(field => field != 'UserType');
		const fieldsString = fields.join(',');
		console.log("BUYERS FIELDS STRING: " + fieldsString);
		return fieldsString;
	}

	singleObjectFix(object: any): void
	{
		object["UserType"] = "Buyer";
		object["Name"] = `${object["FirstName"]} ${object["LastName"]}`;
		delete object["Active"];
	}
}
