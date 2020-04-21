/* eslint-disable no-param-reassign */
import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();
    const { income, outcome } = transactions.reduce(
      (
        balance: { income: number; outcome: number },
        transaction: Transaction,
      ) => {
        switch (transaction.type) {
          case 'income':
            balance.income += transaction.value;
            break;
          case 'outcome':
            balance.outcome += transaction.value;
            break;
          default:
            break;
        }
        return balance;
      },
      {
        income: 0,
        outcome: 0,
      },
    );
    const total = income - outcome;
    return { income, outcome, total };
  }
}

export default TransactionsRepository;
