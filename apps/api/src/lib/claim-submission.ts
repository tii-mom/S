import { SHORE_CLAIM_MESSAGE_VALUE_NANO } from "@shore/contracts";
import { Address, Cell, loadMessageRelaxed } from "@ton/ton";

import { ApiHttpError } from "./http";

const MAX_BOC_BYTES = 24_000;
const MAX_VISITED_CELLS = 256;

export type ValidatedClaimSubmission = {
  bocHashHex: string;
  rootCount: number;
  visitedCells: number;
};

function decodeSingleRootBoc(bocBase64: string): Cell {
  let bytes: Buffer;
  try {
    bytes = Buffer.from(bocBase64, "base64");
  } catch {
    throw new ApiHttpError(
      422,
      "INVALID_TRANSACTION_BOC",
      "The wallet result is not valid base64.",
    );
  }
  if (bytes.length === 0 || bytes.length > MAX_BOC_BYTES) {
    throw new ApiHttpError(
      422,
      "INVALID_TRANSACTION_BOC_SIZE",
      "The wallet result BOC has an invalid size.",
    );
  }

  let roots: Cell[];
  try {
    roots = Cell.fromBoc(bytes);
  } catch {
    throw new ApiHttpError(
      422,
      "INVALID_TRANSACTION_BOC",
      "The wallet result is not a valid TON BOC.",
    );
  }
  if (roots.length !== 1) {
    throw new ApiHttpError(
      422,
      "INVALID_TRANSACTION_BOC_ROOTS",
      "The wallet result must contain exactly one root cell.",
    );
  }
  return roots[0]!;
}

function isExpectedInternalMessage(
  cell: Cell,
  contractAddress: Address,
  payloadHash: Buffer,
): boolean {
  try {
    const message = loadMessageRelaxed(cell.beginParse());
    if (message.info.type !== "internal") return false;
    if (!message.info.dest.equals(contractAddress)) return false;
    if (message.info.value.coins !== SHORE_CLAIM_MESSAGE_VALUE_NANO) return false;
    return message.body.hash().equals(payloadHash);
  } catch {
    return false;
  }
}

export function validateClaimSubmissionBoc(input: {
  bocBase64: string;
  contractAddress: string;
  authorizationPayloadBoc: string;
}): ValidatedClaimSubmission {
  let contractAddress: Address;
  let payload: Cell;
  try {
    contractAddress = Address.parse(input.contractAddress);
    const payloadRoots = Cell.fromBoc(Buffer.from(input.authorizationPayloadBoc, "base64"));
    if (payloadRoots.length !== 1) throw new Error("Invalid payload roots");
    payload = payloadRoots[0]!;
  } catch {
    throw new ApiHttpError(
      500,
      "CLAIM_SUBMISSION_EXPECTATION_INVALID",
      "The stored claim contract address or authorization payload is invalid.",
    );
  }

  const root = decodeSingleRootBoc(input.bocBase64);
  const stack: Cell[] = [root];
  const visited = new Set<string>();
  let matched = false;

  while (stack.length > 0) {
    const cell = stack.pop()!;
    const hashHex = cell.hash().toString("hex");
    if (visited.has(hashHex)) continue;
    visited.add(hashHex);
    if (visited.size > MAX_VISITED_CELLS) {
      throw new ApiHttpError(
        422,
        "TRANSACTION_BOC_TOO_COMPLEX",
        "The wallet result contains too many cells.",
      );
    }

    if (isExpectedInternalMessage(cell, contractAddress, payload.hash())) {
      matched = true;
      break;
    }
    for (const ref of cell.refs) stack.push(ref);
  }

  if (!matched) {
    throw new ApiHttpError(
      422,
      "CLAIM_MESSAGE_NOT_FOUND_IN_BOC",
      "The wallet result does not contain the prepared SHORE claim message.",
    );
  }

  return {
    bocHashHex: root.hash().toString("hex"),
    rootCount: 1,
    visitedCells: visited.size,
  };
}
