import { Response } from 'express';
import OpenAI from 'openai';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { config } from '../config/env';
import { logger } from '../utils/logger';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

const systemPrompt = `You are NexusFlow AI, an intelligent productivity assistant integrated into a collaborative workspace platform. You help teams:
- Summarize tasks and projects
- Generate subtasks and action items
- Rewrite and improve task descriptions
- Suggest realistic deadlines
- Provide productivity insights
- Analyze team performance
- Generate meeting summaries
Always be concise, professional, and actionable. Format responses with markdown when appropriate.`;

export const summarizeTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.body;
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: { select: { name: true } },
        comments: { include: { user: { select: { name: true } } }, take: 10 },
      },
    });
    if (!task) {
      res.status(404).json({ success: false, error: { message: 'Task not found' } });
      return;
    }

    const prompt = `Summarize this task concisely:
Title: ${task.title}
Description: ${task.description || 'No description'}
Status: ${task.status}
Priority: ${task.priority}
Assignee: ${task.assignee?.name || 'Unassigned'}
Due Date: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
Comments (${task.comments.length}): ${task.comments.map(c => `${c.user.name}: ${c.message}`).join(' | ')}

Provide a 2-3 sentence executive summary, key blockers if any, and recommended next action.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const summary = completion.choices[0]?.message?.content || 'Unable to generate summary';
    res.json({ success: true, data: { summary } });
  } catch (error: unknown) {
    logger.error('AI summarize error:', error);
    const message = error instanceof Error ? error.message : 'AI service unavailable';
    res.status(503).json({ success: false, error: { message } });
  }
};

export const generateSubtasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description } = req.body;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Generate 5-7 specific, actionable subtasks for:
Task: ${title}
Description: ${description || 'No description'}

Return ONLY a JSON array of objects with: { "title": string, "priority": "LOW"|"MEDIUM"|"HIGH", "estimatedHours": number }
No markdown, just valid JSON.`,
        },
      ],
      max_tokens: 500,
      temperature: 0.8,
    });

    const content = completion.choices[0]?.message?.content || '[]';
    let subtasks = [];
    try {
      const cleaned = content.replace(/```json\n?|\n?```/g, '').trim();
      subtasks = JSON.parse(cleaned);
    } catch {
      subtasks = [{ title: 'Review requirements', priority: 'HIGH', estimatedHours: 1 }];
    }

    res.json({ success: true, data: { subtasks } });
  } catch (error) {
    logger.error('AI generate subtasks error:', error);
    res.status(503).json({ success: false, error: { message: 'AI service unavailable' } });
  }
};

export const rewriteDescription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { description, tone } = req.body;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Rewrite this task description in a ${tone || 'professional'} tone, making it clearer and more actionable:

"${description}"

Keep it concise (2-4 sentences). Return only the rewritten description.`,
        },
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    const rewritten = completion.choices[0]?.message?.content || description;
    res.json({ success: true, data: { description: rewritten } });
  } catch (error) {
    res.status(503).json({ success: false, error: { message: 'AI service unavailable' } });
  }
};

export const suggestDeadline = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, priority, complexity } = req.body;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Suggest a realistic deadline for this task starting from today (${new Date().toLocaleDateString()}):
Title: ${title}
Description: ${description || 'No description'}
Priority: ${priority || 'MEDIUM'}
Complexity: ${complexity || 'medium'}

Return JSON: { "days": number, "reasoning": string, "suggestedDate": "YYYY-MM-DD" }`,
        },
      ],
      max_tokens: 200,
      temperature: 0.5,
    });

    const content = completion.choices[0]?.message?.content || '{}';
    let result = {};
    try {
      const cleaned = content.replace(/```json\n?|\n?```/g, '').trim();
      result = JSON.parse(cleaned);
    } catch {
      const days = priority === 'URGENT' ? 1 : priority === 'HIGH' ? 3 : priority === 'MEDIUM' ? 7 : 14;
      const suggestedDate = new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
      result = { days, reasoning: 'Based on priority level', suggestedDate };
    }

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(503).json({ success: false, error: { message: 'AI service unavailable' } });
  }
};

export const aiChat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { message, chatHistory, context } = req.body;

    // Build context-aware prompt
    let contextStr = '';
    if (context?.workspace) {
      contextStr += `\nCurrent workspace: ${context.workspace.name}`;
    }
    if (context?.recentTasks) {
      contextStr += `\nRecent tasks: ${context.recentTasks.map((t: { title: string; status: string }) => `${t.title} (${t.status})`).join(', ')}`;
    }

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt + contextStr },
      ...(chatHistory || []).slice(-10).map((msg: { role: 'user' | 'assistant'; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user', content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 800,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content || 'I apologize, I could not generate a response.';
    const tokensUsed = completion.usage?.total_tokens || 0;

    res.json({ success: true, data: { reply, tokensUsed } });
  } catch (error: unknown) {
    logger.error('AI chat error:', error);
    const msg = error instanceof Error ? error.message : 'AI service unavailable. Please check your OpenAI API key.';
    res.status(503).json({ success: false, error: { message: msg } });
  }
};

export const generateMeetingSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { notes, participants, date } = req.body;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Generate a professional meeting summary:
Date: ${date || new Date().toLocaleDateString()}
Participants: ${participants?.join(', ') || 'Team'}
Notes: ${notes}

Structure: ## Meeting Summary\n### Key Decisions\n### Action Items\n### Next Steps`,
        },
      ],
      max_tokens: 600,
      temperature: 0.6,
    });

    const summary = completion.choices[0]?.message?.content || 'Unable to generate summary';
    res.json({ success: true, data: { summary } });
  } catch (error) {
    res.status(503).json({ success: false, error: { message: 'AI service unavailable' } });
  }
};

export const getProductivityInsights = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [completedTasks, overdueTasks, totalTasks] = await Promise.all([
      prisma.task.count({ where: { assigneeId: userId, status: 'COMPLETED', updatedAt: { gte: thirtyDaysAgo } } }),
      prisma.task.count({ where: { assigneeId: userId, status: { not: 'COMPLETED' }, dueDate: { lt: new Date() } } }),
      prisma.task.count({ where: { assigneeId: userId, createdAt: { gte: thirtyDaysAgo } } }),
    ]);

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Provide brief productivity insights for a team member:
Last 30 days:
- Completed tasks: ${completedTasks}
- Overdue tasks: ${overdueTasks}
- Total tasks: ${totalTasks}
- Completion rate: ${completionRate}%

Give 3 specific, actionable insights in bullet points. Be encouraging but honest.`,
        },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const insights = completion.choices[0]?.message?.content || 'Keep up the great work!';
    res.json({
      success: true,
      data: { insights, stats: { completedTasks, overdueTasks, totalTasks, completionRate } },
    });
  } catch (error) {
    res.status(503).json({ success: false, error: { message: 'AI service unavailable' } });
  }
};
