const emailTemplates = {
  groupInvitation: (data) => {
    const { inviterName, groupName, inviteCode, appBaseUrl } = data;
    
    return {
      subject: `🏠 You're invited to join "${groupName}" on Roomy!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Group Invitation</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { padding: 40px 20px; }
            .invite-card { background-color: #f8f9fa; border-radius: 12px; padding: 30px; margin: 20px 0; text-align: center; border-left: 4px solid #667eea; }
            .invite-code { font-size: 32px; font-weight: bold; color: #667eea; background-color: white; padding: 15px 25px; border-radius: 8px; display: inline-block; letter-spacing: 3px; margin: 15px 0; }
            .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
            .divider { height: 1px; background-color: #e9ecef; margin: 30px 0; }
            .feature { display: inline-block; width: 45%; margin: 10px 2%; text-align: center; }
            .feature-icon { font-size: 24px; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏠 Roomy Invitation</h1>
              <p style="color: #e8f4ff; margin: 10px 0 0 0;">Manage your household together</p>
            </div>
            
            <div class="content">
              <h2>Hi there! 👋</h2>
              <p><strong>${inviterName}</strong> has invited you to join their household group on Roomy!</p>
              
              <div class="invite-card">
                <h3 style="margin-top: 0; color: #333;">🏠 "${groupName}"</h3>
                <p>Join with this invite code:</p>
                <div class="invite-code">${inviteCode}</div>
                <p style="color: #666; font-size: 14px;">Enter this code in the Roomy app to join the group</p>
              </div>

              <div class="divider"></div>
              
              <h3 style="text-align: center; color: #333;">✨ What you can do with Roomy:</h3>
              <div style="text-align: center;">
                <div class="feature">
                  <div class="feature-icon">📋</div>
                  <h4>Task Management</h4>
                  <p>Share and track household chores</p>
                </div>
                <div class="feature">
                  <div class="feature-icon">🤖</div>
                  <h4>AI Voice Assistant</h4>
                  <p>Create tasks with voice commands</p>
                </div>
                <div class="feature">
                  <div class="feature-icon">💰</div>
                  <h4>Expense Splitting</h4>
                  <p>Track shared expenses easily</p>
                </div>
                <div class="feature">
                  <div class="feature-icon">📅</div>
                  <h4>Shared Calendar</h4>
                  <p>See everyone's tasks and deadlines</p>
                </div>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${appBaseUrl}/join?code=${inviteCode}" class="button">
                  📱 Join Group Now
                </a>
              </div>
              
              <div class="divider"></div>
              
              <p style="color: #666; font-size: 14px;">
                <strong>How to join:</strong><br>
                1. Download the Roomy app or visit our website<br>
                2. Create your account<br>
                3. Enter the invite code: <strong>${inviteCode}</strong><br>
                4. Start collaborating with your household!
              </p>
            </div>
            
            <div class="footer">
              <p>This invitation was sent by <strong>${inviterName}</strong></p>
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
              <p style="margin-top: 20px;">
                <a href="${appBaseUrl}" style="color: #667eea;">Roomy</a> - Smart household management
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hi there!

${inviterName} has invited you to join their household group "${groupName}" on Roomy!

Invite Code: ${inviteCode}

What is Roomy?
Roomy is a smart household management app that helps roommates:
- Share and track household tasks
- Split expenses fairly
- Use AI voice commands to create tasks
- Stay organized with a shared calendar

How to join:
1. Download the Roomy app or visit ${appBaseUrl}
2. Create your account
3. Enter the invite code: ${inviteCode}
4. Start collaborating with your household!

This invitation was sent by ${inviterName}.
If you didn't expect this invitation, you can safely ignore this email.
      `
    };
  },

  welcomeToGroup: (data) => {
    const { userName, groupName, memberCount, adminName } = data;
    
    return {
      subject: `🎉 Welcome to "${groupName}"!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 40px 20px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { padding: 40px 20px; }
            .welcome-card { background-color: #f8f9fa; border-radius: 12px; padding: 30px; margin: 20px 0; text-align: center; border-left: 4px solid #28a745; }
            .tips { background-color: #e7f3ff; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Roomy!</h1>
            </div>
            
            <div class="content">
              <div class="welcome-card">
                <h2>Hi ${userName}! 👋</h2>
                <p>You've successfully joined "<strong>${groupName}</strong>"</p>
                <p>You're now part of a ${memberCount}-member household managed by ${adminName}</p>
              </div>

              <div class="tips">
                <h3>💡 Quick Tips to Get Started:</h3>
                <ul style="text-align: left;">
                  <li><strong>📋 Create your first task:</strong> Tap the "+" button and assign household chores</li>
                  <li><strong>🗣️ Try voice commands:</strong> Say "The kitchen needs cleaning" to create tasks instantly</li>
                  <li><strong>📅 Check the calendar:</strong> See what everyone's working on and upcoming deadlines</li>
                  <li><strong>💰 Log expenses:</strong> Add shared costs and we'll split them fairly</li>
                  <li><strong>👥 View your housemates:</strong> See who's in your group and their current tasks</li>
                </ul>
              </div>

              <p style="text-align: center; margin: 30px 0;">
                Ready to make household management effortless? Start exploring! 🚀
              </p>
            </div>
            
            <div class="footer">
              <p>Need help? Check our help center or contact support</p>
              <p>Happy organizing! - The Roomy Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hi ${userName}!

Welcome to Roomy! 🎉

You've successfully joined "${groupName}" - a ${memberCount}-member household managed by ${adminName}.

Quick Tips to Get Started:
- Create your first task: Tap the "+" button and assign household chores
- Try voice commands: Say "The kitchen needs cleaning" to create tasks instantly  
- Check the calendar: See what everyone's working on and upcoming deadlines
- Log expenses: Add shared costs and we'll split them fairly
- View your housemates: See who's in your group and their current tasks

Ready to make household management effortless? Start exploring!

Need help? Check our help center or contact support.
Happy organizing! - The Roomy Team
      `
    };
  },

  roleChanged: (data) => {
    const { userName, groupName, newRole, changedBy } = data;
    
    return {
      subject: `👑 Your role in "${groupName}" has been updated`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #ffc107 0%, #ff8c00 100%); padding: 30px 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .role-badge { background-color: ${newRole === 'admin' ? '#28a745' : '#6c757d'}; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: white; margin: 0;">👑 Role Update</h1>
            </div>
            <div class="content">
              <h2>Hi ${userName}!</h2>
              <p>Your role in "<strong>${groupName}</strong>" has been updated by ${changedBy}.</p>
              <p>Your new role: <span class="role-badge">${newRole.toUpperCase()}</span></p>
              
              ${newRole === 'admin' ? `
                <div style="background-color: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3>🎉 Congratulations! You're now an admin!</h3>
                  <p>As an admin, you can now:</p>
                  <ul>
                    <li>Manage group members and settings</li>
                    <li>Remove members from the group</li>
                    <li>Transfer admin role to other members</li>
                    <li>Delete any tasks and expenses</li>
                    <li>Generate new invite codes</li>
                  </ul>
                </div>
              ` : `
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p>You're now a regular member of the group. You can still:</p>
                  <ul>
                    <li>Create and manage your own tasks</li>
                    <li>View all group activities</li>
                    <li>Log shared expenses</li>
                    <li>Leave the group if needed</li>
                  </ul>
                </div>
              `}
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hi ${userName}!

Your role in "${groupName}" has been updated by ${changedBy}.

Your new role: ${newRole.toUpperCase()}

${newRole === 'admin' ? 
  `Congratulations! You're now an admin! As an admin, you can now manage group members and settings, remove members, transfer admin role, delete any tasks and expenses, and generate new invite codes.` :
  `You're now a regular member of the group. You can still create and manage your own tasks, view all group activities, log shared expenses, and leave the group if needed.`
}
      `
    };
  },

    taskReassigned: (data) => {
    const { newAssigneeName, taskTitle, reassignedBy, groupName, dueDate, priority } = data;
    
    return {
      subject: `🔄 Task reassigned to you: "${taskTitle}"`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #ff9500 0%, #ff6b35 100%); padding: 30px 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .task-card { background-color: #fff8f0; border-left: 4px solid #ff9500; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .priority-badge { background-color: ${priority === 'high' ? '#dc3545' : priority === 'medium' ? '#ffc107' : '#28a745'}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
            .button { display: inline-block; background: linear-gradient(135deg, #ff9500 0%, #ff6b35 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: white; margin: 0;">🔄 Task Reassigned</h1>
            </div>
            <div class="content">
              <h2>Hi ${newAssigneeName}!</h2>
              <p><strong>${reassignedBy}</strong> has reassigned a task to you in <strong>${groupName}</strong>:</p>
              
              <div class="task-card">
                <h3>📋 ${taskTitle}</h3>
                <p><span class="priority-badge">${priority.toUpperCase()}</span></p>
                ${dueDate ? `<p><strong>Due:</strong> ${new Date(dueDate).toLocaleDateString()}</p>` : ''}
              </div>

              <p>This task was previously assigned to someone else, but now it's yours to complete!</p>
              
              <div style="text-align: center;">
                <a href="#" class="button">View Task Details</a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hi ${newAssigneeName}!

${reassignedBy} has reassigned a task to you in ${groupName}:

📋 ${taskTitle}
Priority: ${priority.toUpperCase()}
${dueDate ? `Due: ${new Date(dueDate).toLocaleDateString()}` : ''}

This task was previously assigned to someone else, but now it's yours to complete!

Check the Roomy app to see the full details and mark it complete when done.
      `
    };
  },

  taskUpdated: (data) => {
    const { assigneeName, taskTitle, updatedBy, groupName, changes } = data;
    
    const changesList = Object.entries(changes).map(([field, { old, new: newVal }]) => {
      return `<li><strong>${field}:</strong> ${old} → ${newVal}</li>`;
    }).join('');
    
    return {
      subject: `📝 Task updated: "${taskTitle}"`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); padding: 30px 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .changes-card { background-color: #f8f9fa; border-left: 4px solid #007bff; padding: 20px; margin: 20px 0; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: white; margin: 0;">📝 Task Updated</h1>
            </div>
            <div class="content">
              <h2>Hi ${assigneeName}!</h2>
              <p><strong>${updatedBy}</strong> updated your assigned task in <strong>${groupName}</strong>:</p>
              
              <div class="changes-card">
                <h3>📋 ${taskTitle}</h3>
                <p><strong>Changes made:</strong></p>
                <ul>${changesList}</ul>
              </div>

              <p>Check the Roomy app to see the updated task details!</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hi ${assigneeName}!

${updatedBy} updated your assigned task in ${groupName}:

📋 ${taskTitle}

Changes made:
${Object.entries(changes).map(([field, { old, new: newVal }]) => `- ${field}: ${old} → ${newVal}`).join('\n')}

Check the Roomy app to see the updated task details!
      `
    };
  },

  taskCompleted: (data) => {
    const { creatorName, taskTitle, completedBy, groupName, actualDuration } = data;
    
    return {
      subject: `✅ Task completed: "${taskTitle}"`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .completion-card { background-color: #f8fff9; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: white; margin: 0;">✅ Task Completed!</h1>
            </div>
            <div class="content">
              <h2>Great news, ${creatorName}!</h2>
              <p><strong>${completedBy}</strong> has completed the task you created in <strong>${groupName}</strong>:</p>
              
              <div class="completion-card">
                <h3>✅ ${taskTitle}</h3>
                <p><strong>Completed by:</strong> ${completedBy}</p>
                ${actualDuration ? `<p><strong>Time taken:</strong> ${actualDuration} minutes</p>` : ''}
                <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">COMPLETED</span></p>
              </div>

              <p>🎉 Thanks for staying organized with Roomy!</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Great news, ${creatorName}!

${completedBy} has completed the task you created in ${groupName}:

✅ ${taskTitle}
Completed by: ${completedBy}
${actualDuration ? `Time taken: ${actualDuration} minutes` : ''}
Status: COMPLETED

🎉 Thanks for staying organized with Roomy!
      `
    };
  },

  taskDueSoon: (data) => {
    const { assigneeName, taskTitle, groupName, dueDate, hoursUntilDue } = data;
    
    return {
      subject: `⏰ Task due soon: "${taskTitle}"`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%); padding: 30px 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .reminder-card { background-color: #fff8e1; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: white; margin: 0;">⏰ Task Due Soon</h1>
            </div>
            <div class="content">
              <h2>Hi ${assigneeName}!</h2>
              <p>Just a friendly reminder that you have a task due soon in <strong>${groupName}</strong>:</p>
              
              <div class="reminder-card">
                <h3>📋 ${taskTitle}</h3>
                <p><strong>Due:</strong> ${new Date(dueDate).toLocaleString()}</p>
                <p><strong>Time remaining:</strong> ${hoursUntilDue} hours</p>
              </div>

              <p>Don't forget to mark it complete when you're done! 🎯</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hi ${assigneeName}!

Just a friendly reminder that you have a task due soon in ${groupName}:

📋 ${taskTitle}
Due: ${new Date(dueDate).toLocaleString()}
Time remaining: ${hoursUntilDue} hours

Don't forget to mark it complete when you're done! 🎯
      `
    };
}
}

module.exports = emailTemplates;