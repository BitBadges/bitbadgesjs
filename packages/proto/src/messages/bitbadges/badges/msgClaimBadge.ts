import * as badges from '../../../proto/badges/tx'
import { getWrappedProof, ClaimProof } from './typeUtils'

export function createMsgClaimBadge(
    creator: string,
    claimId: number,
    collectionId: number,
    whitelistProof: ClaimProof,
    codeProof: ClaimProof,
) {
    const message = new badges.bitbadges.bitbadgeschain.badges.MsgClaimBadge({
        creator,
        collectionId,
        claimId,
        whitelistProof: getWrappedProof(whitelistProof),
        codeProof: getWrappedProof(codeProof),
    })
    return {
        message,
        path: 'bitbadges.bitbadgeschain.badges.MsgClaimBadge',
    }
}