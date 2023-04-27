import { AddonDataScheme } from "@pepperi-addons/papi-sdk";
import config from '../addon.config.json';


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
	...accountEmployeesSchema,
	Name: "account_users",
	Type: 'papi'
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
    	"InternalID": {
    		"Type": "Integer",
    		"Unique": true
    	},
    	"CreationDateTime": {
    		"Type": "DateTime"
    	},
    	"Email": {
    		"Type": "String"
    	},
    	"FirstName": {
    		"Type": "String"
    	},
		"Name": {
    		"Type": "String"
    	},
    	"ExternalID": {
    		"Type": "String",
    		"Unique": true
    	},
    	"ModificationDateTime": {
    		"Type": "DateTime"
    	},
    	"Hidden": {
    		"Type": "Bool"
    	},
    	"LastName": {
    		"Type": "String"
    	},
    	"Mobile": {
    		"Type": "String"
    	}
    }
}

const usersSchema: AddonDataScheme = {
	...employeesSchema,
	Name: 'users',
	Type: 'papi'
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
    	InternalID: {
    		"Type": "Integer",
    		"Unique": true
    	},
    	ParentInternalID: {
			"Type": "Integer"
		},
    }
}

export const resourceNameToSchemaMap: { [key: string]: AddonDataScheme } = {
	'account_employees': accountEmployeesSchema,
	'account_users': accountUsersSchema,
	'catalogs': catalogsSchema,
	'accounts': accountsSchema,
	'contacts': contactsSchema,
	'users': usersSchema,
	'employees': employeesSchema,
	'items': itemsSchema,
	'profiles': profilesSchema,
	'roles': rolesSchema
}
