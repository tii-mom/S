const CLAIM_STATUS_PENDING = 1
const CLAIM_STATUS_COMPLETED = 2

struct ClaimRecord {
    claimant: address
    amount: coins
    validAfter: uint64
    expiresAt: uint64
    status: uint8
}

type ClaimMap = map<uint64, cell>

struct ShoreClaimStorage {
    admin: address
    signerPublicKey: uint256
    distributionJettonWallet: address
    paused: bool
    claims: ClaimMap
}

fun ShoreClaimStorage.load(): ShoreClaimStorage {
    return ShoreClaimStorage.fromCell(contract.getData());
}

fun ShoreClaimStorage.save(self) {
    contract.setData(self.toCell());
}

fun ShoreClaimStorage.getClaim(self, claimId: uint64): ClaimRecord? {
    val lookup = self.claims.get(claimId);
    if (!lookup.isFound) {
        return null;
    }
    return ClaimRecord.fromCell(lookup.loadValue());
}

fun ShoreClaimStorage.setClaim(mutate self, claimId: uint64, claim: ClaimRecord) {
    self.claims.set(claimId, claim.toCell());
}

fun ShoreClaimStorage.deleteClaim(mutate self, claimId: uint64) {
    self.claims.delete(claimId);
}
