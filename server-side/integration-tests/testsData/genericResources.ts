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
		NonUniqueFieldID: "Parent",
	},
	{
		ResourceName: "role_roles",
		UniqueFieldID: "Key",
		NonUniqueFieldID: "Role",
	},
	{
		ResourceName: "roles",
		UniqueFieldID: "InternalID",
		NonUniqueFieldID: "ParentInternalID",
	}
];
