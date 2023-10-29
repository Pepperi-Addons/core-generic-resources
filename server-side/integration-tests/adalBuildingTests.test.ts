import { FindOptions } from "@pepperi-addons/papi-sdk";
import { RoleRole } from "../services/getters/roleRolesGetter.service";
import { TestBody } from "../services/integrationTests/entities";
import { ABaseCoreResourcesTests } from "./aBaseCoreResourcesTests.test";
import { RoleRolesTestData } from "./testsData/roleRoles";
import { CoreResourcesTestsService } from "./services/coreResources.service";

export class AdalBuildingTests extends ABaseCoreResourcesTests
{
	title = 'Adal Building Tests';

	tests(describe: (suiteTitle: string, func: () => void) => void,
		it: (name: string, fn: Mocha.Func) => void,
		expect: Chai.ExpectStatic
	): void 
	{
		describe('Build ADAL tables tests', async () => 
		{
			it('Install buyer management addon', async () =>
			{
				if(!(await this.coreResourcesTestsService.isBuyerManagementInstalled()))
				{
					await this.coreResourcesTestsService.installBuyerManagementAddon();
				}
			});
			it('Run post upgrade operations', async () =>
			{
				await this.coreResourcesTestsService.runPostUpgradeOperations();
			});

			it('Build users adal table', async () => 
			{
				const papiUsersList = await this.coreResourcesTestsService.getPapiResourceObjects('users');
				const activeBuyersList = (await this.coreResourcesTestsService.searchAllAdalGenericResourceObjects('Buyers')).filter(buyer => buyer.Active);
				let keys = papiUsersList.map(user => user.UUID);
				keys = keys.concat(activeBuyersList.map(buyer => buyer.Key));
				const uniquePapiKeys = new Set(keys);
				await this.coreResourcesTestsService.resetTable('users'); // reset the table before build
				const buildTableResponse = await this.coreResourcesTestsService.buildTable('users');
				await this.coreResourcesTestsService.asyncHelperService.waitForAsyncJob(this.ASYNC_JOB_AWAIT);
				const adalUsersList = await this.coreResourcesTestsService.searchAllAdalGenericResourceObjects('users');
				expect(buildTableResponse).to.have.property('success').that.is.true;
				expect(adalUsersList).to.be.an('array').with.lengthOf(uniquePapiKeys.size);
				expect(adalUsersList[0]).to.have.property('Key').that.is.a('string').and.is.not.empty;
				expect(adalUsersList[0]).to.have.property('Email').that.is.a('string').and.is.not.empty;
				expect(adalUsersList[0]).to.have.property('FirstName').that.is.a('string');
				expect(adalUsersList[0]).to.have.property('LastName').that.is.a('string');
				expect(adalUsersList[0]).to.have.property('Name').that.is.a('string');
				expect(adalUsersList[0]).to.have.property('ExternalID').that.is.a('string');
				expect(adalUsersList[0]).to.have.property('Mobile').that.is.a('string');
				expect(adalUsersList[0]).to.have.property('Phone').that.is.a('string');
				expect(adalUsersList[0]).to.have.property('Profile').that.is.a('string');
				expect(adalUsersList[0]).to.have.property('UserType').that.is.a('string').and.is.not.empty;
			});

			it('Build account_users adal table', async () => 
			{
				const papiAccountUsersList = await this.coreResourcesTestsService.getPapiResourceObjects('account_users');
				const papiAccountBuyersList = await this.coreResourcesTestsService.getPapiResourceObjects('account_buyers');
				let papiKeys = papiAccountUsersList.map(accountUser => accountUser.UUID);
				papiKeys = papiKeys.concat(papiAccountBuyersList.map(accountBuyer => accountBuyer.UUID));
				const papiUniqueKeys = new Set(papiKeys);
				await this.coreResourcesTestsService.resetTable('account_users'); // reset the table before build
				const buildTableResponse = await this.coreResourcesTestsService.buildTable('account_users');
				await this.coreResourcesTestsService.asyncHelperService.waitForAsyncJob(this.ASYNC_JOB_AWAIT);
				const adalAccountUsersList = await this.coreResourcesTestsService.searchAllAdalGenericResourceObjects('account_users');
				const adalUniqueKeys = new Set(adalAccountUsersList.map(accountUser => accountUser.Key));
				console.log(this.coreResourcesTestsService.getDifference(adalUniqueKeys, papiUniqueKeys));
				expect(buildTableResponse).to.have.property('success').that.is.true;
				expect(adalAccountUsersList).to.be.an('array').with.lengthOf(papiKeys.length);
				expect(adalAccountUsersList[0]).to.have.property('Key').that.is.a('string').and.is.not.empty;
				expect(adalAccountUsersList[0]).to.have.property('Account').that.is.a('string').and.is.not.empty;
				expect(adalAccountUsersList[0]).to.have.property('User').that.is.a('string').and.is.not.empty;
			});

			it('Build roles adal table', async () => 
			{
				const papiRolesList = await this.coreResourcesTestsService.getPapiResourceObjects('roles');
				const adalRoleRoles = await this.coreResourcesTestsService.searchAllAdalGenericResourceObjects('role_roles');
				const papiInternalIDs = papiRolesList.map(role => role.InternalID);
				const papiUniqueInternalIDs = new Set(papiInternalIDs);

				// reset roles table before build
				await this.coreResourcesTestsService.resetTable('roles'); 
				// building roles should also rebuild role_roles, so we'll reset it as well
				await this.coreResourcesTestsService.resetTable('role_roles');

				const buildTableResponse = await this.coreResourcesTestsService.buildTable('roles');

				await this.coreResourcesTestsService.asyncHelperService.waitForAsyncJob(this.ASYNC_JOB_AWAIT);

				const adalRolesList = await this.coreResourcesTestsService.searchAllAdalGenericResourceObjects('roles');
				const adalUniqueInternalIDs = new Set(adalRolesList.map(role => role.InternalID));
				
				// logging the difference for debugging purposes
				console.log(this.coreResourcesTestsService.getDifference(adalUniqueInternalIDs, papiUniqueInternalIDs));

				expect(buildTableResponse).to.have.property('success').that.is.true;
				expect(adalRolesList).to.be.an('array').with.lengthOf(papiInternalIDs.length);

				if(adalRolesList.length > 0) 
				{
					expect(adalRolesList[0]).to.have.property('Key').that.is.a('string').and.is.not.empty;
					expect(adalRolesList[0]).to.have.property('Name').that.is.a('string').and.is.not.empty;
					expect(adalRolesList[0]).to.have.property('InternalID').that.is.a('number');
					expect(adalRolesList[0]).to.have.property('Hidden').that.is.a('boolean');
					expect(adalRolesList[0]).to.have.property('ParentInternalID');
				}

				// Ensure role_roles table was built successfully
				await this.coreResourcesTestsService.asyncHelperService.waitForAsyncJob(this.ASYNC_JOB_AWAIT);
				const currentAdalRoleRoles = await this.coreResourcesTestsService.searchAllAdalGenericResourceObjects('role_roles');
				expect(currentAdalRoleRoles).to.be.an('array').with.lengthOf(adalRoleRoles.length);

				if(currentAdalRoleRoles.length > 0)
				{
					expect(currentAdalRoleRoles[0]).to.have.property('Key').that.is.a('string').and.is.not.empty;
					expect(currentAdalRoleRoles[0]).to.have.property('Role').that.is.a('string').and.is.not.empty;
					expect(currentAdalRoleRoles[0]).to.have.property('ParentRole').that.is.a('string').and.is.not.empty;
					expect(currentAdalRoleRoles[0]).to.have.property('Hidden').that.is.a('boolean');
				}
			});

			describe('Build role_roles ADAL table', () => 
			{

				const targetAdalResourceName = 'role_roles';
				const coreResourcesTestsService = new CoreResourcesTestsService(this.papiClient);

				it('Ensure roles and role_roles schemas exist', async () => 
				{
					const schemaNames = ['roles', 'role_roles'];
					const findOptions: FindOptions = {
						where: `Name in ('${schemaNames.join("','")}')`
					};
					const schemas = await coreResourcesTestsService.papiClient.addons.data.schemes.get(findOptions);

					expect(schemas).to.be.an('array').with.lengthOf(schemaNames.length);
				});

				const testNames = Object.keys(RoleRolesTestData);
				for (const testName of testNames) 
				{
					it(`Build table using ${testName} test data`, async () => 
					{
						const { TestInput, ExpectedResult } = this.getTestData(testName);

						try 
						{
							const buildTableResponse = await coreResourcesTestsService.buildRoleRolesTable(TestInput);
							const defactoResults = await coreResourcesTestsService.getGenericResourceObjects(targetAdalResourceName) as RoleRole[];

							// Ensure the table was built successfully
							expect(buildTableResponse).to.have.property('success').that.is.true;


							// Ensure the table was built with the correct number of rows
							testRoleRoles(defactoResults, ExpectedResult);
						}
						catch (e) 
						{
							console.log(e instanceof Error ? e.message : e);
						}

					});
				}
			});

			function testRoleRoles(defactoResults: RoleRole[], expectedResults: RoleRole[]) 
			{
				//build a map of the expected results
				const expectedResultsMap = {};
				for (let i = 0; i < expectedResults.length; i++) 
				{
					expectedResultsMap[expectedResults[i].Key!] = expectedResults[i];
				}

				expect(defactoResults).to.be.an('array').with.lengthOf(expectedResults.length);

				for (let i = 0; i < defactoResults.length; i++) 
				{
					expect(defactoResults[i]).to.have.property('Key').that.is.a('string').and.to.equal(expectedResultsMap[defactoResults[i].Key!].Key);
					expect(defactoResults[i]).to.have.property('Role').that.is.a('string').and.to.equal(expectedResultsMap[defactoResults[i].Key!].Role);

					if (expectedResults[i].ParentRole) 
					{
						expect(defactoResults[i]).to.have.property('ParentRole').that.is.a('string').and.to.equal(expectedResultsMap[defactoResults[i].Key!].ParentRole);
					}
					else 
					{
						expect(defactoResults[i].ParentRole).to.be.undefined.and.to.equal(expectedResultsMap[defactoResults[i].Key!].ParentRole);
					}
				}
			}
		});
	}

	getTestData(testName: string): { TestInput: TestBody, ExpectedResult: any[] }
	{
		const testInputData: TestBody = RoleRolesTestData[testName].TestInput;
		const expectedResults: any[] = RoleRolesTestData[testName].ExpectedResult;

		return { TestInput: testInputData, ExpectedResult: expectedResults };
	}
}
