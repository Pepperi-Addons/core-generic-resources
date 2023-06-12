import { AddonDataScheme } from "@pepperi-addons/papi-sdk";
import config from '../addon.config.json';
import { UDC_INDEX_NAME } from "./constants";


const accountEmployeesSchema: AddonDataScheme = {
	Name: "account_employees",
	Type: 'papi',
	SyncData:
	{
		Sync: true,
		Associative:
		{
			FieldID1: 'Account',
			FieldID2: 'User'
		}
	},
	Fields:
	{
		Key:
		{
			"Type": "String",
			"Unique": true
		},
		Account:
		{
			"Type": "Resource",
			"Resource": "accounts",
			"AddonUUID": config.AddonUUID
		},
		User:
		{
			"Type": "Resource",
			"Resource": "users",
			"AddonUUID": config.AddonUUID
		},
		InternalID:
		{
			"Type": "Integer",
			"Unique": true
		},
		Hidden:
		{
			"Type": "Bool"
		},
		ModificationDateTime:
		{
			"Type": "DateTime"
		},
		CreationDateTime:
		{
			"Type": "DateTime"
		},
		FromERPIntegration:
		{
			Type: "Bool"
		}
	}
}

const accountUsersSchema: AddonDataScheme = {
	Name: "account_users",
	Type: 'data',
	GenericResource: true,
	DataSourceData: {
		IndexName: UDC_INDEX_NAME
	},
	SyncData:
	{
		Sync: true,
		Associative:
		{
			FieldID1: 'Account',
			FieldID2: 'User'
		}
	},
	Fields:
	{
		Account:
		{
			Type: "Resource",
			Resource: "accounts",
			AddonUUID: config.AddonUUID,
			Indexed: true,
			IndexedFields: {
				Name: {
    				Type: "String",
    				Indexed: true
    			},
				ExternalID: {
    				Type: "String",
    				Indexed: true
    			}
			},
			ApplySystemFilter: true
		},
		User:
		{
			Type: "Resource",
			Resource: "users",
			AddonUUID: config.AddonUUID,
			Indexed: true,
			IndexedFields: {
				Name: {
    				Type: "String",
    				Indexed: true
    			},
				ExternalID: {
    				Type: "String",
    				Indexed: true
    			}
			},
			ApplySystemFilter: true
		}
	}
}

const accountBuyersSchema: AddonDataScheme = {
	Name: "account_buyers",
	Type: 'data',
	GenericResource: true,
	DataSourceData: {
		IndexName: UDC_INDEX_NAME
	},
	SyncData:
	{
		Sync: true,
		Associative:
		{
			FieldID1: 'Account',
			FieldID2: 'User'
		}
	},
	Fields:
	{
		Account:
		{
			Type: "Resource",
			Resource: "accounts",
			AddonUUID: config.AddonUUID,
			Indexed: true,
			IndexedFields: {
				Name: {
    				Type: "String",
    				Indexed: true
    			},
				ExternalID: {
    				Type: "String",
    				Indexed: true
    			}
			},
			ApplySystemFilter: true
		},
		User:
		{
			Type: "Resource",
			Resource: "users",
			AddonUUID: config.AddonUUID,
			Indexed: true,
			IndexedFields: {
				Name: {
    				Type: "String",
    				Indexed: true
    			},
				ExternalID: {
    				Type: "String",
    				Indexed: true
    			}
			},
			ApplySystemFilter: true
		}
	}
}

const catalogsSchema: AddonDataScheme = {
	Name: "catalogs",
	Type: 'papi',
	SyncData:
    {
    	Sync: true,
    },
	Fields:
    {
    	Key:
		{
			Type: "String",
			Unique: true
		},
    	InternalID: {
    		"Type": "Integer",
    		"Unique": true
    	},
    	CreationDateTime: {
    		"Type": "DateTime"
    	},
    	Description: {
    		"Type": "String"
    	},
    	ExpirationDate: {
    		"Type": "DateTime"
    	},
    	IsActive: {
    		"Type": "Bool"
    	},
    	ExternalID: {
    		"Type": "String",
    		"Unique": true
    	},
    	ModificationDateTime: {
    		"Type": "DateTime"
    	},
    	Hidden: {
    		"Type": "Bool",
    		"Unique": false
    	}
    }
}

