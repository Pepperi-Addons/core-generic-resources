import { PapiService } from "core-resources-shared";
import { BaseGetterService } from "./baseGetter.service";
import { PapiClient } from "@pepperi-addons/papi-sdk";

export class UsersGetterService extends BaseGetterService
{ 
	constructor(papiClient: PapiClient)
	{
		super(papiClient, new PapiService(papiClient));
	}

	getResourceName(): string 
	{
		return 'users';
	}
	
	async buildFixedFieldsArray(): Promise<string[]> 
	{
		let fields = await this.getSchemeFields('users');
		fields = fields.filter(field => field != 'UserType');
		console.log("USERS FIELDS STRING: " + JSON.stringify(fields));
		return fields;
	}

	singleObjectFix(object: any): void
	{
		object["UserType"] = "Employee";
	}
}
