import { PapiClient } from "@pepperi-addons/papi-sdk";
import { BaseGetterService } from "./baseGetter.service";
import { GenericResourceSearchService } from "../genericResourceSearch.service";

export class BuyersGetterService extends BaseGetterService
{ 
	constructor(papiClient: PapiClient)
	{
		super(papiClient, new GenericResourceSearchService(papiClient));
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
		return;
	}

	public override fixObjects(papiObjects: any[]): any[]
	{
		// Filter out non-Users
		let res = papiObjects.filter(obj => obj["User"]);

		// Use super's logic
		res = super.fixObjects(res);

		// Add Name field
		res.forEach(obj => obj["Name"] = `${obj["FirstName"]} ${obj["LastName"]}`);

		// Delete User field
		res.forEach(obj => delete obj["User"]);

		// Add UserType field
		res.forEach(obj => obj["UserType"] = "Buyer");

		return res;
	}
}
