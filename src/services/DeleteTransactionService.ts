import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const findTransaction = await transactionsRepository.findOne({
      where: { id },
    });

    if (!findTransaction) {
      throw new AppError('transaction not found.');
    }

    await transactionsRepository.remove(findTransaction);

    const removed = await transactionsRepository.findOne({
      where: { id },
    });

    if (removed) {
      throw new AppError('transaction not deleted.');
    }
  }
}

export default DeleteTransactionService;
