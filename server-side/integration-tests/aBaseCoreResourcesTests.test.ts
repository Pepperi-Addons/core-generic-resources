import { BaseTest } from "@pepperi-addons/addon-testing-framework";
import { PapiClient } from "@pepperi-addons/papi-sdk";
import { CoreResourcesService } from "./services/coreResources.service";

export abstract class ABaseCoreResourcesTests extends BaseTest
{
	private _coreResourcesService: CoreResourcesService | undefined;
	private _papiClient: PapiClient | undefined;

	protected get coreResourcesService(): CoreResourcesService
	{
		if(!this._coreResourcesService)
		{
			this._coreResourcesService = new CoreResourcesService(this.papiClient);
		}

		return this._coreResourcesService;
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
