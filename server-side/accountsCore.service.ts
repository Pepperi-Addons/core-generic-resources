import BaseCoreService from "./core.service";

class AccountsCoreService extends BaseCoreService
{

	protected async validateResourceBeforeReturn(resource: any): Promise<void> 
	{
		const typeDefinitionID = await this.getTypeDefinitionID();
		if(resource.TypeDefinitionID !== typeDefinitionID) 
		{
			const errorMessage = `Resource type definition ID ${resource.typeDefinitionID} does not match expected type definition ID ${typeDefinitionID}`;
			console.error(errorMessage);

			const error: any = new Error(`Could not find resource.`);
			error.code = 404;

			throw error;
		}
	}

	protected async modifyGetResourcesRequest(): Promise<void>
	{
		await this.setWhereDefinitionIDClauseOnQuery();
	}

	protected async modifySearchRequest(): Promise<void>
	{
		await this.setWhereDefinitionIDClauseOnBody();
	}

	private async setWhereDefinitionIDClauseOnBody() 
	{
		const typeDefinitionID = await this.getTypeDefinitionID();
		this.request.body.Where = `TypeDefinitionID=${typeDefinitionID}${this.request.body.Where ? ' AND (' + this.request.body.Where + ')' : ''}`;
	}

	private async setWhereDefinitionIDClauseOnQuery()
	{
		const typeDefinitionID = await this.getTypeDefinitionID();
		this.request.query.where = `TypeDefinitionID=${typeDefinitionID}${this.request.query.where ? ' AND (' + this.request.query.where + ')' : ''}`;
	}

	private async getTypeDefinitionID()
	{
		try
		{
			const accountType = await this.papiService.getAccountTypeDefinitionID();
			return accountType[0].InternalID;
		}
		catch(error)
		{
			const errorMessage = `Failed to get account type definition ID. Error: ${error instanceof Error ? error.message : 'Unknown error occurred.'}`;
			console.error(errorMessage)
			throw new Error(errorMessage);
		}
	}
}

export default AccountsCoreService;
