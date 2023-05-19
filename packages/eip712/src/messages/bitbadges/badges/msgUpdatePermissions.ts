const MsgUpdatePermissionsValueType = [
  { name: 'creator', type: 'string' },
  { name: 'collectionId', type: 'string' },
  { name: 'permissions', type: 'string' },
]

export const MSG_UPDATE_PERMISSIONS_TYPES = {
  MsgValue: MsgUpdatePermissionsValueType,
}

export function createMsgUpdatePermissions(
  creator: string,
  collectionId: bigint,
  permissions: bigint,
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
