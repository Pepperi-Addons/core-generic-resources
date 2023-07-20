import { BaseTest } from "@pepperi-addons/addon-testing-framework";
import { PapiClient } from "@pepperi-addons/papi-sdk";
import { CoreResourcesTestsService } from "./services/coreResources.service";

export abstract class ABaseCoreResourcesTests extends BaseTest
{
	private _coreResourcesTestsService: CoreResourcesTestsService | undefined;
	private _papiClient: PapiClient | undefined;

	protected get coreResourcesTestsService(): CoreResourcesTestsService
	{
		if(!this._coreResourcesTestsService)
		{
			this._coreResourcesTestsService = new CoreResourcesTestsService(this.papiClient);
		}

		return this._coreResourcesTestsService;
	}

	protected get papiClient(): PapiClient
	{
		if(!this._papiClient)
		{
			this._papiClient = new PapiClient({
				baseURL: this.container.client.BaseURL,
				token: this.container.client.OAuthAccessToken,
				addonUUID: this.container.client.AddonUUID,
				addonSecretKey: this.container.client.AddonSecretKey,
				actionUUID: this.container.client.ActionUUID,
			});
		}

		return this._papiClient;
	}


	constructor()
	{
		super();
	}
}