const accountsSchema: AddonDataScheme = {
	Name: "accounts",
	Type: 'papi',
	SyncData:
    {
    	Sync: true,
    },
	Fields:
    {
    	Key:
		{
			"Type": "String",
			"Unique": true
		},
    	"TypeDefinitionID": {
    		"Type": "Integer"
    	},
    	"InternalID": {
    		"Type": "Integer",
    		"Unique": true
    	},
    	"Discount": {
    		"Type": "Double"
    	},
    	"Email": {
    		"Type": "String"
    	},
    	"Street": {
    		"Type": "String"
    	},
    	"ExternalID": {
    		"Type": "String",
    		"Unique": true
    	},
    	"ModificationDateTime": {
    		"Type": "DateTime"
    	},
    	"Latitude": {
    		"Type": "Double"
    	},
    	"Name": {
    		"Type": "String"
    	},
    	"Phone": {
    		"Type": "String"
    	},
    	"Hidden": {
    		"Type": "Bool"
    	},
    	"ZipCode": {
    		"Type": "String"
    	},
    	"City": {
    		"Type": "String"
    	},
    	"Longitude": {
    		"Type": "Double"
    	},
    	"Type": {
    		"Type": "String"
    	},
    	"CreationDateTime": {
    		"Type": "DateTime"
    	},
    	"State": {
    		"Type": "String"
    	},
    	"Note": {
    		"Type": "String"
    	},
    	"Country": {
    		"Type": "String"
    	}
    }
}

const contactsSchema: AddonDataScheme = {
	Name: "contacts",
	Type: 'papi',
	SyncData:
    {
    	Sync: true,
    },
	Fields:
    {
    	Key:
		{
			"Type": "String",
			"Unique": true
		},
    	"InternalID": {
    		"Type": "Integer",
    		"Unique": true
    	},
    	"Status": {
    		"Type": "Integer"
    	},
    	"TypeDefinitionID": {
    		"Type": "Integer"
    	},
    	"Email": {
    		"Type": "String"
    	},
    	"FirstName": {
    		"Type": "String"
    	},
    	"ExternalID": {
    		"Type": "String",
    		"Unique": true
    	},
    	"ModificationDateTime": {
    		"Type": "DateTime"
    	},
    	"Mobile": {
    		"Type": "String"
    	},
    	"Role": {
    		"Type": "String"
    	},
    	"CreationDateTime": {
    		"Type": "DateTime"
    	},
    	"Hidden": {
    		"Type": "Bool"
    	},
    	"LastName": {
    		"Type": "String",
    		"Unique": false
    	}
    }
}

const employeesSchema: AddonDataScheme = {
	Name: "employees",
	Type: 'papi',
	SyncData:
    {
    	Sync: true,
    },
	Fields:
    {
    	Key:
		{
			"Type": "String",
			"Unique": true
		},
    	InternalID: {
    		"Type": "Integer",
    		"Unique": true
    	},
    	CreationDateTime: {
    		"Type": "DateTime"
    	},
    	Email: {
    		"Type": "String"
    	},
    	FirstName: {
    		"Type": "String"
    	},
    	Name: {
    		"Type": "String"
    	},
    	ExternalID: {
    		"Type": "String",
    		"Unique": true
    	},
    	ModificationDateTime: {
    		"Type": "DateTime"
    	},
    	Hidden: {
    		"Type": "Bool"
    	},
    	LastName: {
    		"Type": "String"
    	},
    	Mobile: {
    		"Type": "String"
    	},
		Phone: {
			"Type": "String"
		},
    	Profile: {
    		Type: "Resource",
    		Resource: "profiles",
    		AddonUUID: config.AddonUUID,
    	},
    	Role: {
    		Type: "Resource",
    		Resource: "roles",
    		AddonUUID: config.AddonUUID,	
    	}
    }
}

