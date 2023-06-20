import { FindOptions } from "@pepperi-addons/papi-sdk";
import { RoleRole } from "../services/getters/rolesGetter.service";
import { TestBody } from "../services/integrationTests/entities";
import { ABaseCoreResourcesTests } from "./aBaseCoreResourcesTests.test";
import { RoleRolesTestData } from "./testsData/roleRoles";
import { CoreResourcesService } from "./services/coreResources.service";

export class AdalBuildingTests extends ABaseCoreResourcesTests
{
	title = 'Adal Building Tests';

	tests(describe: (suiteTitle: string, func: () => void) => void,
		it: (name: string, fn: Mocha.Func) => void,
		expect: Chai.ExpectStatic,
		/*after: ((fn: Mocha.Func | Mocha.AsyncFunc) => void),
        afterEach: ((fn: Mocha.Func | Mocha.AsyncFunc) => void),
        before: ((fn: Mocha.Func | Mocha.AsyncFunc) => void),
        beforeEach: ((fn: Mocha.Func | Mocha.AsyncFunc) => void)*/): void 
	{
		describe('Build ADAL tables tests', () => 
		{
            

			it('Build users adal table', async () => 
			{
				const papiUsersList = await this.coreResourcesService.getPapiResourceObjects('users');
				const papiContactsList = await this.coreResourcesService.getPapiResourceObjects('contacts');
				await this.coreResourcesService.cleanTable('users'); // clean the table before build
				const buildTableResponse = await this.coreResourcesService.buildTable('users');
				await this.coreResourcesService.waitForAsyncJob(30);
				const adalUsersList = await this.coreResourcesService.getGenericResourceObjects('users');
				expect(buildTableResponse).to.have.property('res');
				expect(buildTableResponse.res).to.have.property('success').that.is.true;
				expect(adalUsersList).to.be.an('array').with.lengthOf(papiUsersList.length + papiContactsList.length);
				expect(adalUsersList[0]).to.have.property('Key').that.is.a('string').and.is.not.empty;
				expect(adalUsersList[0]).to.have.property('Email').that.is.a('string').and.is.not.empty;
				expect(adalUsersList[0]).to.have.property('FirstName').that.is.a('string').and.is.not.empty;
				expect(adalUsersList[0]).to.have.property('LastName').that.is.a('string').and.is.not.empty;
				expect(adalUsersList[0]).to.have.property('Name').that.is.a('string').and.is.not.empty;
				expect(adalUsersList[0]).to.have.property('ExternalID').that.is.a('string').and.is.not.empty;
				expect(adalUsersList[0]).to.have.property('Mobile').that.is.a('string');
				expect(adalUsersList[0]).to.have.property('Phone').that.is.a('string');
				expect(adalUsersList[0]).to.have.property('Profile').that.is.a('string').and.is.not.empty;
				expect(adalUsersList[0]).to.have.property('UserType').that.is.a('string').and.is.not.empty;
			});

			it('Build account_users adal table', async () => 
			{
				const papiAccountUsersList = await this.coreResourcesService.getPapiResourceObjects('account_users');
				const papiAccountBuyersList = await this.coreResourcesService.getPapiResourceObjects('account_buyers');
				await this.coreResourcesService.cleanTable('account_users'); // clean the table before build
				const buildTableResponse = await this.coreResourcesService.buildTable('account_users');
				await this.coreResourcesService.waitForAsyncJob(30);
				const adalAccountUsersList = await this.coreResourcesService.getGenericResourceObjects('account_users');
				expect(buildTableResponse).to.have.property('res');
				expect(buildTableResponse.res).to.have.property('success').that.is.true;
				expect(adalAccountUsersList).to.be.an('array').with.lengthOf(papiAccountUsersList.length + papiAccountBuyersList.length);
				expect(adalAccountUsersList[0]).to.have.property('Key').that.is.a('string').and.is.not.empty;
				expect(adalAccountUsersList[0]).to.have.property('Account').that.is.a('string').and.is.not.empty;
				expect(adalAccountUsersList[0]).to.have.property('User').that.is.a('string').and.is.not.empty;
			});

			it('Clean tables', async () => 
			{
				await this.coreResourcesService.cleanTable('users');
				await this.coreResourcesService.cleanTable('account_users');
			});

			describe('Build role_roles ADAL table', () => 
			{

				const targetAdalResourceName = 'role_roles';
				const coreResourcesService = new CoreResourcesService(this.papiClient);

				// before(async () => {
				//     console.log("BEFORE, CLEANING TABLE");
				//     await coreResourcesService.cleanTable(targetAdalResourceName);
				// });

				// afterEach(async () => {
				//     console.log("AFTER EACH, CLEANING TABLE");
				//     await coreResourcesService.cleanTable(targetAdalResourceName);
				// });

				it('Ensure roles and role_roles schemas exist', async () => 
				{
					const schemaNames = ['roles', 'role_roles'];
					const findOptions: FindOptions = {
						where: `Name in ('${schemaNames.join("','")}')`
					};
					const schemas = await coreResourcesService.papiClient.addons.data.schemes.get(findOptions);

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
							const buildTableResponse = await coreResourcesService.buildRoleRolesTable(TestInput);
							const defactoResults = await coreResourcesService.getAllGenericResourceObjects(targetAdalResourceName) as RoleRole[];

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