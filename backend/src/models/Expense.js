const mongoose = require('mongoose');
const CONSTANTS = require('../utils/constants');

const expenseSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    index: true,
  },
  payerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0'],
  },
  currency: {
    type: String,
    default: 'USD',
    length: 3,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxLength: [500, 'Description cannot exceed 500 characters'],
  },
  category: {
    type: String,
    enum: Object.values(CONSTANTS.EXPENSE_CATEGORY),
    default: CONSTANTS.EXPENSE_CATEGORY.OTHER,
  },
  receiptUrl: {
    type: String,
    default: null,
  },
  splits: [{
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    paid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  }],
  splitType: {
    type: String,
    enum: Object.values(CONSTANTS.EXPENSE_SPLIT_TYPE),
    default: CONSTANTS.EXPENSE_SPLIT_TYPE.EQUAL,
  },
  date: {
    type: Date,
    default: Date.now,
    index: true,
  },
  isSettled: {
    type: Boolean,
    default: false,
  },
  settledAt: {
    type: Date,
    default: null,
  },
  notes: {
    type: String,
    maxLength: [1000, 'Notes cannot exceed 1000 characters'],
    default: '',
  },
}, {
  timestamps: true,
});

// Indexes for performance
expenseSchema.index({ groupId: 1, date: -1 });
expenseSchema.index({ 'splits.memberId': 1 });
expenseSchema.index({ isSettled: 1 });

// Virtual for total owed amount
expenseSchema.virtual('totalOwed').get(function() {
  return this.splits.reduce((total, split) => total + split.amount, 0);
});

// Virtual for settlement status
expenseSchema.virtual('settlementStatus').get(function() {
  const totalSplits = this.splits.length;
  const paidSplits = this.splits.filter(split => split.paid).length;
  
  if (paidSplits === 0) return 'unpaid';
  if (paidSplits === totalSplits) return 'settled';
  return 'partially_paid';
});

// CORRECTED calculateEqualSplits method
expenseSchema.methods.calculateEqualSplits = function(groupMembers) {
  const splitAmount = this.amount / groupMembers.length;
  
  console.log('🔍 DEBUG - calculateEqualSplits:');
  console.log('  - Expense amount:', this.amount);
  console.log('  - Group members:', groupMembers.length);
  console.log('  - Split amount each:', splitAmount);
  console.log('  - Payer ID:', this.payerId.toString());
  
  this.splits = groupMembers.map(member => {
    // Get the member ID correctly
    const memberId = member.userId ? member.userId._id || member.userId : member._id;
    const memberIdString = memberId.toString();
    const payerIdString = this.payerId.toString();
    
    // Check if this member is the payer
    const isPayer = memberIdString === payerIdString;
    
    console.log(`  - Member ${memberIdString}: isPayer = ${isPayer}`);
    
    return {
      memberId: memberId,
      amount: parseFloat(splitAmount.toFixed(2)),
      percentage: parseFloat((100 / groupMembers.length).toFixed(2)),
      paid: isPayer,  // ✅ FIXED: Simple boolean check
      paidAt: isPayer ? new Date() : null,
    };
  });
  
  // Handle rounding by adjusting the payer's split
  const calculatedTotal = this.splits.reduce((sum, split) => sum + split.amount, 0);
  const difference = this.amount - calculatedTotal;
  
  if (Math.abs(difference) > 0.01) {
    const payerSplit = this.splits.find(split => 
      split.memberId.toString() === this.payerId.toString()
    );
    if (payerSplit) {
      payerSplit.amount += difference;
      console.log(`  - Adjusted payer split by ${difference} to ${payerSplit.amount}`);
    }
  }
  
  console.log('  - Final splits:', this.splits.map(s => ({
    memberId: s.memberId.toString(),
    amount: s.amount,
    paid: s.paid
  })));
  
  return this;
};

// Method to mark split as paid
expenseSchema.methods.markSplitPaid = function(memberId, paidBy = null) {
  const split = this.splits.find(split => 
    split.memberId.toString() === memberId.toString()
  );
  
  if (split) {
    split.paid = true;
    split.paidAt = new Date();
    
    // Check if all splits are paid
    const allPaid = this.splits.every(split => split.paid);
    if (allPaid) {
      this.isSettled = true;
      this.settledAt = new Date();
    }
  }
  
  return this;
};

