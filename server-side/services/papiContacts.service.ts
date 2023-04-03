import { PapiGetterService } from "./papiGetter.service";

export class PapiContactsService extends PapiGetterService
{ 
	getResourceName(): string 
	{
		return 'contacts';
	}

	async buildFixedFieldsString(): Promise<string> 
	{
		let fields = await this.getSchemeFields('users');
		fields = fields.filter(field => field != 'UserType');
		return fields.join(',');
	}

	additionalFix(object: any): any
	{
		object["UserType"] = "Buyer";
	}
}
