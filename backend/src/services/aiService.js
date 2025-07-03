const { GoogleGenerativeAI } = require('@google/genai');

class AIService {
  constructor() {
    this.initializeAI();
  }

  initializeAI() {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('⚠️ GEMINI_API_KEY not found. AI features will be disabled.');
      this.isEnabled = false;
      return;
    }
    
    try {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.model = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
          topP: 0.8,
          topK: 40
        }
      });
      this.isEnabled = true;
      console.log('✅ AI Service initialized with Gemini 2.0 Flash');
    } catch (error) {
      console.error('❌ Failed to initialize AI Service:', error);
      this.isEnabled = false;
    }
  }

  // Main method: Process voice/text input into tasks
  async processVoiceToTasks(text, context = {}) {
    if (!this.isEnabled) {
      throw new Error('AI service is not available');
    }
    
    try {
      const startTime = Date.now();
      
      // Extract member mentions first
      const memberInfo = this.extractMemberMentions(text, context.groupMembers || []);
      
      // Build enhanced prompt
      const prompt = this.buildSmartPrompt(text, context, memberInfo);
      
      console.log('🤖 Processing with AI:', text.substring(0, 100) + '...');
      
      // Call Gemini AI
      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Parse and enhance the response
      const cleanedResponse = this.cleanJsonResponse(responseText);
      const parsedResponse = JSON.parse(cleanedResponse);
      
      // Post-process assignments to ensure accuracy
      const enhancedTasks = this.validateAndEnhanceAssignments(
        parsedResponse.tasks || [], 
        memberInfo, 
        context.groupMembers || []
      );
      
      const processingTime = Date.now() - startTime;
      
      console.log(`✅ AI generated ${enhancedTasks.length} tasks in ${processingTime}ms`);
      
      return {
        originalText: text,
        suggestedTasks: enhancedTasks,
        confidence: parsedResponse.confidence || 0.8,
        processingTime: processingTime,
        memberMentions: memberInfo.mentions,
        metadata: {
          detectedCategories: parsedResponse.categories || [],
          assignmentStrategy: parsedResponse.assignmentStrategy || 'automatic',
          aiModel: 'gemini-2.0-flash-exp',
          fallbackUsed: false
        }
      };
    } catch (error) {
      console.error('❌ AI processing error:', error);
      // Return intelligent fallback
      return this.createFallbackResponse(text, context);
    }
  }

  // Extract member mentions from text
  extractMemberMentions(text, groupMembers) {
    const mentions = [];
    const normalizedText = text.toLowerCase();
    
    groupMembers.forEach(member => {
      const name = member.name.toLowerCase();
      const firstName = name.split(' ')[0];
      
      // All possible mention patterns
      const patterns = [
        name,                     // "john doe"
        firstName,                // "john"
        `@${firstName}`,          // "@john"
        `${firstName}'s`,         // "john's"
        `for ${firstName}`,       // "for john"
        `${firstName} should`,    // "john should"
        `${firstName} can`,       // "john can"
        `${firstName} will`,      // "john will"
        `assign to ${firstName}`, // "assign to john"
        `give it to ${firstName}`,// "give it to john"
        `${firstName},`,          // "john,"
        `${firstName}:`,          // "john:"
      ];
      
      patterns.forEach(pattern => {
        const index = normalizedText.indexOf(pattern);
        if (index !== -1) {
          mentions.push({
            memberId: member.id,
            memberName: member.name,
            mentionText: pattern,
            position: index,
            confidence: this.calculateMentionConfidence(pattern, normalizedText)
          });
        }
      });
    });
    
    // Remove duplicates and sort by confidence
    const uniqueMentions = mentions
      .filter((mention, index, arr) => 
        arr.findIndex(m => m.memberId === mention.memberId) === index
      )
      .sort((a, b) => b.confidence - a.confidence);
    
    return {
      mentions: uniqueMentions,
      hasMentions: uniqueMentions.length > 0,
      memberCount: uniqueMentions.length
    };
  }

  // Calculate how confident we are about a mention
  calculateMentionConfidence(pattern, text) {
    let confidence = 0.5; // Base confidence
    
    // Higher confidence for explicit assignments
    if (pattern.includes('assign to') || pattern.includes('give it to')) confidence += 0.4;
    if (pattern.includes('should') || pattern.includes('can') || pattern.includes('will')) confidence += 0.3;
    if (pattern.includes("'s")) confidence += 0.2;
    if (pattern.includes('@')) confidence += 0.2;
    if (pattern.includes('for ')) confidence += 0.2;
    
    return Math.min(confidence, 1.0);
  }

  // Build the AI prompt with smart assignment detection
  buildSmartPrompt(text, context, memberInfo) {
    const { groupMembers = [], recentTasks = [] } = context;
    
    const membersList = groupMembers.map(m => 
      `${m.name} (ID: ${m.id})`
    ).join(', ');
    
    const mentionsList = memberInfo.mentions.map(m => 
      `"${m.mentionText}" → ${m.memberName} (ID: ${m.memberId}, confidence: ${m.confidence})`
    ).join(', ');
    
    return `
You are an expert household task management AI using Gemini 2.0 Flash. Extract actionable tasks from natural language with INTELLIGENT ASSIGNMENT DETECTION.

INPUT: "${text}"

CONTEXT:
- Group Members: ${membersList || 'None'}
- Detected Mentions: ${mentionsList || 'None detected'}
- Recent Tasks: ${recentTasks.map(t => `"${t.title}" (${t.category})`).join(', ') || 'None'}

ASSIGNMENT RULES:
1. If a member is explicitly mentioned for a task → assign to them
2. Look for patterns: "John should X", "assign to Sarah", "Mary can do Y"
3. High confidence mentions (explicit assignments) take priority
4. If unclear, leave unassigned (null)
5. Each task can only have ONE assignee

TASK RULES:
1. Extract ONLY actionable household tasks
2. Categories: cleaning, cooking, shopping, maintenance, bills, other
3. Realistic priorities: low/medium/high
4. Duration estimates: 5-240 minutes
5. Due dates within reasonable timeframes

RESPONSE (JSON ONLY):
{
  "tasks": [
    {
      "title": "Clear task title (max 80 chars)",
      "description": "Detailed description",
      "category": "cleaning|cooking|shopping|maintenance|bills|other",
      "priority": "low|medium|high",
      "estimatedDuration": 30,
      "suggestedAssignee": "member_id_or_null",
      "assignmentConfidence": 0.9,
      "suggestedDueDate": "2025-07-06T18:00:00Z",
      "notes": "Additional context"
    }
  ],
  "confidence": 0.85,
  "categories": ["cleaning"],
  "assignmentStrategy": "explicit|inferred|none"
}

EXAMPLES:

Input: "John should clean the kitchen and Sarah can buy groceries"
Output: {
  "tasks": [
    {
      "title": "Clean the kitchen",
      "description": "Clean kitchen surfaces, appliances, and organize",
      "category": "cleaning",
      "priority": "medium",
      "estimatedDuration": 45,
      "suggestedAssignee": "john_id_here",
      "assignmentConfidence": 0.9,
      "suggestedDueDate": "2025-07-06T20:00:00Z",
      "notes": "Assigned to John as explicitly mentioned"
    },
    {
      "title": "Buy groceries",
      "description": "Purchase groceries and household essentials",
      "category": "shopping", 
      "priority": "medium",
      "estimatedDuration": 60,
      "suggestedAssignee": "sarah_id_here",
      "assignmentConfidence": 0.8,
      "suggestedDueDate": "2025-07-07T18:00:00Z",
      "notes": "Sarah can handle the grocery shopping"
    }
  ],
  "confidence": 0.92,
  "categories": ["cleaning", "shopping"],
  "assignmentStrategy": "explicit"
}

Process the input and return ONLY the JSON:`;
  }

  // Clean AI response and parse JSON
  cleanJsonResponse(responseText) {
    // Remove markdown formatting
    let cleaned = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Extract JSON from response
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('No valid JSON found in AI response');
    }
    
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    return cleaned.trim();
  }

  // Validate and enhance AI assignments
  validateAndEnhanceAssignments(tasks, memberInfo, groupMembers) {
    return tasks.map(task => {
      // Validate assigned member exists
      if (task.suggestedAssignee) {
        const memberExists = groupMembers.find(m => m.id === task.suggestedAssignee);
        if (!memberExists) {
          console.warn(`⚠️ Invalid assignment: ${task.suggestedAssignee} not found`);
          task.suggestedAssignee = null;
          task.assignmentConfidence = 0;
        }
      }
      
      // Try to infer assignment if AI missed obvious mentions
      if (!task.suggestedAssignee && memberInfo.hasMentions) {
        const inferredAssignment = this.inferAssignmentFromTask(task, memberInfo);
        if (inferredAssignment) {
          task.suggestedAssignee = inferredAssignment.memberId;
          task.assignmentConfidence = inferredAssignment.confidence;
          task.notes = (task.notes || '') + ` (Inferred: ${inferredAssignment.reason})`;
        }
      }
      
      // Ensure required fields
      task.assignmentConfidence = task.assignmentConfidence || 0.5;
      task.estimatedDuration = Math.max(5, Math.min(240, task.estimatedDuration || 30));
      
      return task;
    });
  }

  // Try to infer assignment from task content and mentions
  inferAssignmentFromTask(task, memberInfo) {
    const taskText = `${task.title} ${task.description}`.toLowerCase();
    
    // Find highest confidence mention that could relate to this task
    for (const mention of memberInfo.mentions) {
      if (mention.confidence > 0.7) {
        return {
          memberId: mention.memberId,
          confidence: mention.confidence * 0.8, // Reduce confidence for inference
          reason: `Inferred from "${mention.mentionText}"`
        };
      }
    }
    
    return null;
  }

  // Create intelligent fallback when AI fails
  createFallbackResponse(text, context = {}) {
    const memberInfo = this.extractMemberMentions(text, context.groupMembers || []);
    const keywords = text.toLowerCase();
    const tasks = [];
    
    // Generate tasks based on keywords
    const taskTemplates = {
      'kitchen|cook|dish': {
        title: 'Kitchen maintenance',
        description: 'Clean and organize kitchen area',
        category: 'cleaning',
        duration: 30
      },
      'shop|buy|grocery|store': {
        title: 'Shopping trip',
        description: 'Purchase household items and groceries',
        category: 'shopping',
        duration: 45
      },
      'clean|messy|tidy|organize': {
        title: 'General cleaning',
        description: 'Clean and organize living spaces',
        category: 'cleaning',
        duration: 30
      },
      'bathroom|toilet|shower': {
        title: 'Bathroom cleaning',
        description: 'Clean bathroom facilities',
        category: 'cleaning',
        duration: 25
      },
      'laundry|wash|clothes': {
        title: 'Laundry',
        description: 'Wash and fold laundry',
        category: 'cleaning',
        duration: 90
      }
    };
    
    // Find matching templates
    for (const [pattern, template] of Object.entries(taskTemplates)) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(keywords)) {
        tasks.push({
          title: template.title,
          description: template.description,
          category: template.category,
          priority: 'medium',
          estimatedDuration: template.duration,
          suggestedAssignee: memberInfo.hasMentions ? memberInfo.mentions[0].memberId : null,
          assignmentConfidence: memberInfo.hasMentions ? 0.6 : 0,
          suggestedDueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Generated by fallback system'
        });
        break; // Only create one fallback task
      }
    }
    
    // If no patterns match, create generic task
    if (tasks.length === 0) {
      tasks.push({
        title: 'Household task',
        description: text.length > 100 ? text.substring(0, 100) + '...' : text,
        category: 'other',
        priority: 'medium',
        estimatedDuration: 30,
        suggestedAssignee: memberInfo.hasMentions ? memberInfo.mentions[0].memberId : null,
        assignmentConfidence: memberInfo.hasMentions ? 0.5 : 0,
        suggestedDueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Please review and modify as needed'
      });
    }
    
    return {
      originalText: text,
      suggestedTasks: tasks,
      confidence: 0.5,
      processingTime: 0,
      memberMentions: memberInfo.mentions,
      metadata: {
        detectedCategories: tasks.map(t => t.category),
        assignmentStrategy: 'fallback',
        aiModel: 'fallback-system',
        fallbackUsed: true
      }
    };
  }

  // Utility methods
  isAvailable() {
    return this.isEnabled;
  }

  async testConnection() {
    if (!this.isEnabled) {
      return { connected: false, error: 'AI service not initialized' };
    }
    
    try {
      const result = await this.model.generateContent('Test connection. Respond with: {"status": "connected"}');
      const response = result.response.text();
      return { connected: true, response: response.substring(0, 100) };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  }
}

module.exports = new AIService();