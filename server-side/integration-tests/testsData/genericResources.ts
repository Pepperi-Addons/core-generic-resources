import { GenericResourceTestInput } from "../entities";

export const genericResourcesTestsData: GenericResourceTestInput[] = [
	{
		ResourceName: "account_users",
		UniqueFieldID: "ExternalID",
		NonUniqueFieldID: "Account",
	},
	{
		ResourceName: "users",
		UniqueFieldID: "ExternalID",
		NonUniqueFieldID: "Name",
	},
	{
		ResourceName: "role_roles",
		UniqueFieldID: "InternalID",
		NonUniqueFieldID: "ParentInternalID",
	},
	{
		ResourceName: "roles",
		UniqueFieldID: "InternalID",
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
