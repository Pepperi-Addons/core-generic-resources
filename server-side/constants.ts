import { Subscription } from "@pepperi-addons/papi-sdk";

import { AddonUUID } from "../addon.config.json";

export const UDC_INDEX_NAME = '122c0e9d-c240-4865-b446-f37ece866c22_data';

export const LEGACY_SETTINGS_UUID = '354c5123-a7d0-4f52-8fce-3cf1ebc95314';


export type AsyncResultObject = {
    success: boolean,
    errorMessage?: string
}

export const rolesPnsSubscription: Subscription = {
    AddonRelativeURL: "/adal/roles_changed",
    AddonUUID: AddonUUID,
    FilterPolicy: {
        Action: ['insert', 'update', 'remove'],
        AddonUUID: [AddonUUID],
        Resource: ['roles']
    },
    Name: 'roles_data_changes',
    Type: "data"
}
