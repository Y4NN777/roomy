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


expenseSchema.methods.setCustomSplits = function(customSplits) {
  // customSplits: [{ memberId, percentage }] or [{ memberId, amount }]
  
  if (!customSplits || !Array.isArray(customSplits)) {
    throw new Error('Custom splits must be an array');
  }

  // Validate that splits cover all members
  const memberIds = this.splits.map(split => split.memberId.toString());
  const customMemberIds = customSplits.map(split => split.memberId.toString());
  
  if (memberIds.length !== customMemberIds.length || 
      !memberIds.every(id => customMemberIds.includes(id))) {
    throw new Error('Custom splits must include all group members');
  }

  // Set split type
  this.splitType = customSplits[0].percentage !== undefined ? 
    CONSTANTS.EXPENSE_SPLIT_TYPE.PERCENTAGE : 
    CONSTANTS.EXPENSE_SPLIT_TYPE.CUSTOM;

  if (this.splitType === CONSTANTS.EXPENSE_SPLIT_TYPE.PERCENTAGE) {
    // Validate percentages add up to 100
    const totalPercentage = customSplits.reduce((sum, split) => sum + split.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error('Percentages must add up to 100%');
    }

    // Calculate amounts based on percentages
    customSplits.forEach(customSplit => {
      const split = this.splits.find(s => s.memberId.toString() === customSplit.memberId.toString());
      if (split) {
        split.percentage = customSplit.percentage;
        split.amount = parseFloat(((this.amount * customSplit.percentage) / 100).toFixed(2));
        // Keep existing paid status
      }
    });
  } else {
    // Custom amounts
    const totalAmount = customSplits.reduce((sum, split) => sum + split.amount, 0);
    if (Math.abs(totalAmount - this.amount) > 0.01) {
      throw new Error('Custom amounts must add up to total expense amount');
    }

    customSplits.forEach(customSplit => {
      const split = this.splits.find(s => s.memberId.toString() === customSplit.memberId.toString());
      if (split) {
        split.amount = parseFloat(customSplit.amount.toFixed(2));
        split.percentage = parseFloat(((customSplit.amount / this.amount) * 100).toFixed(2));
        // Keep existing paid status
      }
    });
  }

  return this;
};

// Method to reset to equal splits
expenseSchema.methods.resetToEqualSplits = function(groupMembers) {
  this.splitType = CONSTANTS.EXPENSE_SPLIT_TYPE.EQUAL;
  return this.calculateEqualSplits(groupMembers);
};


expenseSchema.methods.markSplitPaid = function(memberId, paidBy = null) {
  const split = this.splits.find(split => 
    split.memberId.toString() === memberId.toString()
  );
  
  if (split && !split.paid) {
    split.paid = true;
    split.paidAt = new Date();
    
    // Check if all splits are now paid
    const allPaid = this.splits.every(split => split.paid);
    if (allPaid && !this.isSettled) {
      this.isSettled = true;
      this.settledAt = new Date();
      console.log(`✅ Expense fully settled: ${this.description}`);
    }
  }
  
  return this;
};

// ENHANCE the virtual totalOwed to be more accurate:
expenseSchema.virtual('totalOwed').get(function() {
  return parseFloat(this.splits.reduce((total, split) => total + split.amount, 0).toFixed(2));
});

// ADD new virtual for outstanding amount:
expenseSchema.virtual('totalOutstanding').get(function() {
  const unpaidAmount = this.splits
    .filter(split => !split.paid)
    .reduce((total, split) => total + split.amount, 0);
  return parseFloat(unpaidAmount.toFixed(2));
});

// UPDATE the existing settlement status virtual:
expenseSchema.virtual('settlementStatus').get(function() {
  const totalSplits = this.splits.length;
  const paidSplits = this.splits.filter(split => split.paid).length;
  
  if (paidSplits === 0) return 'unpaid';
  if (paidSplits === totalSplits) return 'settled';
  return 'partially_paid';
});

