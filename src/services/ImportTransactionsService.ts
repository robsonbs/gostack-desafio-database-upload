import csv from 'csv-parse';
import fs from 'fs';
import { getRepository, getCustomRepository, In } from 'typeorm';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

interface CSVTransaction {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}
class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const csvFile = fs.createReadStream(filePath);
    const parsers = csv({ columns: true, ltrim: true });
    const parseCSV = csvFile.pipe(parsers);
    const categoryRepository = getRepository(Category);
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categories: string[] = [];
    const transactions: CSVTransaction[] = [];
    parseCSV.on('data', async line => {
      const { title, type, value, category } = line;
      if (!title || !type || !value) return;
      categories.push(category);

      transactions.push({ title, type, value, category });
    });
    await new Promise(resolve => parseCSV.on('end', resolve));
    /* all assessments must start from this point onwards */
    const balance = await transactionRepository.getBalance();
    transactions.forEach(transaction => {
      if (transaction.type === 'outcome' && transaction.value > balance.total)
        throw new AppError(
          'The imported file has operations that violate the expected order for operations',
        );
      if (transaction.type === 'outcome')
        balance.total -= Number(transaction.value);
      if (transaction.type === 'income')
        balance.total += Number(transaction.value);
    });

    const categoriesData = await categoryRepository.find({
      where: { title: In(categories) },
    });
    const categoriesExistsTitle = categoriesData.map(
      (category: Category) => category.title,
    );

    const addCategoriesTitles = categories
      .filter(category => !categoriesExistsTitle.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoryRepository.create(
      addCategoriesTitles.map(title => ({
        title,
      })),
    );
    await categoryRepository.save(newCategories);
    const finalCategories = [...newCategories, ...categoriesData];
    const createdTransactions = transactionRepository.create(
      transactions.map(transaction => ({
        ...transaction,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );
    await transactionRepository.save(createdTransactions);
    await fs.promises.unlink(filePath);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