const usersSchema: AddonDataScheme = {
	Name: 'users',
	Type: 'data',
	GenericResource: true,
	DataSourceData: {
		IndexName: UDC_INDEX_NAME
	},
	SyncData:
    {
    	Sync: true,
    },
	Fields:
    {
    	Email: {
    		Type: "String"
    	},
    	FirstName: {
    		Type: "String"
    	},
    	ExternalID: {
    		Type: "String",
    		Unique: true
    	},
    	LastName: {
    		Type: "String"
    	},
    	Name: {
    		Type: "String"
    	},
    	Mobile: {
    		Type: "String"
    	},
    	Phone: {
    		Type: "String"
    	},
    	Profile: {
    		Type: "Resource",
    		Resource: "profiles",
    		AddonUUID: config.AddonUUID,
    		Indexed: true,
    		IndexedFields: {
    			Name: {
    				Type: "String",
    				Indexed: true
    			}
    		}
    	},
    	UserType: {
    		Type: "String"
    	}
    }
}

const itemsSchema: AddonDataScheme = {
	Name: "items",
	Type: 'papi',
	SyncData:
    {
    	Sync: true,
    },
	Fields:
    {
    	Key:
		{
			"Type": "String",
			"Unique": true
		},
    	"InternalID": {
    		"Type": "Integer",
    		"Unique": true
    	},
    	"ExternalID": {
    		"Type": "String",
    		"Unique": true
    	},
    	"ModificationDateTime": {
    		"Type": "DateTime"
    	},
    	"Prop7": {
    		"Type": "String"
    	},
    	"Prop8": {
    		"Type": "String"
    	},
    	"UPC": {
    		"Type": "String"
    	},
    	"Prop9": {
    		"Type": "String"
    	},
    	"Image": {
    		"Type": "String"
    	},
    	"Prop3": {
    		"Type": "String"
    	},
    	"MainCategory": {
    		"Type": "String"
    	},
    	"Prop4": {
    		"Type": "String"
    	},
    	"Prop5": {
    		"Type": "String"
    	},
    	"Name": {
    		"Type": "String"
    	},
    	"Prop6": {
    		"Type": "String"
    	},
    	"Prop1": {
    		"Type": "String"
    	},
    	"Prop2": {
    		"Type": "String"
    	},
    	"Hidden": {
    		"Type": "Bool"
    	},
    	"CostPrice": {
    		"Type": "Double"
    	},
    	"AllowDecimal": {
    		"Type": "Bool"
    	},
    	"CreationDateTime": {
    		"Type": "DateTime"
    	},
    	"LongDescription": {
    		"Type": "String"
    	},
    	"ParentExternalID": {
    		"Type": "String"
    	},
    	"Price": {
    		"Type": "Double"
    	}
    }
}

const profilesSchema: AddonDataScheme = {
	Name: "profiles",
	Type: 'papi',
	SyncData:
    {
    	Sync: true,
    },
	Fields:
    {
    	Key:
		{
			Type: "String",
			Unique: true
		
    	},
    	InternalID:
		{
			Type: "Integer",
			Unique: true
		},
    	Name:
		{
			Type: "String"
		},
    	ParentInternalID:
		{
			Type: "Integer"
		},
    }
}

const rolesSchema: AddonDataScheme = {
	Name: "roles",
	Type: 'papi',
	SyncData:
    {
    	Sync: true,
    },
	Fields:
    {
    	Key:
		{
			Type: "String",
			Unique: true
		},
    	Name:
		{
    		"Type": "String"
    	},
    	ParentInternalID:
		{
    		"Type": "String"
    	},
    }
}

const roleRolesSchema: AddonDataScheme = {
	Name: "role_roles",
	Type: "data",
	GenericResource: true,
	SyncData:
	{
		Sync: true,
	},
	Fields:
	{
		Key: {
			Type: "String",
			Unique: true
		},
		Role: {
    		Type: "Resource",
    		Resource: "role",
    		AddonUUID: config.AddonUUID,
			ApplySystemFilter: true,
    	},
		ParentRole:{
			Type: "Resource",
    		Resource: "role",
    		AddonUUID: config.AddonUUID,
			ApplySystemFilter: true,
		}
	}
}

export const resourceNameToSchemaMap: { [key: string]: AddonDataScheme } = {
	'account_employees': accountEmployeesSchema,
	'account_users': accountUsersSchema,
	'account_buyers': accountBuyersSchema,
	'catalogs': catalogsSchema,
	'accounts': accountsSchema,
	'contacts': contactsSchema,
	'items': itemsSchema,
	'profiles': profilesSchema,
	'roles': rolesSchema,
	'users': usersSchema,
	'employees': employeesSchema,
	'role_roles': roleRolesSchema,
}
