import { PapiClient } from "@pepperi-addons/papi-sdk";
import { AdalService } from "../adal.service";
import { BaseGetterService } from "./baseGetter.service";

export class BuyersGetterService extends BaseGetterService
{ 
	constructor(papiClient: PapiClient)
	{
		super(papiClient, new AdalService(papiClient));
	}
	
	getResourceName(): string 
	{
		return 'buyers';
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
	}
}
