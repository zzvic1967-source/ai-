import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Simple types for server parsing
interface Agent {
  id: string;
  name: string;
  role: string;
  model: string;
  systemInstruction: string;
  description: string;
}

interface Workflow {
  id: string;
  name: string;
  type: 'sequential' | 'parallel' | 'review' | 'routing';
  agents: Agent[];
  inputTask: string;
}

interface SimulationLog {
  id: string;
  agentId?: string;
  agentName?: string;
  timestamp: string;
  type: 'thought' | 'output' | 'system' | 'error';
  message: string;
  content?: string;
}

// Lazy initialization of Gemini SDK
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.log("Gemini API Key is not set or using placeholder. Running in fallback mode.");
    return null;
  }
  if (!aiClient) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      console.log("GoogleGenAI client initialized successfully.");
    } catch (e) {
      console.error("Failed to initialize GoogleGenAI client:", e);
      return null;
    }
  }
  return aiClient;
}

async function executeCall(ai: GoogleGenAI, model: string, systemInstruction: string, prompt: string, retries = 5): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });
    return response.text || "No response text generated.";
  } catch (err: any) {
    if (retries > 0 && (err?.status === 429 || err?.status === 503)) {
      const delay = Math.pow(2, 6 - retries) * 2000;
      console.warn(`Gemini call failed (status ${err.status}), retrying in ${delay}ms... (attempts left: ${retries - 1})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return executeCall(ai, model, systemInstruction, prompt, retries - 1);
    }
    throw err;
  }
}

async function runGeminiCall(
  ai: GoogleGenAI,
  model: string,
  systemInstruction: string,
  prompt: string,
  addLog?: (type: 'thought' | 'output' | 'system' | 'error', message: string, agentId?: string, agentName?: string, content?: string) => void
): Promise<string> {
  const modelToUse = model.includes("pro") ? "gemini-3.1-pro-preview" : "gemini-3.5-flash";
  
  try {
    return await executeCall(ai, modelToUse, systemInstruction, prompt);
  } catch (err: any) {
    if (err?.status === 429 && modelToUse === "gemini-3.1-pro-preview") {
      if (addLog) {
        addLog('system', `⚠️ ${modelToUse} 모델 사용량 제한(429) 초과. 안정적인 gemini-3.5-flash로 자동 전환합니다.`);
      }
      return await executeCall(ai, "gemini-3.5-flash", systemInstruction, prompt);
    }
    console.error(`Gemini call failed with model ${modelToUse}:`, err);
    throw new Error(err?.message || `Gemini generation failed for ${modelToUse}`);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API endpoints
  app.get("/api/health", (req, res) => {
    const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY";
    res.json({ 
      status: "ok", 
      hasApiKey: hasKey,
      timestamp: new Date().toISOString()
    });
  });

  // Run the multi-agent workflow simulation
  app.post("/api/workflow/simulate", async (req, res) => {
    const { workflow } = req.body as { workflow: Workflow };
    if (!workflow || !workflow.agents || workflow.agents.length === 0) {
      return res.status(400).json({ error: "Invalid workflow configuration." });
    }

    const startTime = Date.now();
    const logs: SimulationLog[] = [];
    let finalArtifact = "";

    const addLog = (type: 'thought' | 'output' | 'system' | 'error', message: string, agentId?: string, agentName?: string, content?: string) => {
      logs.push({
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        agentId,
        agentName,
        timestamp: new Date().toLocaleTimeString(),
        type,
        message,
        content
      });
    };

    const ai = getAiClient();

    try {
      addLog('system', `🚀 [${workflow.name}] ${workflow.type.toUpperCase()} 협업 시뮬레이션 시작!`);
      addLog('system', `입력 태스크: "${workflow.inputTask}"`);

      if (ai) {
        // --- REAL GEMINI SIMULATION ---
        if (workflow.type === 'sequential') {
          let currentInput = workflow.inputTask;
          
          for (let i = 0; i < workflow.agents.length; i++) {
            const agent = workflow.agents[i];
            addLog('system', `[단계 ${i + 1}/${workflow.agents.length}] ${agent.name} (${agent.role}) 활성화`);
            
            // Log agent planning
            addLog('thought', `${agent.name}이(가) 역할을 바탕으로 태스크를 분석하고 있습니다...`, agent.id, agent.name);
            
            const prompt = i === 0 
              ? `다음 태스크를 수행해 주세요: ${currentInput}`
              : `이전 단계의 에이전트들의 작업 결과를 전달받았습니다.\n\n[원본 태스크]\n${workflow.inputTask}\n\n[이전 단계까지의 결과물]\n${currentInput}\n\n위 내용을 바탕으로 당신의 역할(${agent.role})에 맞춰 추가 작업, 수정 또는 검토를 진행하고 최종 결과물을 출력해 주세요.`;

            const output = await runGeminiCall(ai, agent.model, agent.systemInstruction, prompt, addLog);
            
            addLog('output', `${agent.name}이(가) 작업을 완료했습니다.`, agent.id, agent.name, output);
            currentInput = output;
          }
          finalArtifact = currentInput;

        } else if (workflow.type === 'parallel') {
          // Parallel runs of the sub-agents (excluding the final consolidator if there is one)
          // Let's assume the last agent is the consolidator/aggregator, and the others are parallel workers
          const workers = workflow.agents.slice(0, -1);
          const consolidator = workflow.agents[workflow.agents.length - 1];

          if (workers.length === 0) {
            // Just single agent
            const agent = workflow.agents[0];
            addLog('system', `병렬 작업자가 없어 ${agent.name} 단독으로 작업을 진행합니다.`);
            addLog('thought', `${agent.name}이(가) 태스크를 분석 중...`, agent.id, agent.name);
            finalArtifact = await runGeminiCall(ai, agent.model, agent.systemInstruction, `다음 태스크를 수행해 주세요: ${workflow.inputTask}`, addLog);
            addLog('output', `${agent.name} 작업 완료.`, agent.id, agent.name, finalArtifact);
          } else {
            addLog('system', `${workers.length}개의 에이전트가 병렬로 독립 분석을 개시합니다.`);
            
            const workerPromises = workers.map(async (agent) => {
              addLog('thought', `${agent.name}이(가) 병렬 분석 및 생성을 시작합니다...`, agent.id, agent.name);
              const output = await runGeminiCall(ai, agent.model, agent.systemInstruction, `당신의 직무 관점에서 다음 태스크를 분석하고 결과를 도출하세요: ${workflow.inputTask}`, addLog);
              addLog('output', `${agent.name}이(가) 개별 결과물을 산출했습니다.`, agent.id, agent.name, output);
              return { agent, output };
            });

            const workerResults = await Promise.all(workerPromises);
            
            addLog('system', `모든 병렬 작업이 완료되었습니다. 취합자 ${consolidator.name} (${consolidator.role}) 활성화`);
            addLog('thought', `${consolidator.name}이(가) 병렬 결과물들을 종합하고 조율 중...`, consolidator.id, consolidator.name);

            let consolidatorPrompt = `다음 원본 태스크에 대해 여러 전문 에이전트들이 도출한 분석 내용이 있습니다:\n\n[원본 태스크]\n${workflow.inputTask}\n\n`;
            workerResults.forEach((r) => {
              consolidatorPrompt += `### [${r.agent.name}의 분석 - 역할: ${r.agent.role}]\n${r.output}\n\n`;
            });
            consolidatorPrompt += `당신의 취합 역할(${consolidator.role})에 맞추어, 위 개별 분석 정보들을 유기적으로 통합, 비교 및 조율하여 하나의 최종 완성된 보고서/결과물로 정리해 주세요.`;

            finalArtifact = await runGeminiCall(ai, consolidator.model, consolidator.systemInstruction, consolidatorPrompt, addLog);
            addLog('output', `${consolidator.name}이(가) 통합 완료된 결과물을 생성했습니다.`, consolidator.id, consolidator.name, finalArtifact);
          }

        } else if (workflow.type === 'review') {
          // Writer -> Reviewer -> Writer Revision
          const creator = workflow.agents[0];
          const reviewer = workflow.agents[1] || creator;

          addLog('system', `[단계 1/3] 창작자 ${creator.name}의 초안 작성 개시`);
          addLog('thought', `${creator.name}이(가) 주제에 맞는 아이디어를 기획하고 초고를 작성 중...`, creator.id, creator.name);
          
          const draft = await runGeminiCall(ai, creator.model, creator.systemInstruction, `다음 주제/태스크에 대해 초안을 정성껏 작성해 주세요: ${workflow.inputTask}`, addLog);
          addLog('output', `${creator.name}이(가) 초안(Draft v1)을 작성했습니다.`, creator.id, creator.name, draft);

          addLog('system', `[단계 2/3] 검토자 ${reviewer.name}의 피드백 분석 개시`);
          addLog('thought', `${reviewer.name}이(가) 완성도, 전문성, 톤앤매너 등을 엄격하게 검토 중...`, reviewer.id, reviewer.name);

          const reviewPrompt = `다음 원본 태스크에 맞춰 작성된 창작물 초안을 검토해 주세요.\n\n[원본 태스크]\n${workflow.inputTask}\n\n[창작물 초안]\n${draft}\n\n당신의 검토자 역할(${reviewer.role})과 전문 지식을 바탕으로 건설적인 비평, 문제점 지적 및 구체적인 수정 방향 가이드를 명확하게 정리해 주세요.`;
          const feedback = await runGeminiCall(ai, reviewer.model, reviewer.systemInstruction, reviewPrompt, addLog);
          addLog('output', `${reviewer.name}이(가) 상세 피드백 리포트를 작성했습니다.`, reviewer.id, reviewer.name, feedback);

          addLog('system', `[단계 3/3] 창작자 ${creator.name}의 피드백 반영 및 최종 퇴고`);
          addLog('thought', `${creator.name}이(가) 피드백 리포트를 분석하고 수정 작업을 진행 중...`, creator.id, creator.name);

          const revisionPrompt = `당신이 작성한 초안과 이에 대한 전문 검토자의 피드백을 전달합니다.\n\n[원본 태스크]\n${workflow.inputTask}\n\n[당신의 이전 초안]\n${draft}\n\n[검토자 피드백]\n${feedback}\n\n제시된 피드백을 충실하게 반영하여, 단점을 극복하고 훨씬 완성도 높은 최종 결과물로 전면 퇴고해 주세요.`;
          finalArtifact = await runGeminiCall(ai, creator.model, creator.systemInstruction, revisionPrompt, addLog);
          addLog('output', `${creator.name}이(가) 최종 퇴고 및 보완을 완료했습니다.`, creator.id, creator.name, finalArtifact);

        } else if (workflow.type === 'routing') {
          // Ask Gemini to route the task to the best agent
          const router = workflow.agents[0];
          const specialAgents = workflow.agents.slice(1);

          if (specialAgents.length === 0) {
            addLog('system', `라우팅할 전담 에이전트가 없어 ${router.name}이(가) 직접 작업을 처리합니다.`);
            addLog('thought', `${router.name} 처리 중...`, router.id, router.name);
            finalArtifact = await runGeminiCall(ai, router.model, router.systemInstruction, `다음 태스크를 처리하세요: ${workflow.inputTask}`, addLog);
            addLog('output', `${router.name} 작업 완료.`, router.id, router.name, finalArtifact);
          } else {
            addLog('system', `분류자 ${router.name} (${router.role}) 가동. 적합한 전담 에이전트를 탐색합니다.`);
            addLog('thought', `${router.name}이(가) 태스크 성격을 분류 중...`, router.id, router.name);

            const routerSelectionPrompt = `다음 태스크의 성격을 분석하여, 제공된 특화 에이전트 목록 중 가장 적합한 하나의 에이전트 이름을 선택해 주세요.\n\n[수행 태스크]\n${workflow.inputTask}\n\n[후보 에이전트 목록]\n${specialAgents.map(a => `- 이름: "${a.name}" | 역할: ${a.role} | 소개: ${a.description}`).join('\n')}\n\n반드시 후보 목록에 있는 정확한 에이전트 이름 한 가지만 텍스트로 응답해 주세요. 그 외의 수식어는 배제해 주세요.`;
            const selectedAgentName = (await runGeminiCall(ai, router.model, router.systemInstruction, routerSelectionPrompt, addLog)).trim();
            
            // Match agent
            let matchedAgent = specialAgents.find(a => selectedAgentName.toLowerCase().includes(a.name.toLowerCase()) || a.name.toLowerCase().includes(selectedAgentName.toLowerCase()));
            if (!matchedAgent) {
              matchedAgent = specialAgents[0]; // fallback to first
              addLog('system', `분류 결과 모호함으로 인해 기본 에이전트 [${matchedAgent.name}]로 배정합니다. (분류값: "${selectedAgentName}")`);
            } else {
              addLog('system', `분류 완료: 이 태스크는 전문 분야를 고려해 [${matchedAgent.name}] 에이전트에게 할당되었습니다.`);
            }

            addLog('thought', `${matchedAgent.name}이(가) 자신에게 라우팅된 전문 태스크를 검토 및 제작 중...`, matchedAgent.id, matchedAgent.name);
            finalArtifact = await runGeminiCall(ai, matchedAgent.model, matchedAgent.systemInstruction, `전담 요청을 받았습니다. 다음 태스크를 완벽하게 수행해 주세요: ${workflow.inputTask}`, addLog);
            addLog('output', `${matchedAgent.name}이(가) 배정된 작업을 완료했습니다.`, matchedAgent.id, matchedAgent.name, finalArtifact);
          }
        }
      } else {
        // --- HIGH FIDELITY FALLBACK / MOCK SIMULATION ---
        addLog('system', `⚠️ API 키가 누락되었거나 로컬 테스트 모드입니다. 지능형 시뮬레이터를 가동합니다.`);
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulating latency

        if (workflow.type === 'sequential') {
          let currentContent = "";
          for (let i = 0; i < workflow.agents.length; i++) {
            const agent = workflow.agents[i];
            addLog('system', `[단계 ${i + 1}/${workflow.agents.length}] ${agent.name} (${agent.role}) 활성화`);
            addLog('thought', `${agent.name}이(가) 역할을 바탕으로 태스크를 분석하고 있습니다...`, agent.id, agent.name);
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (i === 0) {
              currentContent = `### [${agent.name}의 연구 분석 초안]\n\n**주제:** ${workflow.inputTask}\n\n1. **핵심 요약:** 이 태스크는 ${agent.role} 관점에서 설계되어 핵심 구성 요소들을 엄밀히 고찰합니다.\n2. **초기 프레임워크:** 당면 과제 해결을 위한 프로세스를 정립하고, 발생 가능한 제약 사항을 정의하였습니다.\n3. **추천 방안:** 기술적 타당성과 효과를 분석하여 초기 실행 가능한 마일스톤을 아래와 같이 제안합니다.\n- 분석 타겟 명확화\n- 데이터 및 템플릿 표준 규격 설계\n- 단계별 실행 계획 점검`;
            } else if (i === 1) {
              currentContent = `${currentContent}\n\n---\n\n### [${agent.name}의 구체화 및 상세 작성]\n\n이전 ${workflow.agents[0].name}의 기획 초안을 토대로 실무적이고 디테일한 글로 가공하였습니다.\n\n**1. 실무 이행 로드맵**\n- **Phase 1:** 요구사항 구체화 및 타임라인 수립 (즉시 실행)\n- **Phase 2:** 도구 설계 및 검증 절차 실행\n- **Phase 3:** 사용자 피드백 통합 및 릴리즈 준비\n\n**2. 부가 기술 및 디테일**\n- ${agent.name}의 풍부한 ${agent.role} 노하우를 녹여내어, 가독성이 높고 직관적인 아웃라인으로 다듬었습니다. 가독성 개선을 위해 글의 톤앤매너를 일괄 수정했습니다.`;
            } else {
              currentContent = `${currentContent}\n\n---\n\n### [${agent.name}의 최종 검증 및 감수]\n\n최종 감수자로서 이전 내용들을 종합하여 다음과 같이 최종 보완하였습니다.\n\n**최종 보완 사항:**\n- 맞춤법 및 오탈자 최종 수정 완료.\n- 전문성 극대화를 위해 각 장표의 핵심 키워드를 최신 업계 동향에 알맞게 정비.\n- 실행 시 즉시 체크할 수 있는 체크리스트 추가.\n\n✅ **검수 통과 완료!** 실무 적용이 가능한 최고 수준의 가이드라인으로 최종 승인합니다.`;
            }

            addLog('output', `${agent.name}이(가) 작업을 완벽히 완료하여 다음 단계로 전달합니다.`, agent.id, agent.name, currentContent);
          }
          finalArtifact = currentContent;

        } else if (workflow.type === 'parallel') {
          const workers = workflow.agents.slice(0, -1);
          const consolidator = workflow.agents[workflow.agents.length - 1];

          if (workers.length === 0) {
            const agent = workflow.agents[0];
            addLog('thought', `${agent.name} 분석 중...`, agent.id, agent.name);
            await new Promise(resolve => setTimeout(resolve, 1000));
            finalArtifact = `[단독 결과물] 태스크 "${workflow.inputTask}"에 대해 ${agent.name}이(가) 역할을 다해 작업을 완수하였습니다.`;
            addLog('output', `${agent.name} 작업 완료.`, agent.id, agent.name, finalArtifact);
          } else {
            addLog('system', `${workers.length}개의 전문 에이전트가 동시에 병렬 분석을 수행합니다.`);
            
            const workerOutputs = [];
            for (const worker of workers) {
              addLog('thought', `${worker.name}이(가) 병렬 분석을 기획하고 데이터를 수집 중...`, worker.id, worker.name);
              await new Promise(resolve => setTimeout(resolve, 800));
              const output = `**[${worker.name}의 전문 분야 피드백]**\n- **강점:** ${worker.role} 관점에서의 분석 및 제안점 적용.\n- **핵심 아이디어:** "${workflow.inputTask}"를 성공시키기 위해 필요한 필수 인프라와 기법 제안.`;
              addLog('output', `${worker.name}이(가) 개별 리포트 생성을 완료했습니다.`, worker.id, worker.name, output);
              workerOutputs.push(output);
            }

            addLog('system', `취합 담당 에이전트 ${consolidator.name} 활성화.`);
            addLog('thought', `${consolidator.name}이(가) 분산된 보고서들을 유기적으로 결합하는 중...`, consolidator.id, consolidator.name);
            await new Promise(resolve => setTimeout(resolve, 1200));

            finalArtifact = `# 📋 ${workflow.name} 종합 협업 결과 보고서\n\n**대상 태스크:** ${workflow.inputTask}\n\n---\n\n## 1. 개별 부서별 전문 리포트\n\n${workerOutputs.join('\n\n')}\n\n---\n\n## 2. ${consolidator.name} (${consolidator.role})의 통합 및 조율 결론\n\n- 전문적인 협력 분석 결과, 각 파트의 분석은 매우 유기적이며 타당함.\n- **최종 결론:** 분과별 제안 사항을 동시 병렬 이행하되, 우선순위를 기획-제작-감수 순으로 설정하여 시너지를 창출할 것을 강력하게 제안함.`;
            addLog('output', `${consolidator.name}이(가) 최종 통합본 제작을 마쳤습니다.`, consolidator.id, consolidator.name, finalArtifact);
          }

        } else if (workflow.type === 'review') {
          const creator = workflow.agents[0];
          const reviewer = workflow.agents[1] || creator;

          addLog('system', `[단계 1/3] ${creator.name}의 초안 작성 개시`);
          addLog('thought', `${creator.name}이(가) 주제를 기반으로 구성안을 짜고 초안을 다듬고 있습니다...`, creator.id, creator.name);
          await new Promise(resolve => setTimeout(resolve, 1200));
          const draft = `### [초안 v1 - 작성자: ${creator.name}]\n\n**태스크:** ${workflow.inputTask}\n\n본 연구/작업은 ${creator.role}의 기법을 활용하여 작성되었습니다. \n주요 내용으로는 핵심 가치 제시, 실행 가능 인프라 구성, 그리고 실용적인 적용 사례를 담고 있습니다. 하지만 깊이 있는 통계적 검증이나 완벽한 톤앤매너 정리는 추가 피드백을 통해 보완이 필요한 상태입니다.`;
          addLog('output', `${creator.name}이(가) 초안 작성을 끝내고 검토를 요청했습니다.`, creator.id, creator.name, draft);

          addLog('system', `[단계 2/3] ${reviewer.name}의 날카로운 품질 검사 및 피드백 도출`);
          addLog('thought', `${reviewer.name}이(가) 초안 내용을 면밀히 비평하는 중...`, reviewer.id, reviewer.name);
          await new Promise(resolve => setTimeout(resolve, 1200));
          const feedback = `### 🔍 [검토 의견서 - 검토자: ${reviewer.name}]\n\n${creator.name}님께서 작성해 주신 초안은 구조가 훌륭합니다. 다만 몇 가지 보완할 점을 제시합니다:\n1. **현실성 보강:** 추상적인 서술을 피하고, 구체적인 예시나 데이터 지표를 보강해야 합니다.\n2. **전달력 개선:** 문장이 다소 길어 가독성이 떨어지므로, 핵심 요소를 불릿 포인트로 재구성할 것을 권장합니다.\n3. **톤앤매너:** ${reviewer.role} 기준에 부합하도록 문장의 전문 어조를 한 차원 높여 주십시오.`;
          addLog('output', `${reviewer.name}이(가) 피드백 리포트를 전달했습니다.`, reviewer.id, reviewer.name, feedback);

          addLog('system', `[단계 3/3] ${creator.name}의 피드백 전격 수렴 및 전면 개정`);
          addLog('thought', `${creator.name}이(가) 지적된 사항들을 하나하나 보완하며 재작성 중...`, creator.id, creator.name);
          await new Promise(resolve => setTimeout(resolve, 1500));

          finalArtifact = `# 🏆 최종 완성본 (퇴고 완료)\n\n**태스크:** ${workflow.inputTask}\n\n---\n\n### 1. 수정 방향 및 피드백 반영 사항\n- **검토자 ${reviewer.name} 피드백 반영:** 가독성 향상을 위해 핵심 요소 리포맷, 추상적 서술 배제 및 구체화 적용, 실무 톤앤매너 업그레이드 완료.\n\n### 2. 본문 및 상세 가이드\n- **전략적 비전:** ${creator.role} 관점에서의 완성도 최적화\n- **실행 마일스톤:** 지적된 바와 같이, 즉시 행동으로 이식 가능한 명확한 단계별 체크리스트를 포함하였습니다.\n- **통합 가치:** 비평과 집필의 조화로운 완성을 이뤄내어 완성도를 150% 끌어올렸습니다.`;
          addLog('output', `${creator.name}이(가) 최종 퇴고 및 보완을 완료하였습니다.`, creator.id, creator.name, finalArtifact);

        } else if (workflow.type === 'routing') {
          const router = workflow.agents[0];
          const specialAgents = workflow.agents.slice(1);

          if (specialAgents.length === 0) {
            addLog('thought', `${router.name} 처리 중...`, router.id, router.name);
            await new Promise(resolve => setTimeout(resolve, 1000));
            finalArtifact = `[단독 처리 결과] 전문 분야 에이전트가 지정되지 않아, 라우터인 ${router.name}이(가) 직접 작업을 분석 및 완성했습니다.`;
            addLog('output', `${router.name} 작업 완료.`, router.id, router.name, finalArtifact);
          } else {
            addLog('system', `분류기 ${router.name} 가동. 최적의 전문 에이전트를 스캐닝합니다.`);
            addLog('thought', `${router.name}이(가) 입력된 태스크를 파싱 중...`, router.id, router.name);
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Smart logic to select agent based on keywords
            let selectedIdx = 0;
            const lowercaseTask = workflow.inputTask.toLowerCase();
            for (let i = 0; i < specialAgents.length; i++) {
              const agent = specialAgents[i];
              if (
                lowercaseTask.includes(agent.name.toLowerCase()) || 
                lowercaseTask.includes(agent.role.toLowerCase()) ||
                (i === 1 && (lowercaseTask.includes("code") || lowercaseTask.includes("개발") || lowercaseTask.includes("프로그래밍"))) ||
                (i === 0 && (lowercaseTask.includes("글") || lowercaseTask.includes("기획") || lowercaseTask.includes("마케팅")))
              ) {
                selectedIdx = i;
                break;
              }
            }
            const matchedAgent = specialAgents[selectedIdx];
            addLog('system', `분류 완료: 태스크 특성을 감안해 [${matchedAgent.name}] 에이전트에게 라우팅합니다.`);

            addLog('thought', `${matchedAgent.name}이(가) 역할을 바탕으로 라우팅된 전문 업무를 분석 및 수행하고 있습니다...`, matchedAgent.id, matchedAgent.name);
            await new Promise(resolve => setTimeout(resolve, 1500));

            finalArtifact = `# 🎯 배정 작업 결과 리포트\n\n**담당 에이전트:** ${matchedAgent.name} (${matchedAgent.role})\n**라우팅 기준:** 라우터 ${router.name}에 의해 해당 주제의 전문 해결사로 선정됨\n\n---\n\n## [상세 결과]\n- **태스크:** ${workflow.inputTask}\n- **분석 접근법:** ${matchedAgent.name}만의 ${matchedAgent.role} 핵심 기법을 활용하여 심층 연구 및 솔루션 개발.\n- **전략적 산출물:** 본 직무 가이드에 부합하는 정밀하고 실현 가능한 세부 계획서 제작을 완료함.`;
            addLog('output', `${matchedAgent.name}이(가) 할당받은 업무를 완벽하게 마쳤습니다.`, matchedAgent.id, matchedAgent.name, finalArtifact);
          }
        }
      }

      addLog('system', `🎉 [시뮬레이션 완료] 모든 협업 단계가 정상적으로 종료되었습니다!`);
      const durationMs = Date.now() - startTime;
      
      res.json({
        success: true,
        logs,
        finalArtifact,
        durationMs
      });

    } catch (error: any) {
      console.error("Simulation error:", error);
      addLog('error', `❌ 시뮬레이션 중 치명적인 오류가 발생했습니다: ${error.message}`);
      res.status(500).json({
        success: false,
        logs,
        error: error.message
      });
    }
  });

  // Serve Vite app or built static files
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
