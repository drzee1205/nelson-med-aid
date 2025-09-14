import { StateGraph, END } from '@langchain/langgraph';
import { llmService } from './llm_service';
import { supabaseService } from './supabase_service';
import { diagnosticWorkflow } from './diagnostic_workflows';

interface AppState {
  sessionId: string;
  isAuthenticated: boolean;
  query: string;
  urgency?: 'emergency' | 'urgent' | 'routine';
  specialty?: 'cardiology' | 'neurology' | 'general pediatrics';
  complexity?: 'simple' | 'complex';
  history?: any;
  result?: any;
  error?: string;
}

class OrchestrationEngine {
  private workflow: StateGraph<AppState>;

  constructor() {
    this.workflow = new StateGraph({
      channels: {
        sessionId: { value: (x, y) => y, default: () => '' },
        isAuthenticated: { value: (x, y) => y, default: () => false },
        query: { value: (x, y) => y, default: () => '' },
        urgency: { value: (x, y) => y, default: () => 'routine' },
        specialty: { value: (x, y) => y, default: () => 'general pediatrics' },
        complexity: { value: (x, y) => y, default: () => 'simple' },
        history: { value: (x, y) => y, default: () => ({}) },
        result: { value: (x, y) => y, default: () => null },
        error: { value: (x, y) => y, default: () => undefined },
      },
    });

    this.initializeWorkflow();
  }

  private initializeWorkflow() {
    this.workflow.addNode('check_auth', this.checkAuth.bind(this));
    this.workflow.addNode('get_context', this.getContext.bind(this));
    this.workflow.addNode('route_query', this.routeQuery.bind(this));
    this.workflow.addNode('handle_general_pediatrics', this.handleGeneralPediatrics.bind(this));
    this.workflow.addNode('handle_cardiology', this.handleCardiology.bind(this));
    this.workflow.addNode('handle_neurology', this.handleNeurology.bind(this));
    this.workflow.addNode('handle_error', this.handleError.bind(this));
    this.workflow.addNode('update_context', this.updateContext.bind(this));

    this.workflow.setEntryPoint('check_auth');
    this.workflow.addConditionalEdges('check_auth', (state: AppState) => {
      return state.isAuthenticated ? 'get_context' : 'handle_error';
    });
    this.workflow.addEdge('get_context', 'route_query');    

    this.workflow.addConditionalEdges('route_query', (state: AppState) => {      
      if (state.error) {
        return 'handle_error';
      }

      supabaseService.logAuditEvent({ session_id: state.sessionId, event_type: 'query_routed', event_details: { specialty: state.specialty } });

      switch (state.specialty) {
        case 'cardiology':
          return 'handle_cardiology';
        case 'neurology':
          return 'handle_neurology';
        default:
          return 'handle_general_pediatrics';
      }
    });

    this.workflow.addEdge('handle_general_pediatrics', 'update_context');
    this.workflow.addEdge('handle_cardiology', 'update_context');
    this.workflow.addEdge('handle_neurology', 'update_context');
    this.workflow.addEdge('handle_error', END);
    this.workflow.addEdge('update_context', END);
  }

  private async checkAuth(state: AppState): Promise<Partial<AppState>> {
    // This is a placeholder for actual authentication logic.
    // In a real app, you'd validate a JWT or session cookie.
    const isAuthenticated = !!state.sessionId; 
    if (!isAuthenticated) {
      return { isAuthenticated: false, error: 'Authentication failed.' };
    }
    return { isAuthenticated: true };
  }

  private async getContext(state: AppState): Promise<Partial<AppState>> {
    const { sessionId } = state;
    const history = await supabaseService.getConversationHistory(sessionId);
    const patientContext = await supabaseService.getPatientContext(sessionId);
    return { history: { ...history, patientContext } };
  }

  private async routeQuery(state: AppState): Promise<Partial<AppState>> {
    try {
      const { query, history } = state;
      const response = await llmService.generateResponse(
        `Classify the following query into urgency, specialty, and complexity: "${query}"`, history
      );
      
      if (!response.success) {
        return { error: 'Failed to classify query.' };
      }

      const classification = response.data.choices[0].message.content;
      // This is a simplified parsing logic. A more robust implementation is needed.
      const specialty = classification.match(/specialty: (\w+)/i)?.[1].toLowerCase() as AppState['specialty'] || 'general pediatrics';
      
      return { specialty };
    } catch (error) {
      return { error: 'An unexpected error occurred during query routing.' };
    }
  }

  private async handleGeneralPediatrics(state: AppState): Promise<Partial<AppState>> {
    const { sessionId, query, history } = state;
    const result = await diagnosticWorkflow.execute(sessionId, query, history);
    return { result };
  }

  private async handleCardiology(state: AppState): Promise<Partial<AppState>> {
    // Placeholder for cardiology-specific workflow
    return { result: 'Handling cardiology query.' };
  }

  private async handleNeurology(state: AppState): Promise<Partial<AppState>> {
    // Placeholder for neurology-specific workflow
    return { result: 'Handling neurology query.' };
  }

  private async updateContext(state: AppState): Promise<Partial<AppState>> {
    const { sessionId, history, result } = state;
    await supabaseService.storeConversationHistory(sessionId, { ...history, user: state.query, assistant: result });
    return {};
  }

  private async handleError(state: AppState): Promise<Partial<AppState>> {
    console.error('Error in workflow:', state.error);
    return { result: `Error: ${state.error}` };
  }

  public async execute(sessionId: string, query: string) {
    const app = this.workflow.compile();
    const result = await app.invoke({ sessionId, query, isAuthenticated: false });
    return result;
  }
}

export const orchestrationEngine = new OrchestrationEngine();

