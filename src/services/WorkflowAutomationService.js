// Workflow Automation and Task Orchestration Service for Aria
class WorkflowAutomationService {
  constructor() {
    this.workflows = new Map();
    this.templates = new Map();
    this.schedules = new Map();
    this.automations = new Map();
    this.triggers = new Map();
    this.taskQueues = new Map();
    
    this.executionHistory = [];
    this.metrics = {
      workflowsExecuted: 0,
      automationsTriggered: 0,
      tasksCompleted: 0,
      averageExecutionTime: 0,
      successRate: 0
    };
    
    this.config = {
      maxConcurrentWorkflows: 5,
      maxQueueSize: 100,
      defaultTimeout: 300000, // 5 minutes
      retryAttempts: 3,
      healthCheckInterval: 60000 // 1 minute
    };
    
    this.storageKey = 'aria_workflow_automation';
    this.loadWorkflows();
    this.startAutomationEngine();
  }

  // Load workflows from storage
  loadWorkflows() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        
        this.workflows = new Map(data.workflows || []);
        this.templates = new Map(data.templates || []);
        this.schedules = new Map(data.schedules || []);
        this.automations = new Map(data.automations || []);
        this.triggers = new Map(data.triggers || []);
        this.taskQueues = new Map(data.taskQueues || []);
        this.executionHistory = data.executionHistory || [];
        this.metrics = { ...this.metrics, ...data.metrics };
        
