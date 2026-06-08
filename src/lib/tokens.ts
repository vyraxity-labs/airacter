import { db } from "@/lib/db";

/**
 * Calculates a user's current token balance from their append-only ledger history.
 * Sums all credit transactions and subtracts all debit transactions.
 */
export async function getUserTokenBalance(userId: string): Promise<number> {
  try {
    const credits = await db.tokenTransaction.aggregate({
      where: { userId, direction: "credit" },
      _sum: { amount: true }
    });

    const debits = await db.tokenTransaction.aggregate({
      where: { userId, direction: "debit" },
      _sum: { amount: true }
    });

    const totalCredits = credits._sum.amount || 0;
    const totalDebits = debits._sum.amount || 0;

    return Math.max(0, totalCredits - totalDebits);
  } catch (error) {
    console.error("Failed to compute user token balance:", error);
    throw new Error("Failed to compute token balance");
  }
}