// Method to get member balance in this expense
expenseSchema.methods.getMemberBalance = function(memberId) {
  const split = this.splits.find(split => 
    split.memberId.toString() === memberId.toString()
  );
  
  if (!split) return 0;
  
  // If this member paid the expense, they're owed money
  if (this.payerId.toString() === memberId.toString()) {
    const othersOwe = this.splits
      .filter(split => split.memberId.toString() !== memberId.toString())
      .reduce((total, split) => total + (split.paid ? 0 : split.amount), 0);
    return othersOwe; // Positive = owed money
  }
  
  // If this member didn't pay, they owe money (negative balance)
  return split.paid ? 0 : -split.amount;
};

// Static method to get group expenses with filters
expenseSchema.statics.getGroupExpenses = function(groupId, filters = {}) {
  const query = { groupId };
  
  if (filters.payerId) query.payerId = filters.payerId;
  if (filters.category) query.category = filters.category;
  if (filters.isSettled !== undefined) query.isSettled = filters.isSettled;
  
  if (filters.startDate || filters.endDate) {
    query.date = {};
    if (filters.startDate) query.date.$gte = new Date(filters.startDate);
    if (filters.endDate) query.date.$lte = new Date(filters.endDate);
  }
  
  return this.find(query)
    .populate('payerId', 'name email profilePicture')
    .populate('splits.memberId', 'name email profilePicture')
    .sort({ date: -1 });
};

// CORRECTED calculateGroupBalances static method
expenseSchema.statics.calculateGroupBalances = async function(groupId) {
  console.log('🔍 DEBUG - calculateGroupBalances for group:', groupId.toString());
  
  const expenses = await this.find({ groupId })
    .populate('payerId', 'name email')
    .populate('splits.memberId', 'name email');
  
  console.log('  - Found expenses:', expenses.length);
  
  const balances = new Map();
  
  // Initialize balances for all members who appear in expenses
  expenses.forEach(expense => {
    // Initialize payer
    const payerId = expense.payerId._id.toString();
    if (!balances.has(payerId)) {
      balances.set(payerId, {
        userId: payerId,
        name: expense.payerId.name,
        email: expense.payerId.email,
        totalPaid: 0,        // Money spent out of pocket
        totalOwed: 0,        // CURRENT unpaid debt only
        netBalance: 0,       // Net amount (positive = owed money, negative = owes money)
      });
    }
    
    // Initialize all members in splits
    expense.splits.forEach(split => {
      const memberId = split.memberId._id.toString();
      if (!balances.has(memberId)) {
        balances.set(memberId, {
          userId: memberId,
          name: split.memberId.name,
          email: split.memberId.email,
          totalPaid: 0,
          totalOwed: 0,
          netBalance: 0,
        });
      }
    });
  });
  
  // Calculate balances
  expenses.forEach(expense => {
    const payerId = expense.payerId._id.toString();
    const payerBalance = balances.get(payerId);
    
    console.log(`  - Processing expense ${expense._id}: ${expense.description}`);
    console.log(`    Payer: ${expense.payerId.name} (${payerId})`);
    console.log(`    Amount: $${expense.amount}`);
    
    // Payer spent money out of pocket
    payerBalance.totalPaid += expense.amount;
    
    expense.splits.forEach(split => {
      const memberId = split.memberId._id.toString();
      const memberBalance = balances.get(memberId);
      
      console.log(`    Split: ${split.memberId.name} owes $${split.amount}, paid: ${split.paid}`);
      
      if (!split.paid) {
        // This person still owes money for this expense
        memberBalance.totalOwed += split.amount;
        
        // Update net balances
        if (memberId !== payerId) {
          // Normal case: member owes money to the payer
          payerBalance.netBalance += split.amount;  // Payer is owed this amount
          memberBalance.netBalance -= split.amount; // Member owes this amount
          console.log(`      ${split.memberId.name} owes ${expense.payerId.name} $${split.amount}`);
        } else {
          // This shouldn't happen if payer's split is marked as paid
          console.warn(`    ⚠️  WARNING: Payer ${expense.payerId.name} has unpaid split of $${split.amount}`);
        }
      } else {
        console.log(`      ${split.memberId.name} already paid their share`);
      }
    });
  });
  
  const finalBalances = Array.from(balances.values());
  console.log('  - Final balances:');
  finalBalances.forEach(balance => {
    console.log(`    ${balance.name}: paid $${balance.totalPaid}, owes $${balance.totalOwed}, net $${balance.netBalance}`);
  });
  
  return finalBalances;
};

// Transform output
expenseSchema.methods.toJSON = function() {
  const obj = this.toObject({ virtuals: true });
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Expense', expenseSchema);