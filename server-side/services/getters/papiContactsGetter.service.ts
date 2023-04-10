import { PapiGetterService } from "./papiGetter.service";

export class PapiContactsGetterService extends PapiGetterService
{ 
	getResourceName(): string 
	{
		return 'contacts';
	}

	async buildFixedFieldsString(): Promise<string> 
	{
		let fields = await this.getSchemeFields('users');
		fields = fields.filter(field => field != 'UserType');
		const fieldsString = fields.join(',');
		console.log("CONTACTS FIELDS STRING: " + fieldsString);
		return fieldsString;
	}

	additionalFix(object: any): void
	{
		object["UserType"] = "Buyer";
	}
}
