const Expense = require('../../models/Expense');
const Group = require('../../models/Group');
const responseHelper = require('../../utils/responseHelper');

class DebugController {
  async analyzeExpense(req, res, next) {
    try {
      const { expenseId } = req.params;
      
      const expense = await Expense.findById(expenseId)
        .populate('payerId', 'name email')
        .populate('splits.memberId', 'name email')
        .populate('groupId', 'name');

      if (!expense) {
        return responseHelper.notFound(res, 'Expense not found');
      }

      // Analyze splits
      const analysis = {
        expenseInfo: {
          id: expense._id,
          description: expense.description,
          amount: expense.amount,
          payerId: expense.payerId._id,
          payerName: expense.payerId.name
        },
        splits: expense.splits.map(split => ({
          memberId: split.memberId._id,
          memberName: split.memberId.name,
          amount: split.amount,
          paid: split.paid,
          paidAt: split.paidAt,
          isPayer: split.memberId._id.toString() === expense.payerId._id.toString()
        })),
        validation: {
          totalSplitAmount: expense.splits.reduce((sum, split) => sum + split.amount, 0),
          matchesExpenseAmount: Math.abs(expense.splits.reduce((sum, split) => sum + split.amount, 0) - expense.amount) < 0.01,
          payerSplitExists: expense.splits.some(split => split.memberId._id.toString() === expense.payerId._id.toString()),
          payerSplitPaid: expense.splits.find(split => split.memberId._id.toString() === expense.payerId._id.toString())?.paid,
          unpaidSplits: expense.splits.filter(split => !split.paid).length,
          paidSplits: expense.splits.filter(split => split.paid).length
        }
      };

      responseHelper.success(res, 'Expense analysis completed', analysis);
    } catch (error) {
      next(error);
    }
  }

  async analyzeBalances(req, res, next) {
    try {
      const { groupId } = req.params;
      
      const balances = await Expense.calculateGroupBalances(groupId);
      
      const analysis = {
        groupId,
        memberCount: balances.length,
        balances: balances.map(balance => ({
          name: balance.name,
          totalPaid: balance.totalPaid,
          totalOwed: balance.totalOwed,
          netBalance: balance.netBalance,
          status: balance.netBalance > 0 ? 'owed' : balance.netBalance < 0 ? 'owes' : 'settled'
        })),
        validation: {
          totalNetBalance: balances.reduce((sum, b) => sum + b.netBalance, 0),
          shouldBeZero: Math.abs(balances.reduce((sum, b) => sum + b.netBalance, 0)) < 0.01
        }
      };

      responseHelper.success(res, 'Balance analysis completed', analysis);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DebugController();