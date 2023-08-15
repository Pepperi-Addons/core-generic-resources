import { AddonData } from "@pepperi-addons/papi-sdk";
import { ABaseCoreResourcesTests } from "./aBaseCoreResourcesTests.test";
import { GenericResourceTestInput } from "./entities";

export class WhereClauseTests extends ABaseCoreResourcesTests 
{

	title = 'Where Clause Tests';

	protected _schemaFields: string[] | undefined;
	protected _genericResourceObjects: AddonData[] | undefined;
	protected _testData: GenericResourceTestInput | undefined;

	tests(describe: (suiteTitle: string, func: () => void) => void,
		it: (name: string, fn: Mocha.Func) => void,
		expect: Chai.ExpectStatic,
		/*after: ((fn: Mocha.Func | Mocha.AsyncFunc) => void),
        afterEach: ((fn: Mocha.Func | Mocha.AsyncFunc) => void),
        before: ((fn: Mocha.Func | Mocha.AsyncFunc) => void),
        beforeEach: ((fn: Mocha.Func | Mocha.AsyncFunc) => void)*/): void 
	{
		this.referenceFieldTests('Account', describe, it, expect);
		this.referenceFieldTests('User', describe, it, expect);
	}

	protected referenceFieldTests(field: string, describe: (suiteTitle: string, func: () => void) => void, it: (name: string, fn: Mocha.Func) => void, expect: Chai.ExpectStatic)
	{
		describe(`${field} field tests`, async () => 
		{
			it(`Get account_buyers by ${field} Key and Name`, async () => 
			{
				const accountBuyers = await this.coreResourcesTestsService.getGenericResource('account_buyers');

				if(accountBuyers.length > 0)
				{
					const firstObjectFieldKey = accountBuyers[0][field];
					const randomKey = this.coreResourcesTestsService.generateUUID();

					let accountBuyersByField = await this.coreResourcesTestsService.getGenericResource('account_buyers', {
						where: `${field}='${firstObjectFieldKey}'`
					});

					expect(accountBuyersByField).to.be.an('array').with.lengthOf.above(0);
					accountBuyersByField.forEach(accountBuyer => 
					{
						expect(accountBuyer[field]).to.equal(firstObjectFieldKey);
					})

					// testing get account buyers by internal field key
					const accountBuyersByFieldInternalKey = await this.coreResourcesTestsService.getGenericResource('account_buyers', {
						where: `${field}.Key='${firstObjectFieldKey}'`
					});

					expect(accountBuyersByFieldInternalKey).to.be.an('array').with.lengthOf.above(0);
					accountBuyersByFieldInternalKey.forEach(accountBuyer => 
					{
						expect(accountBuyer[field]).to.equal(firstObjectFieldKey);
					})

					// random UUID should not find account buyers
					accountBuyersByField = await this.coreResourcesTestsService.getGenericResource('account_buyers', {
						where: `${field}='${randomKey}'`
					});

					expect(accountBuyersByField).to.be.an('array').with.lengthOf(0);

					// testing get account buyers by internal field name
					const accountBuyersNames = await this.coreResourcesTestsService.getGenericResource('account_buyers', {
						fields: [`${field}.Name`]
					});
					const firstInternalNameValue = accountBuyersNames[0][`${field}.Name`];
					const accountBuyersByFieldInternalName = await this.coreResourcesTestsService.getGenericResource('account_buyers', {
						where: `${field}.Name='${firstInternalNameValue}'`,
						fields: [`${field}.Name`]
					});

					accountBuyersByFieldInternalName.forEach(accountBuyer => 
					{
						expect(accountBuyer[`${field}.Name`]).to.equal(firstInternalNameValue);
					})

				}
			})

			it(`Search account_buyers by ${field} Key and Name`, async () => 
			{
				const accountBuyers = (await this.coreResourcesTestsService.searchGenericResource('account_buyers', {})).Objects;

				if(accountBuyers.length > 0)
				{
					const firstObjectFieldKey = accountBuyers[0][field];
					const randomKey = this.coreResourcesTestsService.generateUUID();

					let accountBuyersByField = (await this.coreResourcesTestsService.searchGenericResource('account_buyers', {
						Where: `${field}='${firstObjectFieldKey}'`
					})).Objects;

					expect(accountBuyersByField).to.be.an('array').with.lengthOf.above(0);
					accountBuyersByField.forEach(accountBuyer => 
					{
						expect(accountBuyer[field]).to.equal(firstObjectFieldKey);
					})

					// testing search account buyers by internal field key
					const accountBuyersByFieldInternalKey = (await this.coreResourcesTestsService.searchGenericResource('account_buyers', {
						Where: `${field}.Key='${firstObjectFieldKey}'`
					})).Objects;

					expect(accountBuyersByFieldInternalKey).to.be.an('array').with.lengthOf.above(0);
					accountBuyersByFieldInternalKey.forEach(accountBuyer => 
					{
						expect(accountBuyer[field]).to.equal(firstObjectFieldKey);
					})

					// random UUID should not find account buyers
					accountBuyersByField = (await this.coreResourcesTestsService.searchGenericResource('account_buyers', {
						Where: `${field}='${randomKey}'`
					})).Objects;

					expect(accountBuyersByField).to.be.an('array').with.lengthOf(0);

					// testing search account buyers by internal field name
					const accountBuyersNames = (await this.coreResourcesTestsService.searchGenericResource('account_buyers', {
						Fields: [`${field}.Name`]
					})).Objects;
					const firstInternalNameValue = accountBuyersNames[0][`${field}.Name`];
					const accountBuyersByFieldInternalName = (await this.coreResourcesTestsService.searchGenericResource('account_buyers', {
						Where: `${field}.Name='${firstInternalNameValue}'`,
						Fields: [`${field}.Name`]
					})).Objects;

					accountBuyersByFieldInternalName.forEach(accountBuyer => 
					{
						expect(accountBuyer[`${field}.Name`]).to.equal(firstInternalNameValue);
					})

				}
			})
		})
	}
}
