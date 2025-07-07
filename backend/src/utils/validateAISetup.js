// scripts/validateAISetup.js - Quick AI setup validator
require('dotenv').config();

const validateAISetup = async () => {
  console.log('🔍 Validating AI Setup...\n');

  // 1. Check environment variables
  console.log('1. Environment Variables:');
  const hasApiKey = !!process.env.GEMINI_API_KEY;
  console.log(`   GEMINI_API_KEY: ${hasApiKey ? '✅ Set' : '❌ Missing'}`);
  
  if (!hasApiKey) {
    console.log('   💡 Add GEMINI_API_KEY to your .env file');
  }

  // 2. Test AI Service import
  console.log('\n2. AI Service Import:');
  try {
    const aiService = require('../services/aiService');
    console.log('   ✅ AI Service imported successfully');
    
    // 3. Test AI Service availability
    console.log('\n3. AI Service Status:');
    const isAvailable = aiService.isAvailable();
    console.log(`   Available: ${isAvailable ? '✅ Yes' : '❌ No'}`);
    
    if (isAvailable) {
      // 4. Test AI connection
      console.log('\n4. Testing AI Connection...');
      try {
        const connectionTest = await aiService.testConnection();
        console.log(`   Connection: ${connectionTest.connected ? '✅ Success' : '❌ Failed'}`);
        
        if (!connectionTest.connected) {
          console.log(`   Error: ${connectionTest.error}`);
        }
      } catch (error) {
        console.log(`   Connection: ❌ Failed - ${error.message}`);
      }
    }

    // 5. Test member mention detection
    console.log('\n5. Testing Core Functions:');
    const mockMembers = [
      { id: '1', name: 'John Doe' },
      { id: '2', name: 'Sarah Smith' }
    ];

    const testText = 'John should clean the kitchen and Sarah can buy groceries';
    const mentionResult = aiService.extractMemberMentions(testText, mockMembers);
    
    console.log(`   Member Detection: ${mentionResult.hasMentions ? '✅ Working' : '❌ Failed'}`);
    console.log(`   Found ${mentionResult.mentions.length} mentions: ${mentionResult.mentions.map(m => m.memberName).join(', ')}`);

    // 6. Test fallback system
    const fallbackResult = aiService.createFallbackResponse(testText, { groupMembers: mockMembers });
    console.log(`   Fallback System: ${fallbackResult.suggestedTasks.length > 0 ? '✅ Working' : '❌ Failed'}`);
    console.log(`   Generated ${fallbackResult.suggestedTasks.length} fallback tasks`);

    // 7. Test real AI processing (if available)
    if (isAvailable) {
      console.log('\n6. Testing Real AI Processing...');
      try {
        const aiResult = await aiService.processVoiceToTasks(testText, {
          groupMembers: mockMembers,
          recentTasks: []
        });
        
        console.log(`   AI Processing: ✅ Success`);
        console.log(`   Generated ${aiResult.suggestedTasks.length} tasks`);
        console.log(`   Confidence: ${aiResult.confidence}`);
        console.log(`   Processing time: ${aiResult.processingTime}ms`);
        
        if (aiResult.suggestedTasks.length > 0) {
          console.log('   Sample task:', aiResult.suggestedTasks[0].title);
        }
      } catch (error) {
        console.log(`   AI Processing: ❌ Failed - ${error.message}`);
      }
    }

    console.log('\n🎯 Summary:');
    if (isAvailable) {
      console.log('✅ AI features are ready to use!');
      console.log('🚀 You can now run: npm run test:ai-unit');
    } else {
      console.log('⚠️  AI features are in fallback mode');
      console.log('💡 Add GEMINI_API_KEY to enable full AI functionality');
      console.log('📝 Fallback system will handle basic task extraction');
    }

  } catch (error) {
    console.log(`   ❌ Failed to import AI Service: ${error.message}`);
    console.log('\n🔧 Setup Issues:');
    console.log('   1. Make sure aiService.js exists in services/ directory');
    console.log('   2. Check that all required dependencies are installed');
    console.log('   3. Verify file paths are correct');
  }
};

// Run validation
if (require.main === module) {
  validateAISetup().catch(console.error);
}

module.exports = { validateAISetup };