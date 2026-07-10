import "@stdlib/gas-payments"
import "errors"
import "messages"
import "storage"

const MIN_CLAIM_MESSAGE_VALUE = ton("0.08")
const JETTON_TRANSFER_MESSAGE_VALUE = ton("0.06")
const JETTON_FORWARD_TON_AMOUNT = ton("0.001")
const RESET_DELAY_SECONDS = 86400

type AllowedMessage = ClaimRequest | SetPaused | RotateSigner | SetDistributionWallet | ResolvePending

fun requireAdmin(sender: address, admin: address) {
    assert (sender == admin) throw ERROR_UNAUTHORIZED;
}

fun buildAuthorization(
    claimant: address,
    claimId: uint64,
    amount: coins,
    validAfter: uint64,
    expiresAt: uint64,
): ClaimAuthorization {
    return {
        domain: CLAIM_AUTH_DOMAIN,
        version: CLAIM_AUTH_VERSION,
        contractAddress: contract.getAddress(),
        claimant,
        claimId,
        amount,
        validAfter,
        expiresAt,
    };
}

fun onInternalMessage(in: InMessage) {
    val msg = lazy AllowedMessage.fromSlice(in.body);

    match (msg) {
        ClaimRequest => {
            var storage = lazy ShoreClaimStorage.load();
            assert (!storage.paused) throw ERROR_PAUSED;
            assert (msg.amount > 0) throw ERROR_INVALID_AMOUNT;
            assert (in.valueCoins >= MIN_CLAIM_MESSAGE_VALUE) throw ERROR_INSUFFICIENT_TON;

            val now = blockchain.now();
            assert (msg.validAfter <= now) throw ERROR_AUTHORIZATION_FROM_FUTURE;
            assert (msg.expiresAt >= now) throw ERROR_AUTHORIZATION_EXPIRED;
            assert (storage.getClaim(msg.claimId) == null) throw ERROR_CLAIM_ALREADY_EXISTS;

            val authorization = buildAuthorization(
                in.senderAddress,
                msg.claimId,
                msg.amount,
                msg.validAfter,
                msg.expiresAt,
            );
            assert (
                isSignatureValid(
                    authorization.toCell().hash(),
                    msg.signature as slice,
                    storage.signerPublicKey,
                )
            ) throw ERROR_INVALID_SIGNATURE;

            storage.setClaim(msg.claimId, {
                claimant: in.senderAddress,
                amount: msg.amount,
                validAfter: msg.validAfter,
                expiresAt: msg.expiresAt,
                status: CLAIM_STATUS_PENDING,
            });
            storage.save();

            val emptyForwardPayload = beginCell().storeBool(false).endCell().beginParse();
            val transfer = createMessage({
                bounce: BounceMode.Only256BitsOfBody,
                dest: storage.distributionJettonWallet,
                value: JETTON_TRANSFER_MESSAGE_VALUE,
                body: JettonTransfer {
                    queryId: msg.claimId,
                    jettonAmount: msg.amount,
                    transferRecipient: in.senderAddress,
                    sendExcessesTo: contract.getAddress(),
                    customPayload: null,
                    forwardTonAmount: JETTON_FORWARD_TON_AMOUNT,
                    forwardPayload: emptyForwardPayload,
                },
            });
            transfer.send(SEND_MODE_PAY_FEES_SEPARATELY | SEND_MODE_BOUNCE_ON_ACTION_FAIL);
        }

        SetPaused => {
            var storage = lazy ShoreClaimStorage.load();
            requireAdmin(in.senderAddress, storage.admin);
            storage.paused = msg.paused;
            storage.save();
        }

        RotateSigner => {
            var storage = lazy ShoreClaimStorage.load();
            requireAdmin(in.senderAddress, storage.admin);
            storage.signerPublicKey = msg.signerPublicKey;
            storage.save();
        }

        SetDistributionWallet => {
            var storage = lazy ShoreClaimStorage.load();
            requireAdmin(in.senderAddress, storage.admin);
            storage.distributionJettonWallet = msg.distributionJettonWallet;
            storage.save();
        }

        ResolvePending => {
            var storage = lazy ShoreClaimStorage.load();
            requireAdmin(in.senderAddress, storage.admin);

            val existing = storage.getClaim(msg.claimId);
            assert (existing != null) throw ERROR_CLAIM_NOT_FOUND;
            var claim = existing!;
            assert (claim.status == CLAIM_STATUS_PENDING) throw ERROR_CLAIM_NOT_PENDING;

            if (msg.resolution == CLAIM_RESOLUTION_COMPLETE) {
                claim.status = CLAIM_STATUS_COMPLETED;
                storage.setClaim(msg.claimId, claim);
            } else if (msg.resolution == CLAIM_RESOLUTION_RESET) {
                assert (storage.paused) throw ERROR_RESET_REQUIRES_PAUSE;
                assert (
                    blockchain.now() > claim.expiresAt + RESET_DELAY_SECONDS
                ) throw ERROR_RESET_DELAY_ACTIVE;
                storage.deleteClaim(msg.claimId);
            } else {
                throw ERROR_INVALID_RESOLUTION;
            }
            storage.save();
        }

        else => {
            assert (in.body.isEmpty()) throw 0xFFFF;
        }
    }
}

fun onBouncedMessage(in: InMessageBounced) {
    var storage = lazy ShoreClaimStorage.load();
    if (in.senderAddress != storage.distributionJettonWallet) {
        return;
    }

    in.bouncedBody.skipBouncedPrefix();
    if (in.bouncedBody.preloadUint(32) != 0x0f8a7ea5) {
        return;
    }

    val transfer = lazy JettonTransfer.fromSlice(in.bouncedBody);
    val existing = storage.getClaim(transfer.queryId);
    if (existing == null) {
        return;
    }

    val claim = existing!;
    if (
        claim.status == CLAIM_STATUS_PENDING &&
        claim.amount == transfer.jettonAmount
    ) {
        storage.deleteClaim(transfer.queryId);
        storage.save();
    }
}

get fun get_claim_status(claimId: int): int {
    val storage = lazy ShoreClaimStorage.load();
    val claim = storage.getClaim(claimId as uint64);
    return claim == null ? 0 : claim!.status;
}

get fun get_claim_details(claimId: int): (address, int, int, int, int) {
    val storage = lazy ShoreClaimStorage.load();
    val existing = storage.getClaim(claimId as uint64);
    assert (existing != null) throw ERROR_CLAIM_NOT_FOUND;
    val claim = existing!;
    return (
        claim.claimant,
        claim.amount,
        claim.validAfter,
        claim.expiresAt,
        claim.status,
    );
}

get fun get_config(): (address, int, address, int) {
    val storage = lazy ShoreClaimStorage.load();
    return (
        storage.admin,
        storage.signerPublicKey,
        storage.distributionJettonWallet,
        storage.paused ? 1 : 0,
    );
}

get fun get_authorization_hash(
    claimant: address,
    claimId: int,
    amount: int,
    validAfter: int,
    expiresAt: int,
): int {
    val authorization = buildAuthorization(
        claimant,
        claimId as uint64,
        amount,
        validAfter as uint64,
        expiresAt as uint64,
    );
    return authorization.toCell().hash();
}
