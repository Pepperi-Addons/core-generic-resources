import { PapiRole, RoleRole } from "../../services/getters/rolesGetter.service";
import { TestBody } from "../../services/integrationTests/entities";


function createTestData(roles: PapiRole[], fromPage?: number): TestBody 
{
	const testData: TestBody = {
		TestInputObjects: {
			roles: roles
		},
		IsTest: true,
		...(fromPage && { fromPage: fromPage })
	};
	return testData;
}

const numberOfRolesHardLimit = 100;

export const RoleRolesTestData: { [key in "twoRoots" |
    "twoRootsOneChildEach" |
    "singleRootWithTwoChildren" |
    "singleRootWithChildAndGrandchild" |
    "singleRootManyIndirectDescendants"
    ]: { TestInput: TestBody, ExpectedResult: RoleRole[] }
} =
{
	twoRoots:
    {
    	TestInput: createTestData([
    		{
    			"InternalID": "5701",
    			"ParentInternalID": undefined
    		},
    		{
    			"InternalID": "5703",
    			"ParentInternalID": undefined
    		}
    	]),
    	ExpectedResult: []
    }
	,
	twoRootsOneChildEach:
    {
    	TestInput: createTestData(
    		[
    			{
    				"InternalID": "5701",
    				"ParentInternalID": undefined
    			},
    			{
    				"InternalID": "5703",
    				"ParentInternalID": undefined
    			},
    			{
    				"InternalID": "5702",
    				"ParentInternalID": "5701"
    			},
    			{
    				"InternalID": "5704",
    				"ParentInternalID": "5703"
    			}
    		]),
    	ExpectedResult: [
    		{
    			"Role": "5702",
    			"ParentRole": "5701",
    			"Key": "5702_5701"
    		},
    		{
    			"Role": "5704",
    			"ParentRole": "5703",
    			"Key": "5704_5703"
    		}
    	]
    },
	singleRootWithTwoChildren:
    {
    	TestInput: createTestData(
    		[
    			{
    				"InternalID": "5701",
    				"ParentInternalID": undefined
    			},
    			{
    				"InternalID": "5702",
    				"ParentInternalID": "5701"
    			},
    			{
    				"InternalID": "5703",
    				"ParentInternalID": "5701"
    			}
    		]),
    	ExpectedResult: [
    		{
    			"Role": "5702",
    			"ParentRole": "5701",
    			"Key": "5702_5701"
    		},
    		{
    			"Role": "5703",
    			"ParentRole": "5701",
    			"Key": "5703_5701"
    		}
    	]
    },
	singleRootWithChildAndGrandchild: {
		TestInput: createTestData(
			[
				{
					"InternalID": "5701",
					"ParentInternalID": undefined
				},
				{
					"InternalID": "5702",
					"ParentInternalID": "5701"
				},
				{
					"InternalID": "5703",
					"ParentInternalID": "5702"
				}
			]),
		ExpectedResult: [
			{
				"Role": "5702",
				"ParentRole": "5701",
				"Key": "5702_5701"
			},
			{
				"Role": "5703",
				"ParentRole": "5702",
				"Key": "5703_5702"
			},
			{
				"Role": "5703",
				"ParentRole": "5701",
				"Key": "5703_5701"
			}
		]
	},

	singleRootManyIndirectDescendants: {
		TestInput: createTestData(
			[
				{
					"InternalID": "5701",
					"ParentInternalID": undefined
				},

				// Use a for loop to create 500 roles where each is the child of the previous one
				...Array.from(Array(numberOfRolesHardLimit).keys()).map((i) => 
				{
					return {
						"InternalID": (5702 + i).toString(),
						"ParentInternalID": (5702 + i - 1).toString()
					}
				})
			]),
		ExpectedResult: [
			// Use a for loop to create RoleRole objects for each Role and each of its ancestors
			// i.e. create a RoleRole for the root and child A, for root and child A' (child of A), etc.
			...Array.from(Array(numberOfRolesHardLimit).keys()).map((i) => 
			{
				const res: RoleRole[] = []
				for (let j = 0; j <= i; j++) 
				{
					const role: RoleRole = {
						"Role": `${5701 + i + 1}`,
						"ParentRole": `${5701 + j}`,
						"Key": `${5701 + i + 1}_${5701 + j}`
					}

					res.push(role);
				}
				return res;
			}).flat()
		]
	}
}