// ENHANCE getSummary method:
expenseSchema.methods.getSummary = function() {
  const totalOwed = this.totalOwed; // Use virtual
  const totalPaid = this.splits.filter(split => split.paid).reduce((sum, split) => sum + split.amount, 0);
  const totalOutstanding = this.totalOutstanding; // Use virtual
  
  return {
    totalAmount: this.amount,
    totalOwed: parseFloat(totalOwed.toFixed(2)),
    totalPaid: parseFloat(totalPaid.toFixed(2)),
    totalOutstanding: parseFloat(totalOutstanding.toFixed(2)),
    splitType: this.splitType,
    isFullySettled: this.isSettled,
    settlementStatus: this.settlementStatus,
    paidMembers: this.splits.filter(split => split.paid).length,
    totalMembers: this.splits.length,
    // Add validation check
    mathCheck: {
      splitsAddUp: Math.abs(totalOwed - this.amount) < 0.01,
      settlementCorrect: totalOutstanding === 0 ? this.isSettled : true
    }
  };
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

// Enhanced method to get detailed balance explanation
expenseSchema.statics.getDetailedBalanceExplanation = async function(groupId, userId) {
  const expenses = await this.find({ groupId })
    .populate('payerId', 'name')
    .populate('splits.memberId', 'name');
  
  const transactions = [];
  let totalPaid = 0;
  let totalOwed = 0;
  let totalSpentForOthers = 0;
  
  expenses.forEach(expense => {
    const userSplit = expense.splits.find(split => 
      split.memberId._id.toString() === userId
    );
    
    if (userSplit) {
      const transaction = {
        expenseId: expense._id,
        description: expense.description,
        date: expense.date,
        totalAmount: expense.amount,
        yourShare: userSplit.amount,
        paid: userSplit.paid,
        paidBy: expense.payerId.name,
        isPayer: expense.payerId._id.toString() === userId
      };
      
      if (transaction.isPayer) {
        transaction.youPaid = expense.amount;
        transaction.yourShare = userSplit.amount;
        transaction.paidForOthers = expense.amount - userSplit.amount;
        totalPaid += expense.amount;
        totalSpentForOthers += transaction.paidForOthers;
      } else if (userSplit.paid) {
        transaction.youPaid = userSplit.amount;
        totalPaid += userSplit.amount;
      } else {
        transaction.youOwe = userSplit.amount;
        totalOwed += userSplit.amount;
      }
      
      transactions.push(transaction);
    }
  });
  
  return {
    userId,
    transactions,
    summary: {
      totalPaid: parseFloat(totalPaid.toFixed(2)),
      totalOwed: parseFloat(totalOwed.toFixed(2)),
      totalSpentForOthers: parseFloat(totalSpentForOthers.toFixed(2)),
      netBalance: parseFloat((totalSpentForOthers - totalOwed).toFixed(2))
    }
  };
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
        totalPaid: 0,        // Total money paid (out of pocket + split payments)
        totalOwed: 0,        // Current unpaid debt only
        totalSpentOnOwn: 0,  // Money spent on own expenses vs for others
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
          totalSpentOnOwn: 0,
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
    
    // Payer spent money out of pocket (full expense amount)
    payerBalance.totalPaid += expense.amount;
    
    expense.splits.forEach(split => {
      const memberId = split.memberId._id.toString();
      const memberBalance = balances.get(memberId);
      
      console.log(`    Split: ${split.memberId.name} owes $${split.amount}, paid: ${split.paid}`);
      
      if (split.paid) {
        // This person has paid their split
        if (memberId !== payerId) {
          // Member paid their share (not the original payer)
          memberBalance.totalPaid += split.amount;
          memberBalance.totalSpentOnOwn += split.amount;
          console.log(`      ${split.memberId.name} paid their share of $${split.amount}`);
        } else {
          // Payer's own split - already counted in totalPaid above
          payerBalance.totalSpentOnOwn += split.amount;
          console.log(`      ${split.memberId.name} covered their own share of $${split.amount}`);
        }
      } else {
        // This person still owes money for this expense
        memberBalance.totalOwed += split.amount;
        
        // Update net balances for unpaid splits
        if (memberId !== payerId) {
          // Normal case: member owes money to the payer
          payerBalance.netBalance += split.amount;  // Payer is owed this amount
          memberBalance.netBalance -= split.amount; // Member owes this amount
          console.log(`      ${split.memberId.name} owes ${expense.payerId.name} $${split.amount}`);
        } else {
          // Edge case: payer's split is not marked as paid (shouldn't happen normally)
          console.warn(`    ⚠️  WARNING: Payer ${expense.payerId.name} has unpaid split of $${split.amount}`);
          payerBalance.totalOwed += split.amount;
        }
      }
    });
  });
  
  // Final calculations and cleanup
  const finalBalances = Array.from(balances.values()).map(balance => ({
    ...balance,
    totalPaid: parseFloat(balance.totalPaid.toFixed(2)),
    totalOwed: parseFloat(balance.totalOwed.toFixed(2)),
    totalSpentOnOwn: parseFloat(balance.totalSpentOnOwn.toFixed(2)),
    netBalance: parseFloat(balance.netBalance.toFixed(2)),
    // Additional helpful metrics
    totalSpentForOthers: parseFloat((balance.totalPaid - balance.totalSpentOnOwn).toFixed(2)),
    isSettled: balance.totalOwed === 0 && balance.netBalance === 0
  }));
  
  console.log('  - Final balances:');
  finalBalances.forEach(balance => {
    console.log(`    ${balance.name}:`);
    console.log(`      - Total paid: $${balance.totalPaid} (own: $${balance.totalSpentOnOwn}, others: $${balance.totalSpentForOthers})`);
    console.log(`      - Currently owes: $${balance.totalOwed}`);
    console.log(`      - Net balance: $${balance.netBalance} (${balance.netBalance > 0 ? 'owed money' : balance.netBalance < 0 ? 'owes money' : 'settled'})`);
  });
  
  return finalBalances;
};

// Transform output
expenseSchema.methods.toJSON = function() {
  const obj = this.toObject({ virtuals: true });
  delete obj.__v;
  return obj;
};



// Indexes for performance
expenseSchema.index({ groupId: 1, date: -1 });
expenseSchema.index({ 'splits.memberId': 1 });
expenseSchema.index({ isSettled: 1 });

module.exports = mongoose.model('Expense', expenseSchema);