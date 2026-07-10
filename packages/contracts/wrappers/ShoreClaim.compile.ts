import type { CompilerConfig } from "@ton/blueprint";

export const compile: CompilerConfig = {
  lang: "tolk",
  entrypoint: "contracts/shore_claim.tolk",
  withStackComments: true,
  withSrcLineComments: true,
  experimentalOptions: "",
};
