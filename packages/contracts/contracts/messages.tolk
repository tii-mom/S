const CLAIM_AUTH_DOMAIN = 0x53484341
const CLAIM_AUTH_VERSION = 1

const OP_CLAIM = 0x5348434c
const OP_SET_PAUSED = 0x53485041
const OP_ROTATE_SIGNER = 0x53485347
const OP_SET_DISTRIBUTION_WALLET = 0x53484a57
const OP_RESOLVE_PENDING = 0x53485253

const CLAIM_RESOLUTION_COMPLETE = 1
const CLAIM_RESOLUTION_RESET = 2

struct ClaimAuthorization {
    domain: uint32
    version: uint16
    contractAddress: address
    claimant: address
    claimId: uint64
    amount: coins
    validAfter: uint64
    expiresAt: uint64
}

struct (0x5348434c) ClaimRequest {
    claimId: uint64
    amount: coins
    validAfter: uint64
    expiresAt: uint64
    signature: bits512
}

struct (0x53485041) SetPaused {
    queryId: uint64
    paused: bool
}

struct (0x53485347) RotateSigner {
    queryId: uint64
    signerPublicKey: uint256
}

struct (0x53484a57) SetDistributionWallet {
    queryId: uint64
    distributionJettonWallet: address
}

struct (0x53485253) ResolvePending {
    queryId: uint64
    claimId: uint64
    resolution: uint8
}

type ForwardPayloadRemainder = RemainingBitsAndRefs

struct (0x0f8a7ea5) JettonTransfer {
    queryId: uint64
    jettonAmount: coins
    transferRecipient: address
    sendExcessesTo: address?
    customPayload: cell?
    forwardTonAmount: coins
    forwardPayload: ForwardPayloadRemainder
}
