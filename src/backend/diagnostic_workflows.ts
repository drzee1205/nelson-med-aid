
import { StateGraph, END } from '@langchain/langgraph';
import { llmService } from './llm_service';
import { supabaseService } from './supabase_service';

interface DiagnosticState {
  sessionId: string;
  symptoms: string;
  history: any;
  initialAssessment?: string;
  differentialDiagnosis?: any[];
  evidence?: any;
  treatmentPlan?: string;
  followUp?: string;
  error?: string;
  workflowId?: string;
}

class DiagnosticWorkflow {
  private workflow: StateGraph<DiagnosticState>;

  constructor() {
    this.workflow = new StateGraph({
      channels: {
        sessionId: { value: (x, y) => y, default: () => '' },
        symptoms: { value: (x, y) => y, default: () => '' },
        history: { value: (x, y) => y, default: () => ({}) },
        initialAssessment: { value: (x, y) => y, default: () => undefined },
        differentialDiagnosis: { value: (x, y) => y, default: () => undefined },
        evidence: { value: (x, y) => y, default: () => undefined },
        treatmentPlan: { value: (x, y) => y, default: () => undefined },
        followUp: { value: (x, y) => y, default: () => undefined },
        error: { value: (x, y) => y, default: () => undefined },
        workflowId: { value: (x, y) => y, default: () => undefined },
      },
    });

    this.initializeWorkflow();
  }

  private initializeWorkflow() {
    this.workflow.addNode('start_workflow', this.startWorkflow.bind(this));
    this.workflow.addNode('initial_assessment', this.initialAssessment.bind(this));
    this.workflow.addNode('differential_diagnosis', this.differentialDiagnosis.bind(this));
    this.workflow.addNode('evaluate_evidence', this.evaluateEvidence.bind(this));
    this.workflow.addNode('recommend_treatment', this.recommendTreatment.bind(this));
    this.workflow.addNode('provide_follow_up', this.provideFollowUp.bind(this));
    this.workflow.addNode('handle_error', this.handleError.bind(this));

    this.workflow.setEntryPoint('start_workflow');
    this.workflow.addEdge('start_workflow', 'initial_assessment');
    this.workflow.addEdge('initial_assessment', 'differential_diagnosis');
    this.workflow.addEdge('differential_diagnosis', 'evaluate_evidence');
    this.workflow.addEdge('evaluate_evidence', 'recommend_treatment');
    this.workflow.addEdge('recommend_treatment', 'provide_follow_up');
    this.workflow.addEdge('provide_follow_up', END);
  }

  private async startWorkflow(state: DiagnosticState): Promise<Partial<DiagnosticState>> {
    const { sessionId, symptoms } = state;
    // This assumes a query ID is available or can be created. Using a placeholder for now.
    const queryId = 1; 
    const workflow = await supabaseService.createDiagnosticWorkflow({ session_id: sessionId, query_id: queryId, step_data: { symptoms } });
    return { workflowId: workflow.id };
  }

  private async initialAssessment(state: DiagnosticState): Promise<Partial<DiagnosticState>> {
    const { symptoms, history, workflowId } = state;
    const response = await llmService.generateResponse(`Provide an initial assessment for a patient with these symptoms: ${symptoms}`, history);
    if (!response.success) return { error: 'Failed to get initial assessment.' };
    
    // Placeholder for validation, scoring, safety checks
    this.validateStep(response.data);
    const initialAssessment = response.data.choices[0].message.content;
    await supabaseService.updateDiagnosticWorkflow(workflowId!, { step_data: { ...state, initialAssessment }, current_step: 2 });

    return { initialAssessment };
  }

  private async differentialDiagnosis(state: DiagnosticState): Promise<Partial<DiagnosticState>> {
    const { initialAssessment, history, workflowId } = state;
    const response = await llmService.generateResponse(`Based on this assessment, provide a differential diagnosis: ${initialAssessment}`, history);
    if (!response.success) return { error: 'Failed to generate differential diagnosis.' };

    // Placeholder for parallel processing and confidence scoring
    const diagnoses = this.parseDiagnoses(response.data.choices[0].message.content);
    await supabaseService.updateDiagnosticWorkflow(workflowId!, { step_data: { ...state, differentialDiagnosis: diagnoses }, current_step: 3 });

    return { differentialDiagnosis: diagnoses };
  }

  private async evaluateEvidence(state: DiagnosticState): Promise<Partial<DiagnosticState>> {
    const { differentialDiagnosis, history, workflowId } = state;
    const response = await llmService.generateResponse(`Evaluate the evidence for these diagnoses: ${JSON.stringify(differentialDiagnosis)}`, history);
    if (!response.success) return { error: 'Failed to evaluate evidence.' };

    const evidence = response.data.choices[0].message.content;
    await supabaseService.updateDiagnosticWorkflow(workflowId!, { step_data: { ...state, evidence }, current_step: 4 });

    return { evidence };
  }

  private async recommendTreatment(state: DiagnosticState): Promise<Partial<DiagnosticState>> {
    const { evidence, history, workflowId } = state;
    const response = await llmService.generateResponse(`Recommend a treatment plan based on this evidence: ${evidence}`, history);
    if (!response.success) return { error: 'Failed to recommend treatment.' };

    const treatmentPlan = response.data.choices[0].message.content;
    await supabaseService.updateDiagnosticWorkflow(workflowId!, { step_data: { ...state, treatmentPlan }, current_step: 5 });

    return { treatmentPlan };
  }

  private async provideFollowUp(state: DiagnosticState): Promise<Partial<DiagnosticState>> {
    const { treatmentPlan, history, workflowId } = state;
    const response = await llmService.generateResponse(`Provide follow-up guidance for this treatment plan: ${treatmentPlan}`, history);
    if (!response.success) return { error: 'Failed to provide follow-up.' };

    const followUp = response.data.choices[0].message.content;
    await supabaseService.updateDiagnosticWorkflow(workflowId!, { step_data: { ...state, followUp }, completed_at: new Date().toISOString(), current_step: 6 });

    return { followUp };
  }

  private async handleError(state: DiagnosticState): Promise<Partial<DiagnosticState>> {
    console.error('Error in diagnostic workflow:', state.error);
    return { error: `Error: ${state.error}` };
  }

  private validateStep(data: any) {
    // Placeholder for validation logic
    console.log('Validating step...', data);
  }

  private parseDiagnoses(responseText: string): any[] {
    // Placeholder for parsing logic
    return responseText.split('
  }

  public async execute(sessionId: string, symptoms: string, history: any) {
    const app = this.workflow.compile();
    const result = await app.invoke({ sessionId, symptoms, history });
    return result;
  }
}

export const diagnosticWorkflow = new DiagnosticWorkflow();

