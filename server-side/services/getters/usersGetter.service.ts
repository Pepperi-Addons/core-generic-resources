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
	
	async buildFixedFieldsString(): Promise<string> 
	{
		let fields = await this.getSchemeFields('users');
		fields = fields.filter(field => field != 'UserType');
		const fieldsString = fields.join(',');
		console.log("USERS FIELDS STRING: " + fieldsString);
		return fieldsString;
	}

	singleObjectFix(object: any): void
	{
		object["UserType"] = "Employee";
	}
}
