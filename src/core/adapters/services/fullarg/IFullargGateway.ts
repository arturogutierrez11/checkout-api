import {
  CreateFullargOrderInput,
  CreatedFullargOrder,
} from "../../../entities/fullarg/FullargOrder";

export const FULLARG_GATEWAY = Symbol("FULLARG_GATEWAY");

export interface IFullargGateway {
  createOrder(input: CreateFullargOrderInput): Promise<CreatedFullargOrder>;
}
