const MsgUpdatePermissionsValueType = [
  { name: 'creator', type: 'string' },
  { name: 'badgeId', type: 'uint64' },
  { name: 'permissions', type: 'uint64' },
]

export const MSG_UPDATE_PERMISSIONS_TYPES = {
  MsgValue: MsgUpdatePermissionsValueType,
}

export function createMsgUpdatePermissions(
  creator: string,
  badgeId: number,
  permissions: number,
) {
  return {
    type: 'badges/UpdatePermissions',
    value: {
      creator,
      badgeId,
      permissions,
    },
  }
}
