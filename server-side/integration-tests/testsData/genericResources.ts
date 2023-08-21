import { GenericResourceTestInput } from "../entities";

export const genericResourcesTestsData: GenericResourceTestInput[] = [
	{
		ResourceName: "account_users",
		UniqueFieldID: "Key",
		NonUniqueFieldID: "Account",
	},
	{
		ResourceName: "users",
		UniqueFieldID: "Key",
		NonUniqueFieldID: "Name",
	},
	{
		ResourceName: "profiles",
		UniqueFieldID: "Key",
		NonUniqueFieldID: "ParentInternalID",
	},
	// {
	// 	ResourceName: "role_roles",
	// 	UniqueFieldID: "InternalID",
	// 	NonUniqueFieldID: "ParentInternalID",
	// },
	// {
	// 	ResourceName: "roles",
	// 	UniqueFieldID: "InternalID",
	// 	NonUniqueFieldID: "ParentInternalID",
	// }
];
