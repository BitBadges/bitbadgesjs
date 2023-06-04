import { NumberType } from "bitbadgesjs-proto"

const MsgUpdatePermissionsValueType = [
  { name: 'creator', type: 'string' },
  { name: 'collectionId', type: 'string' },
  { name: 'permissions', type: 'string' },
]

export const MSG_UPDATE_PERMISSIONS_TYPES = {
  MsgValue: MsgUpdatePermissionsValueType,
}

export function createMsgUpdatePermissions<T extends NumberType>(
  creator: string,
  collectionId: T,
  permissions: T,
) {
  return {
    type: 'badges/UpdatePermissions',
    value: {
      creator,
      collectionId: collectionId.toString(),
      permissions: permissions.toString(),
    },
  }
}