        console.log('[Workflow] Loaded automation data:', {
          workflows: this.workflows.size,
          templates: this.templates.size,
          automations: this.automations.size
        });
      }
    } catch (error) {
      console.error('[Workflow] Failed to load workflows:', error);
    }
  }

  // Save workflows to storage
  saveWorkflows() {
    try {
      const data = {
        workflows: Array.from(this.workflows.entries()),
        templates: Array.from(this.templates.entries()),
        schedules: Array.from(this.schedules.entries()),
        automations: Array.from(this.automations.entries()),
        triggers: Array.from(this.triggers.entries()),
        taskQueues: Array.from(this.taskQueues.entries()),
        executionHistory: this.executionHistory.slice(-100), // Keep last 100 executions
        metrics: this.metrics,
        lastSave: Date.now()
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('[Workflow] Failed to save workflows:', error);
    }
  }

  // Create workflow template
  createWorkflowTemplate(templateName, description, steps, category = 'general') {
    const template = {
      id: `template_${Date.now()}`,
      name: templateName,
      description,
      category,
      steps: steps.map((step, index) => ({
        id: `step_${index}`,
        order: index,
        ...step,
        status: 'pending'
      })),
      metadata: {
        createdAt: Date.now(),
        lastModified: Date.now(),
        usageCount: 0,
        successRate: 0,
        averageExecutionTime: 0
      },
      variables: this.extractVariables(steps),
      dependencies: this.analyzeDependencies(steps),
      estimatedDuration: this.estimateDuration(steps)
    };
    
    this.templates.set(template.id, template);
    this.saveWorkflows();
    
    console.log(`[Workflow] Created template: ${templateName}`);
    return template.id;
  }

  // Extract variables from workflow steps
  extractVariables(steps) {
    const variables = new Set();
    const variableRegex = /\{\{(\w+)\}\}/g;
    
    steps.forEach(step => {
      const stepText = JSON.stringify(step);
      let match;
      while ((match = variableRegex.exec(stepText)) !== null) {
        variables.add(match[1]);
      }
    });
    
    return Array.from(variables).map(name => ({
      name,
      type: 'string',
      required: true,
      defaultValue: null
    }));
  }

  // Analyze step dependencies
  analyzeDependencies(steps) {
    const dependencies = [];
    
    steps.forEach((step, index) => {
      if (step.dependsOn) {
        dependencies.push({
          stepIndex: index,
          dependsOn: Array.isArray(step.dependsOn) ? step.dependsOn : [step.dependsOn],
          type: step.dependencyType || 'sequential'
        });
      }
    });
    
    return dependencies;
  }

  // Estimate workflow duration
  estimateDuration(steps) {
    let totalDuration = 0;
    
    steps.forEach(step => {
      const duration = step.estimatedDuration || 30000; // 30 seconds default
      totalDuration += duration;
    });
    
    return totalDuration;
  }

  // Create workflow instance from template
  async createWorkflowFromTemplate(templateId, variables = {}, options = {}) {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    
    const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Process template variables
    const processedSteps = this.processTemplateVariables(template.steps, variables);
    
    const workflow = {
      id: workflowId,
      templateId,
      name: template.name,
      description: template.description,
      steps: processedSteps,
      status: 'created',
      currentStep: 0,
      variables,
      options: {
        timeout: options.timeout || this.config.defaultTimeout,
        retryAttempts: options.retryAttempts || this.config.retryAttempts,
        priority: options.priority || 'normal',
        ...options
      },
      execution: {
        startedAt: null,
        completedAt: null,
        duration: null,
        logs: [],
        errors: []
      },
      createdAt: Date.now()
    };
    
    this.workflows.set(workflowId, workflow);
    this.saveWorkflows();
    
    console.log(`[Workflow] Created workflow: ${workflowId} from template: ${template.name}`);
    return workflowId;
  }

  // Process template variables in steps
  processTemplateVariables(steps, variables) {
    return steps.map(step => {
      let processedStep = JSON.parse(JSON.stringify(step));
      
      // Replace variables in step content
      const stepText = JSON.stringify(processedStep);
      const processedText = stepText.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
        return variables[varName] || match;
      });
      
      processedStep = JSON.parse(processedText);
      processedStep.status = 'pending';
      
      return processedStep;
    });
  }

  // Execute workflow
  async executeWorkflow(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }
    
    if (workflow.status === 'running') {
      throw new Error(`Workflow already running: ${workflowId}`);
    }
    
    console.log(`[Workflow] Starting execution: ${workflowId}`);
    
    workflow.status = 'running';
    workflow.execution.startedAt = Date.now();
    workflow.currentStep = 0;
    
    try {
      const result = await this.executeWorkflowSteps(workflow);
      
      workflow.status = result.success ? 'completed' : 'failed';
      workflow.execution.completedAt = Date.now();
      workflow.execution.duration = workflow.execution.completedAt - workflow.execution.startedAt;
      
      // Update metrics
      this.updateMetrics(workflow, result);
      
      // Update template metrics
      this.updateTemplateMetrics(workflow.templateId, result);
      
      this.saveWorkflows();
      
      console.log(`[Workflow] Execution ${result.success ? 'completed' : 'failed'}: ${workflowId}`);
      return result;
      
    } catch (error) {
      workflow.status = 'failed';
      workflow.execution.errors.push({
        timestamp: Date.now(),
        error: error.message,
        step: workflow.currentStep
      });
      
      console.error(`[Workflow] Execution failed: ${workflowId}`, error);
      this.saveWorkflows();
      
      return {
        success: false,
        error: error.message,
        workflowId,
        completedSteps: workflow.currentStep
      };
    }
  }

  // Execute workflow steps
  async executeWorkflowSteps(workflow) {
    const results = [];
    
    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      workflow.currentStep = i;
      
      // Check dependencies
      if (!await this.checkStepDependencies(workflow, i)) {
        throw new Error(`Step dependencies not met: ${step.name}`);
      }
      
      step.status = 'running';
      step.startedAt = Date.now();
      
      try {
        const stepResult = await this.executeStep(step, workflow);
        
        step.status = stepResult.success ? 'completed' : 'failed';
        step.completedAt = Date.now();
        step.duration = step.completedAt - step.startedAt;
        step.result = stepResult;
        
        results.push(stepResult);
        
        workflow.execution.logs.push({
          timestamp: Date.now(),
          step: i,
          action: step.action,
          status: step.status,
          message: stepResult.message || 'Step completed'
        });
        
        if (!stepResult.success && !step.continueOnError) {
          break;
        }
        
      } catch (error) {
        step.status = 'failed';
        step.error = error.message;
        
        workflow.execution.errors.push({
          timestamp: Date.now(),
          step: i,
          error: error.message
        });
        
        if (!step.continueOnError) {
          throw error;
        }
      }
    }
    
    const successfulSteps = results.filter(r => r.success).length;
    
    return {
      success: successfulSteps === workflow.steps.length,
      workflowId: workflow.id,
      completedSteps: results.length,
      successfulSteps,
      results,
      duration: workflow.execution.duration
    };
  }

  // Check step dependencies
  async checkStepDependencies(workflow, stepIndex) {
    const dependencies = workflow.dependencies || [];
    const stepDependencies = dependencies.filter(d => d.stepIndex === stepIndex);
    
    for (const dependency of stepDependencies) {
      for (const depIndex of dependency.dependsOn) {
        if (depIndex >= stepIndex) continue; // Can't depend on future steps
        
        const depStep = workflow.steps[depIndex];
        if (!depStep || depStep.status !== 'completed') {
          return false;
        }
      }
    }
    
    return true;
  }

  // Execute individual step
  async executeStep(step, workflow) {
    console.log(`[Workflow] Executing step: ${step.name} (${step.action})`);
    
    switch (step.action) {
      case 'delay':
        return await this.executeDelayStep(step);
      
      case 'api_call':
        return await this.executeApiCallStep(step);
      
      case 'send_message':
        return await this.executeSendMessageStep(step, workflow);
      
      case 'calendar_action':
        return await this.executeCalendarStep(step);
      
      case 'search':
        return await this.executeSearchStep(step);
      
      case 'file_operation':
        return await this.executeFileOperationStep(step);
      
      case 'condition':
        return await this.executeConditionStep(step, workflow);
      
      case 'loop':
        return await this.executeLoopStep(step, workflow);
      
      case 'custom_script':
        return await this.executeCustomScriptStep(step);
      
      default:
        throw new Error(`Unknown step action: ${step.action}`);
    }
  }

  // Execute delay step
  async executeDelayStep(step) {
    const delay = step.parameters.duration || 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return {
      success: true,
      message: `Delayed for ${delay}ms`,
      data: { delay }
    };
  }

  // Execute API call step
  async executeApiCallStep(step) {
    const { url, method = 'GET', headers = {}, body } = step.parameters;
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: body ? JSON.stringify(body) : undefined
      });
      
      const data = await response.json();
      
      return {
        success: response.ok,
        message: `API call ${response.ok ? 'successful' : 'failed'}`,
        data,
        statusCode: response.status
      };
    } catch (error) {
      return {
        success: false,
        message: `API call failed: ${error.message}`,
        error: error.message
      };
    }
  }

  // Execute send message step
  async executeSendMessageStep(step, workflow) {
    const { recipient, message, channel = 'default' } = step.parameters;
    
    // Mock implementation - would integrate with actual messaging services
    console.log(`[Workflow] Sending message to ${recipient} via ${channel}: ${message}`);
    
    return {
      success: true,
      message: `Message sent to ${recipient}`,
      data: { recipient, channel, sentAt: Date.now() }
    };
  }

  // Execute calendar step
  async executeCalendarStep(step) {
    const { action, eventData } = step.parameters;
    
    // Mock implementation - would integrate with calendar service
    console.log(`[Workflow] Calendar action: ${action}`, eventData);
    
    return {
      success: true,
      message: `Calendar ${action} completed`,
      data: { action, eventData, executedAt: Date.now() }
    };
  }

  // Execute search step
  async executeSearchStep(step) {
    const { query, source = 'web' } = step.parameters;
    
    // Mock implementation - would integrate with search services
    console.log(`[Workflow] Searching ${source} for: ${query}`);
    
    return {
      success: true,
      message: `Search completed for: ${query}`,
      data: {
        query,
        source,
        results: [`Result 1 for ${query}`, `Result 2 for ${query}`],
        searchedAt: Date.now()
      }
    };
  }

  // Execute file operation step
  async executeFileOperationStep(step) {
    const { operation, filePath, content } = step.parameters;
    
    // Mock implementation - would integrate with file system
    console.log(`[Workflow] File operation: ${operation} on ${filePath}`);
    
    return {
      success: true,
      message: `File operation ${operation} completed`,
      data: { operation, filePath, executedAt: Date.now() }
    };
  }

  // Execute condition step
  async executeConditionStep(step, workflow) {
    const { condition, trueAction, falseAction } = step.parameters;
    
    // Simple condition evaluation
    const result = this.evaluateCondition(condition, workflow);
    const actionToExecute = result ? trueAction : falseAction;
    
    if (actionToExecute) {
      const actionResult = await this.executeStep(actionToExecute, workflow);
      return {
        success: actionResult.success,
        message: `Condition ${result ? 'true' : 'false'}, executed ${result ? 'true' : 'false'} action`,
        data: { condition: result, actionResult }
      };
    }
    
    return {
      success: true,
      message: `Condition evaluated to ${result}`,
      data: { condition: result }
    };
  }

  // Execute loop step
  async executeLoopStep(step, workflow) {
    const { iterations, loopSteps } = step.parameters;
    const results = [];
    
    for (let i = 0; i < iterations; i++) {
      console.log(`[Workflow] Loop iteration ${i + 1}/${iterations}`);
      
      for (const loopStep of loopSteps) {
        const stepResult = await this.executeStep(loopStep, workflow);
        results.push(stepResult);
        
        if (!stepResult.success && !loopStep.continueOnError) {
          return {
            success: false,
            message: `Loop failed at iteration ${i + 1}`,
            data: { iteration: i + 1, results }
          };
        }
      }
    }
    
    return {
      success: true,
      message: `Loop completed ${iterations} iterations`,
      data: { iterations, results }
    };
  }

  // Execute custom script step
  async executeCustomScriptStep(step) {
    const { script, context = {} } = step.parameters;
    
    try {
      // Safe script execution (simplified)
      const func = new Function('context', `return (${script})(context);`);
      const result = func(context);
      
      return {
        success: true,
        message: 'Custom script executed successfully',
        data: { result }
      };
    } catch (error) {
      return {
        success: false,
        message: `Script execution failed: ${error.message}`,
        error: error.message
      };
    }
  }

  // Evaluate condition
  evaluateCondition(condition, workflow) {
    try {
      // Simple condition evaluation - could be enhanced
      if (typeof condition === 'string') {
        // Basic string evaluation
        return condition.toLowerCase() === 'true';
      } else if (typeof condition === 'object') {
        const { variable, operator, value } = condition;
        const workflowValue = workflow.variables[variable];
        
        switch (operator) {
          case '==': return workflowValue == value;
          case '===': return workflowValue === value;
          case '!=': return workflowValue != value;
          case '>': return workflowValue > value;
          case '<': return workflowValue < value;
          case '>=': return workflowValue >= value;
          case '<=': return workflowValue <= value;
          default: return false;
        }
      }
      
      return false;
    } catch (error) {
      console.warn('[Workflow] Condition evaluation failed:', error);
      return false;
    }
  }

  // Create automation rule
  createAutomation(name, trigger, workflow, enabled = true) {
    const automationId = `automation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const automation = {
      id: automationId,
      name,
      trigger,
      workflowId: workflow,
      enabled,
      createdAt: Date.now(),
      lastTriggered: null,
      triggerCount: 0,
      successCount: 0,
      failureCount: 0
    };
    
    this.automations.set(automationId, automation);
    this.registerTrigger(trigger, automationId);
    this.saveWorkflows();
    
    console.log(`[Workflow] Created automation: ${name}`);
    return automationId;
  }

  // Register trigger
  registerTrigger(trigger, automationId) {
    const { type, condition } = trigger;
    
    if (!this.triggers.has(type)) {
      this.triggers.set(type, []);
    }
    
    this.triggers.get(type).push({
      automationId,
      condition,
      lastChecked: Date.now()
    });
  }

  // Check automation triggers
  async checkTriggers(eventType, eventData = {}) {
    const triggers = this.triggers.get(eventType) || [];
    
    for (const trigger of triggers) {
      const automation = this.automations.get(trigger.automationId);
      
      if (!automation || !automation.enabled) continue;
      
      if (this.evaluateTriggerCondition(trigger.condition, eventData)) {
        console.log(`[Workflow] Trigger activated for automation: ${automation.name}`);
        
        try {
          await this.executeAutomation(automation.id, eventData);
        } catch (error) {
          console.error(`[Workflow] Automation execution failed: ${automation.name}`, error);
        }
      }
    }
  }

  // Evaluate trigger condition
  evaluateTriggerCondition(condition, eventData) {
    if (!condition) return true;
    
    try {
      // Simple condition evaluation
      if (typeof condition === 'function') {
        return condition(eventData);
      } else if (typeof condition === 'object') {
        return this.evaluateCondition(condition, { variables: eventData });
      }
      
      return true;
    } catch (error) {
      console.warn('[Workflow] Trigger condition evaluation failed:', error);
      return false;
    }
  }

  // Execute automation
  async executeAutomation(automationId, triggerData = {}) {
    const automation = this.automations.get(automationId);
    if (!automation) {
      throw new Error(`Automation not found: ${automationId}`);
    }
    
    automation.lastTriggered = Date.now();
    automation.triggerCount++;
    
    try {
      // Create workflow instance from template
      const workflowId = await this.createWorkflowFromTemplate(
        automation.workflowId,
        triggerData,
        { triggeredBy: automationId }
      );
      
      // Execute the workflow
      const result = await this.executeWorkflow(workflowId);
      
      if (result.success) {
        automation.successCount++;
      } else {
        automation.failureCount++;
      }
      
      this.saveWorkflows();
      return result;
      
    } catch (error) {
      automation.failureCount++;
      this.saveWorkflows();
      throw error;
    }
  }

  // Update metrics
  updateMetrics(workflow, result) {
    this.metrics.workflowsExecuted++;
    
    if (result.success) {
      this.metrics.tasksCompleted += result.successfulSteps;
    }
    
    // Update average execution time
    const currentAvg = this.metrics.averageExecutionTime;
    const newTime = workflow.execution.duration;
    this.metrics.averageExecutionTime = 
      (currentAvg * (this.metrics.workflowsExecuted - 1) + newTime) / this.metrics.workflowsExecuted;
    
    // Update success rate
    const successfulWorkflows = this.executionHistory.filter(h => h.success).length + (result.success ? 1 : 0);
    this.metrics.successRate = successfulWorkflows / this.metrics.workflowsExecuted;
    
    // Add to execution history
    this.executionHistory.push({
      workflowId: workflow.id,
      templateId: workflow.templateId,
      startedAt: workflow.execution.startedAt,
      duration: workflow.execution.duration,
      success: result.success,
      stepsCompleted: result.completedSteps
    });
  }

  // Update template metrics
  updateTemplateMetrics(templateId, result) {
    const template = this.templates.get(templateId);
    if (!template) return;
    
    template.metadata.usageCount++;
    
    // Update average execution time
    const currentAvg = template.metadata.averageExecutionTime;
    const newTime = result.duration;
    template.metadata.averageExecutionTime = 
      (currentAvg * (template.metadata.usageCount - 1) + newTime) / template.metadata.usageCount;
    
    // Update success rate
    const successfulRuns = template.metadata.usageCount * template.metadata.successRate + (result.success ? 1 : 0);
    template.metadata.successRate = successfulRuns / template.metadata.usageCount;
    
    template.metadata.lastModified = Date.now();
  }

  // Start automation engine
  startAutomationEngine() {
    // Health check interval
    setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
    
    // Clean up old execution history
    setInterval(() => {
      this.cleanupHistory();
    }, 24 * 60 * 60 * 1000); // Daily cleanup
    
    console.log('[Workflow] Automation engine started');
  }

  // Perform health check
  performHealthCheck() {
    // Check for stuck workflows
    const stuckWorkflows = Array.from(this.workflows.values()).filter(w => 
      w.status === 'running' && 
      Date.now() - w.execution.startedAt > w.options.timeout
    );
    
    stuckWorkflows.forEach(workflow => {
      console.warn(`[Workflow] Timeout detected for workflow: ${workflow.id}`);
      workflow.status = 'timeout';
      workflow.execution.errors.push({
        timestamp: Date.now(),
        error: 'Workflow timeout',
        step: workflow.currentStep
      });
    });
    
    if (stuckWorkflows.length > 0) {
      this.saveWorkflows();
    }
  }

  // Clean up old history
  cleanupHistory() {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days
    
    this.executionHistory = this.executionHistory.filter(h => h.startedAt > cutoff);
    
    // Clean up completed workflows
    for (const [id, workflow] of this.workflows.entries()) {
      if (workflow.status === 'completed' && workflow.execution.completedAt < cutoff) {
        this.workflows.delete(id);
      }
    }
    
    this.saveWorkflows();
    console.log('[Workflow] Performed history cleanup');
  }

  // Get workflow status
  getWorkflowStatus(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;
    
    return {
      id: workflow.id,
      name: workflow.name,
      status: workflow.status,
      currentStep: workflow.currentStep,
      totalSteps: workflow.steps.length,
      progress: (workflow.currentStep / workflow.steps.length) * 100,
      startedAt: workflow.execution.startedAt,
      duration: workflow.execution.duration,
      errors: workflow.execution.errors
    };
  }

  // Get automation insights
  getAutomationInsights() {
    const automations = Array.from(this.automations.values());
    
    return {
      totalAutomations: automations.length,
      enabledAutomations: automations.filter(a => a.enabled).length,
      totalTriggers: automations.reduce((sum, a) => sum + a.triggerCount, 0),
      totalSuccesses: automations.reduce((sum, a) => sum + a.successCount, 0),
      totalFailures: automations.reduce((sum, a) => sum + a.failureCount, 0),
      templates: this.templates.size,
      workflows: this.workflows.size,
      metrics: this.metrics,
      mostUsedTemplate: this.getMostUsedTemplate(),
      recentExecutions: this.executionHistory.slice(-10)
    };
  }

  // Get most used template
  getMostUsedTemplate() {
    let mostUsed = null;
    let maxUsage = 0;
    
    for (const template of this.templates.values()) {
      if (template.metadata.usageCount > maxUsage) {
        maxUsage = template.metadata.usageCount;
        mostUsed = template;
      }
    }
    
    return mostUsed ? {
      id: mostUsed.id,
      name: mostUsed.name,
      usageCount: mostUsed.metadata.usageCount,
      successRate: mostUsed.metadata.successRate
    } : null;
  }

  // Create predefined templates
  createPredefinedTemplates() {
    // Daily Routine Template
    this.createWorkflowTemplate(
      'Daily Routine',
      'Automated daily routine workflow',
      [
        {
          name: 'Check Weather',
          action: 'search',
          parameters: { query: 'weather today', source: 'weather' }
        },
        {
          name: 'Check Calendar',
          action: 'calendar_action',
          parameters: { action: 'get_today_events' }
        },
        {
          name: 'Send Summary',
          action: 'send_message',
          parameters: {
            recipient: '{{user}}',
            message: 'Good morning! Here\'s your daily summary.',
            channel: 'notification'
          }
        }
      ],
      'routine'
    );
    
    // Research Project Template
    this.createWorkflowTemplate(
      'Research Project',
      'Automated research workflow',
      [
        {
          name: 'Initial Search',
          action: 'search',
          parameters: { query: '{{topic}}', source: 'web' }
        },
        {
          name: 'Gather Related Topics',
          action: 'search',
          parameters: { query: '{{topic}} related research', source: 'academic' }
        },
        {
          name: 'Create Summary',
          action: 'custom_script',
          parameters: {
            script: '(context) => ({ summary: `Research summary for ${context.topic}` })',
            context: { topic: '{{topic}}' }
          }
        },
        {
          name: 'Save Results',
          action: 'file_operation',
          parameters: {
            operation: 'save',
            filePath: '{{output_file}}',
            content: 'Research results'
          }
        }
      ],
      'research'
    );
    
    this.saveWorkflows();
    console.log('[Workflow] Created predefined templates');
  }
}

export default new WorkflowAutomationService();