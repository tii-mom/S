# SHORE Contract Invariants

## 1. Status

The Tolk contracts are not implemented in Phase 0. These rules are binding requirements for implementation, tests and audit.

## 2. ShoreJetton

- Maximum initial supply is exactly `10,000,000,000 SHORE` in token smallest units.
- No administrator path may increase supply beyond the fixed cap.
- Supply and wallet balances remain internally consistent after transfer and burn.
- Invalid or unauthorized messages do not mutate supply or balances.
- Metadata administration, if retained at deployment, must be explicitly time-locked or permanently disabled before public launch.

## 3. GenesisSale

- Package price is exactly `58 TON` unless a new reviewed deployment replaces the contract before sale starts.
- Maximum packages sold is `1,333`.
- Maximum packages per buyer address is `10`.
- Each package grants exactly:
  - `100,000 SHORE` immediate allocation;
  - `2,700,000 SHORE` vesting entitlement;
  - `150,000 SHORE` per round for 18 rounds.
- A payment message can create at most one purchase record.
- Underpayment cannot create partial rights.
- Overpayment handling is deterministic and documented.
- Sale closure at Round 1 is irreversible.
- A successful payment cannot exist without a recoverable purchase entitlement.
- Administrative withdrawal cannot alter buyer allocations.

## 4. VestingController

- There are exactly 18 configured founder rounds.
- A package can claim no more than `150,000 SHORE` per eligible round.
- Total claims for a package cannot exceed `2,700,000 SHORE`.
- The same package and round cannot be confirmed twice.
- Claim state follows:

```text
eligible → pending transfer → confirmed
```

- Failed asynchronous transfer follows:

```text
pending transfer → bounced or expired → claimable again
```

- A bounce restores claimability without increasing total entitlement.
- A retry cannot produce a second successful payment for the same nonce.
- Pause prevents new state transitions but cannot delete, reduce or confiscate user rights.
- Missing off-chain eligibility proof fails closed and leaves entitlement unchanged.

## 5. CommunityDistributor

- Each round distribution root is versioned and linked to a fixed maximum allocation.
- A leaf can be claimed once.
- A proof for one network, round or address cannot be replayed in another.
- Root replacement requires the documented authority and time lock.
- Total successful claims cannot exceed the funded round pool.
- Unclaimed-token handling is deterministic and cannot be changed after the round begins without the documented governance path.

## 6. Team vesting

- Team allocation is isolated from user and community pools.
- Team rights cannot be withdrawn ahead of the published schedule.
- Team vesting administration cannot modify founder entitlements.
- Team receiver and authority changes are logged and time-locked.

## 7. Round activation

- A single application administrator cannot activate a round.
- Missing or conflicting price/action evidence fails closed.
- Activation is monotonic: Round N cannot activate after Round N+1.
- A round cannot return to locked after claims have begun.
- Activation does not by itself bypass individual claim eligibility.

## 8. Required tests

Every contract implementation includes:

- exact boundary tests;
- unauthorized-message tests;
- replay tests;
- duplicate-claim tests;
- bounce and retry tests;
- pause tests;
- total-allocation reconciliation;
- property or invariant tests;
- gas-regression reporting.

No mainnet deployment is allowed while an invariant is untested or an audit P0/P1 issue remains open.
