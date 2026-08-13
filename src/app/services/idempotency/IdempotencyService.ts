import {
  BadRequestException,
  ConflictException,
  Injectable,
} from "@nestjs/common";
import { createHash } from "node:crypto";
import { InjectEntityManager } from "@nestjs/typeorm";
import { EntityManager } from "typeorm";
import { ApiErrorCode, apiError } from "../../errors/ApiErrorResponse";

interface IdempotencyRecordRow {
  operation: string;
  requestHash: string;
  resourceId: string;
}

export interface IdempotentExecution<T> {
  key: string;
  operation: string;
  request: object;
  execute: () => Promise<T>;
  replay: (resourceId: string) => Promise<T>;
  resourceId: (result: T) => string;
}

/**
 * Anonymous checkout has no userId, so unlike core.api's IdempotencyService
 * this one is keyed by `idempotency_key` alone (checkout_idempotency_operations
 * has it as its primary key, not a user_id+key composite).
 */
@Injectable()
export class IdempotencyService {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async execute<T>(data: IdempotentExecution<T>): Promise<T> {
    const key = data.key.trim();

    if (!key || key.length > 200) {
      throw new BadRequestException(
        "Idempotency-Key must contain between 1 and 200 characters",
      );
    }

    const requestHash = createHash("sha256")
      .update(JSON.stringify(data.request))
      .digest("hex");

    return this.entityManager.transaction(async (manager) => {
      await manager.query(
        "select pg_advisory_xact_lock(hashtextextended($1, 0))",
        [key],
      );

      await manager.query(
        `delete from checkout_idempotency_operations where expires_at <= now()`,
      );

      const existingRows = this.rowsFromResult<IdempotencyRecordRow>(
        await manager.query(
          `
            select
              operation,
              request_hash as "requestHash",
              resource_id as "resourceId"
            from checkout_idempotency_operations
            where idempotency_key = $1
            limit 1
          `,
          [key],
        ),
      );
      const existing = existingRows[0];

      if (existing) {
        if (
          existing.operation !== data.operation ||
          existing.requestHash !== requestHash
        ) {
          throw new ConflictException(
            apiError(
              ApiErrorCode.idempotencyKeyReused,
              "idempotency key was already used for another request",
            ),
          );
        }

        return data.replay(existing.resourceId);
      }

      const result = await data.execute();
      const resourceId = data.resourceId(result);

      await manager.query(
        `
          insert into checkout_idempotency_operations (
            idempotency_key, operation, request_hash, resource_id, expires_at
          )
          values ($1, $2, $3, $4, now() + interval '30 days')
        `,
        [key, data.operation, requestHash, resourceId],
      );

      return result;
    });
  }

  private rowsFromResult<T>(result: unknown): T[] {
    if (
      Array.isArray(result) &&
      result.length === 2 &&
      Array.isArray(result[0]) &&
      typeof result[1] === "number"
    ) {
      return result[0] as T[];
    }

    return result as T[];
  }
}
