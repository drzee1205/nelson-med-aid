import { StateGraph, END } from '@langchain/langgraph';
import { llmService } from './llm_service';

interface AppState {
  query: string;
  urgency?: 'emergency' | 'urgent' | 'routine';
  specialty?: 'cardiology' | 'neurology' | 'general pediatrics';
  complexity?: 'simple' | 'complex';
  result?: any;
  error?: string;
}

class OrchestrationEngine {
  private workflow: StateGraph<AppState>;

  constructor() {
    this.workflow = new StateGraph({
      channels: {
        query: { value: (x, y) => y, default: () => '' },
        urgency: { value: (x, y) => y, default: () => 'routine' },
        specialty: { value: (x, y) => y, default: () => 'general pediatrics' },
        complexity: { value: (x, y) => y, default: () => 'simple' },
        result: { value: (x, y) => y, default: () => null },
        error: { value: (x, y) => y, default: () => undefined },
      },
    });

    this.initializeWorkflow();
  }

  private initializeWorkflow() {
    this.workflow.addNode('route_query', this.routeQuery.bind(this));
    this.workflow.addNode('handle_general_pediatrics', this.handleGeneralPediatrics.bind(this));
    this.workflow.addNode('handle_cardiology', this.handleCardiology.bind(this));
    this.workflow.addNode('handle_neurology', this.handleNeurology.bind(this));
    this.workflow.addNode('handle_error', this.handleError.bind(this));

    this.workflow.setEntryPoint('route_query');

    this.workflow.addConditionalEdges('route_query', (state: AppState) => {
      if (state.error) {
        return 'handle_error';
      }
      switch (state.specialty) {
        case 'cardiology':
          return 'handle_cardiology';
        case 'neurology':
          return 'handle_neurology';
        default:
          return 'handle_general_pediatrics';
      }
    });

    this.workflow.addEdge('handle_general_pediatrics', END);
    this.workflow.addEdge('handle_cardiology', END);
    this.workflow.addEdge('handle_neurology', END);
    this.workflow.addEdge('handle_error', END);
  }

  private async routeQuery(state: AppState): Promise<Partial<AppState>> {
    try {
      const { query } = state;
      const response = await llmService.generateResponse(`Classify the following query into urgency, specialty, and complexity: "${query}"`, {});
      
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
    return { result: 'Handling general pediatrics query.' };
  }

  private async handleCardiology(state: AppState): Promise<Partial<AppState>> {
    return { result: 'Handling cardiology query.' };
  }

  private async handleNeurology(state: AppState): Promise<Partial<AppState>> {
    return { result: 'Handling neurology query.' };
  }

  private async handleError(state: AppState): Promise<Partial<AppState>> {
    console.error('Error in workflow:', state.error);
    return { result: `Error: ${state.error}` };
  }

  public async execute(query: string) {
    const app = this.workflow.compile();
    const result = await app.invoke({ query });
    return result;
  }
}
