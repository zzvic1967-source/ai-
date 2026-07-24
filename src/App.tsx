import React, { useState, useEffect } from 'react';
import { 
  Search, 
  PenTool, 
  CheckSquare, 
  Code2, 
  ShieldAlert, 
  Cpu, 
  Palette, 
  TrendingUp, 
  Briefcase, 
  GitFork, 
  CreditCard, 
  Terminal, 
  Settings, 
  Plus, 
  Trash2, 
  Play, 
  Sparkles, 
  RefreshCw, 
  AlertCircle, 
  ArrowRight, 
  Clock, 
  Check, 
  FileText, 
  MessageSquare, 
  Layers, 
  GitMerge, 
  Eye, 
  UserPlus, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  ChevronRight, 
  HelpCircle 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { PRESET_WORKFLOWS } from './presets';
import { Agent, Workflow, SimulationLog, WorkflowType } from './types';

// Map icon string names to React Lucide components
const IconMap: { [key: string]: React.ComponentType<any> } = {
  Search,
  PenTool,
  CheckSquare,
  Code2,
  ShieldAlert,
  Cpu,
  Palette,
  TrendingUp,
  Briefcase,
  GitFork,
  CreditCard,
  Terminal,
  Settings,
};

export default function App() {
  // Application State
  const [workflows, setWorkflows] = useState<Workflow[]>(PRESET_WORKFLOWS);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow>(PRESET_WORKFLOWS[0]);
  
  // Active state editing variables
  const [workflowName, setWorkflowName] = useState(selectedWorkflow.name);
  const [workflowDesc, setWorkflowDesc] = useState(selectedWorkflow.description);
  const [workflowType, setWorkflowType] = useState<WorkflowType>(selectedWorkflow.type);
  const [inputTask, setInputTask] = useState(selectedWorkflow.inputTask);
  const [agents, setAgents] = useState<Agent[]>(selectedWorkflow.agents);
  
  // Selected Agent for configuration
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(selectedWorkflow.agents[0]?.id || null);
  
  // Simulation states
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<SimulationLog[]>([]);
  const [finalArtifact, setFinalArtifact] = useState<string>('');
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [simulationDuration, setSimulationDuration] = useState<number | null>(null);
  const [apiStatus, setApiStatus] = useState<{ checked: boolean; hasKey: boolean }>({ checked: false, hasKey: false });
  const [copied, setCopied] = useState(false);
  
  // Active tab in details view: 'logs' | 'artifact'
  const [activeTab, setActiveTab] = useState<'logs' | 'artifact'>('logs');

  // Load API Health on mount
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setApiStatus({ checked: true, hasKey: data.hasApiKey });
      })
      .catch(err => {
        console.error("Failed to check API key status:", err);
        setApiStatus({ checked: true, hasKey: false });
      });
  }, []);

  // Update form inputs when selected workflow changes
  const handleSelectWorkflow = (wf: Workflow) => {
    setSelectedWorkflow(wf);
    setWorkflowName(wf.name);
    setWorkflowDesc(wf.description);
    setWorkflowType(wf.type);
    setInputTask(wf.inputTask);
    setAgents(wf.agents);
    setSelectedAgentId(wf.agents[0]?.id || null);
    
    // Reset simulation details
    setLogs([]);
    setFinalArtifact('');
    setActiveAgentId(null);
    setSimulationDuration(null);
    setActiveTab('logs');
  };

  // Keep state variables in sync with current changes
  const handleWorkflowTypeChange = (type: WorkflowType) => {
    setWorkflowType(type);
    
    // Automatically morph agent structures to match logical preset guidelines
    let updatedAgents = [...agents];
    if (type === 'review' && updatedAgents.length < 2) {
      // Review workflows require at least creator and auditor
      updatedAgents = [
        updatedAgents[0] || {
          id: 'agent-' + Date.now(),
          name: '전문 집필 에이전트',
          role: '창작물 초안 생성',
          model: 'gemini-3.5-flash',
          systemInstruction: '당신은 전문 콘텐츠 기획 및 창작 에이전트입니다. 주어진 요건에 맞추어 설득력 있고 완벽한 초안을 완성도 높게 작성해 주세요.',
          description: '요청 사항에 입각한 전문 초안 생성',
          color: 'indigo',
          icon: 'PenTool'
        },
        {
          id: 'agent-reviewer-' + Date.now(),
          name: '수석 검토 에이전트',
          role: '초안 상세 비평 및 피드백 작성',
          model: 'gemini-3.1-pro-preview',
          systemInstruction: '당신은 엄격한 수석 감사관 에이전트입니다. 작성된 콘텐츠 초안에 대해 논리성, 가독성, 사실 여부 및 완성도를 객체적으로 평가하고 따끔하지만 건설적인 교정 피드백 가이드를 만들어 주세요.',
          description: '글 검증 및 피드백 리포트 작성',
          color: 'rose',
          icon: 'ShieldAlert'
        }
      ];
    } else if (type === 'routing' && updatedAgents.length < 3) {
      // Routing needs Router + 2 helpers
      updatedAgents = [
        {
          id: 'agent-router-' + Date.now(),
          name: '지능형 라우터',
          role: '태스크 성격 식별 및 자동 분류',
          model: 'gemini-3.5-flash',
          systemInstruction: '당신은 요청 사항을 분석해 담당 부서에 지정 배분해주는 분배자 에이전트입니다. 주어진 태스크의 성격을 해석하여 후보군 중 가장 부합하는 한 명의 전담 에이전트 이름만을 골라주세요.',
          description: '태스크 파싱 및 분배 담당',
          color: 'zinc',
          icon: 'GitFork'
        },
        {
          id: 'agent-creative-' + Date.now(),
          name: '크리에이티브 크루',
          role: '마케팅, 글쓰기 및 예술 기획 처리',
          model: 'gemini-3.5-flash',
          systemInstruction: '당신은 풍부한 감성을 겸비한 크리에이티브 콘텐츠 전문가입니다. 감성적이고 몰입감 있는 고품격 솔루션을 가공해 주세요.',
          description: '글짓기, 기획, 스토리텔링 전문',
          color: 'purple',
          icon: 'Palette'
        },
        {
          id: 'agent-tech-' + Date.now(),
          name: '기술 솔루션 팀',
          role: '시스템 설계, 연산 및 코딩 구현',
          model: 'gemini-3.1-pro-preview',
          systemInstruction: '당신은 초정밀 백엔드 개발자이자 기술 설계 전문가입니다. 엄격한 아키텍처 및 소스 코드, 논리적 해결책을 상세 주석과 함께 구현하세요.',
          description: '알고리즘, 시스템 설계, 개발 전문',
          color: 'cyan',
          icon: 'Cpu'
        }
      ];
    }
    
    setAgents(updatedAgents);
    setSelectedAgentId(updatedAgents[0]?.id || null);
  };

  // Add a new Agent Node
  const handleAddAgent = () => {
    const colors = ['blue', 'purple', 'emerald', 'indigo', 'rose', 'cyan', 'pink', 'amber', 'violet', 'orange'];
    const icons = ['Search', 'PenTool', 'CheckSquare', 'Code2', 'ShieldAlert', 'Cpu', 'Palette', 'TrendingUp', 'Briefcase', 'Terminal'];
    
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomIcon = icons[Math.floor(Math.random() * icons.length)];
    
    const newAgent: Agent = {
      id: `agent-custom-${Date.now()}`,
      name: `신규 에이전트 #${agents.length + 1}`,
      role: `특화 미션 수행 및 지원`,
      model: 'gemini-3.5-flash',
      systemInstruction: '당신은 최적의 전문 협력 에이전트입니다. 전달된 문맥과 당신의 핵심 역할을 고려해 완벽한 결과물을 생성하세요.',
      description: '업무 가속화 및 특수 피드백 담당',
      color: randomColor,
      icon: randomIcon
    };

    const updated = [...agents, newAgent];
    setAgents(updated);
    setSelectedAgentId(newAgent.id);
  };

  // Delete an Agent Node
  const handleDeleteAgent = (idToDelete: string) => {
    if (agents.length <= 1) {
      alert("협업을 위해서는 최소 1명의 에이전트가 존재해야 합니다.");
      return;
    }
    const updated = agents.filter(a => a.id !== idToDelete);
    setAgents(updated);
    if (selectedAgentId === idToDelete) {
      setSelectedAgentId(updated[0]?.id || null);
    }
  };

  // Update a single agent field
  const updateAgentField = (id: string, field: keyof Agent, value: string) => {
    const updated = agents.map(agent => {
      if (agent.id === id) {
        return { ...agent, [field]: value };
      }
      return agent;
    });
    setAgents(updated);
  };

  // Start Simulation Loop
  const handleStartSimulation = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setLogs([]);
    setFinalArtifact('');
    setActiveAgentId(null);
    setSimulationDuration(null);
    setActiveTab('logs');

    // Build immediate visual structure
    const currentWorkflowConfig: Workflow = {
      id: selectedWorkflow.id,
      name: workflowName,
      description: workflowDesc,
      type: workflowType,
      agents: agents,
      inputTask: inputTask,
      links: [] // Generated on fly
    };

    try {
      // Simulate frontend state transition timings
      // Step 1: Initialize
      const response = await fetch('/api/workflow/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workflow: currentWorkflowConfig }),
      });

      const data = await response.json();

      if (data.success) {
        // Stagger logs display for interactive theater effect
        for (let i = 0; i < data.logs.length; i++) {
          const log = data.logs[i];
          
          if (log.agentId) {
            setActiveAgentId(log.agentId);
          } else {
            setActiveAgentId(null);
          }

          setLogs(prev => [...prev, log]);
          
          // Fast-forward scroll for terminals
          const term = document.getElementById('terminal-viewport');
          if (term) term.scrollTop = term.scrollHeight;

          // Staggering delay to make reasoning visible and engaging
          await new Promise(resolve => setTimeout(resolve, log.type === 'thought' ? 1200 : 800));
        }

        setFinalArtifact(data.finalArtifact);
        setSimulationDuration(data.durationMs);
        setActiveAgentId(null);
        setActiveTab('artifact'); // Automatically pivot to final product
      } else {
        setLogs(data.logs || []);
        alert(`시뮬레이션 도중 에러가 발생했습니다: ${data.error}`);
      }
    } catch (err: any) {
      console.error(err);
      setLogs(prev => [
        ...prev,
        {
          id: 'error-log',
          timestamp: new Date().toLocaleTimeString(),
          type: 'error',
          message: `네트워크 또는 서버와의 연결에 실패했습니다: ${err.message}`
        }
      ]);
    } finally {
      setIsRunning(false);
      setActiveAgentId(null);
    }
  };

  // Save current workflow structure back to presets in local memory
  const handleSaveToPresets = () => {
    const updated: Workflow = {
      id: selectedWorkflow.id.startsWith('preset-') ? selectedWorkflow.id : `custom-${Date.now()}`,
      name: workflowName,
      description: workflowDesc,
      type: workflowType,
      agents: agents,
      inputTask: inputTask,
      links: []
    };

    // Update list
    const newList = workflows.map(w => w.id === selectedWorkflow.id ? updated : w);
    setWorkflows(newList);
    setSelectedWorkflow(updated);
    alert("워크플로우 설정이 저장되었습니다. 시뮬레이션 버튼을 눌러 협업을 확인해 보세요!");
  };

  // Create clean slate new workflow
  const handleCreateNewWorkflow = () => {
    const newWf: Workflow = {
      id: `custom-workflow-${Date.now()}`,
      name: '새로운 협업 파이프라인',
      description: '원하는 비즈니스 도메인 및 특화 인력을 배치해 자신만의 지능형 시너지 루프를 조율하세요.',
      type: 'sequential',
      inputTask: '여기에 에이전트들이 공동 연구할 연구 과제를 입력해 주세요.',
      agents: [
        {
          id: `agent-1-${Date.now()}`,
          name: '초안 설계원',
          role: '전문적이고 논리적인 초기 리서치 기안',
          model: 'gemini-3.5-flash',
          systemInstruction: '당신은 연구기획 전문가입니다. 주어진 의제에 관하여 실증적 데이터를 취합하고 명료한 아웃라인을 설계해 주세요.',
          description: '리서치 분석 자료 기획',
          color: 'blue',
          icon: 'Search'
        },
        {
          id: `agent-2-${Date.now()}`,
          name: '실무 디벨로퍼',
          role: '아웃라인 기반 상세 본문 팩트체크 및 조문화',
          model: 'gemini-3.5-flash',
          systemInstruction: '당신은 전문 기술 집필가입니다. 설계원이 작성한 초안을 정성껏 검증하고 세련된 단어와 표식으로 논지를 풍부히 발전시키세요.',
          description: '가독성 높은 콘텐츠 생산',
          color: 'purple',
          icon: 'PenTool'
        }
      ],
      links: []
    };

    setWorkflows([newWf, ...workflows]);
    handleSelectWorkflow(newWf);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(finalArtifact);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white" id="app-root">
      
      {/* Premium Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50 px-6 py-4 flex items-center justify-between" id="app-header">
        <div className="flex items-center space-x-3" id="brand-area">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl shadow-lg shadow-indigo-500/10 flex items-center justify-center animate-pulse" id="brand-logo">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              AI Agent Workflow Designer
            </h1>
            <p className="text-xs text-slate-400 font-medium">다양한 인공지능 에이전트 간의 자율 협동 시뮬레이터</p>
          </div>
        </div>

        {/* API Connection Indicator */}
        <div className="flex items-center space-x-3" id="api-status-box">
          {apiStatus.checked ? (
            apiStatus.hasKey ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 mr-2 rounded-full bg-emerald-400 animate-ping"></span>
                Gemini API 온라인 연결됨
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20" title="API키가 누락되어 정교화된 가상 시뮬레이션 샌드박스로 완벽하게 가동됩니다.">
                <span className="w-1.5 h-1.5 mr-2 rounded-full bg-amber-400"></span>
                시뮬레이션 로컬 샌드박스 활성
              </span>
            )
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400">
              <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />
              서버 검증 중...
            </span>
          )}

          <button 
            onClick={handleCreateNewWorkflow}
            className="flex items-center space-x-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 transition text-xs font-bold rounded-lg border border-slate-700 text-indigo-400 cursor-pointer"
            id="btn-new-wf"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>새 설계서</span>
          </button>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6" id="main-content">
        
        {/* LEFT COLUMN: CONTROL BOARD & AGENT BUILDER (5 Columns) */}
        <section className="lg:col-span-5 flex flex-col space-y-6" id="left-sidebar">
          
          {/* Preset Picker Panel */}
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-5" id="presets-panel">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>미리 설계된 에이전트 연합</span>
              </h2>
            </div>
            
            <div className="grid grid-cols-1 gap-2.5" id="presets-list">
              {workflows.map((wf) => {
                const isActive = selectedWorkflow.id === wf.id;
                return (
                  <button
                    key={wf.id}
                    onClick={() => handleSelectWorkflow(wf)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                      isActive 
                        ? 'bg-gradient-to-r from-indigo-950/80 to-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/5' 
                        : 'bg-slate-900/40 border-slate-800 hover:bg-slate-800/40 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className={`font-bold text-sm ${isActive ? 'text-indigo-300' : 'text-slate-200'}`}>
                        {wf.name}
                      </h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-mono tracking-tight ${
                        wf.type === 'sequential' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        wf.type === 'review' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        wf.type === 'parallel' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' :
                        'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                      }`}>
                        {wf.type === 'sequential' && '순차'}
                        {wf.type === 'review' && '피드백'}
                        {wf.type === 'parallel' && '병렬'}
                        {wf.type === 'routing' && '라우팅'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                      {wf.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Workflow Configuration Form */}
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-5 space-y-4" id="workflow-settings-form">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <Settings className="w-4 h-4 text-violet-400" />
              <span>워크플로우 메타 정보</span>
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">파이프라인 이름</label>
              <input 
                type="text" 
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition"
                placeholder="예: 전략적 기사 기고 위원회"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">협업 아키텍처 모델</label>
                <select 
                  value={workflowType}
                  onChange={(e) => handleWorkflowTypeChange(e.target.value as WorkflowType)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value="sequential">순차형 흐름 (Sequential)</option>
                  <option value="parallel">병렬형 회의 (Parallel)</option>
                  <option value="review">피드백 감수 (Feedback Loop)</option>
                  <option value="routing">지능형 라우팅 (Routing)</option>
                </select>
              </div>
              <div className="flex flex-col justify-end">
                <button
                  onClick={handleSaveToPresets}
                  className="w-full bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 border border-slate-700 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  구조 임시 보관
                </button>
              </div>
            </div>

            {/* Input Task */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-400">공동 해결할 미션 과제 (Task Input)</label>
                <span className="text-[10px] text-slate-500">에이전트들에게 전달되는 초기 명령</span>
              </div>
              <textarea 
                value={inputTask}
                onChange={(e) => setInputTask(e.target.value)}
                rows={3}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition leading-relaxed resize-none"
                placeholder="여기에 협업시킬 과업 내용을 자세히 기술해 주세요..."
              />
            </div>
          </div>

          {/* Agents Pipeline Configurator */}
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-5 flex-1 flex flex-col space-y-4" id="agents-configurator">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>조직도 배치 및 프롬프트</span>
              </h2>
              
              <button
                onClick={handleAddAgent}
                className="flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/20 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>추가</span>
              </button>
            </div>

            {/* List of Agents */}
            <div className="space-y-2 overflow-y-auto max-h-72 pr-1" id="agents-list">
              {agents.map((agent, index) => {
                const isSelected = selectedAgentId === agent.id;
                const IconComponent = IconMap[agent.icon] || Cpu;
                
                return (
                  <div
                    key={agent.id}
                    onClick={() => setSelectedAgentId(agent.id)}
                    className={`p-3 rounded-xl border transition-all duration-150 cursor-pointer flex items-center justify-between ${
                      isSelected 
                        ? 'bg-slate-850 border-indigo-500 shadow-md' 
                        : 'bg-slate-950/50 border-slate-850 hover:border-slate-800 hover:bg-slate-900/30'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className={`p-2 rounded-lg bg-${agent.color}-500/10 text-${agent.color}-400 flex-shrink-0 border border-${agent.color}-500/20`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] text-slate-500 font-mono">#{index + 1}</span>
                          <p className="text-xs font-bold text-slate-200 truncate">{agent.name}</p>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">{agent.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleDeleteAgent(agent.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                        title="제거"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Agent Edit Form */}
            {selectedAgentId && agents.find(a => a.id === selectedAgentId) && (
              <div className="border-t border-slate-800 pt-4 mt-2 space-y-3" id="agent-detail-form">
                {(() => {
                  const editingAgent = agents.find(a => a.id === selectedAgentId)!;
                  return (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wide">선택된 에이전트 상세 설정</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 rounded-md text-indigo-400">ID: {editingAgent.id.split('-')[1] || 'custom'}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">이름</label>
                          <input 
                            type="text" 
                            value={editingAgent.name}
                            onChange={(e) => updateAgentField(editingAgent.id, 'name', e.target.value)}
                            className="w-full bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">역할 명세</label>
                          <input 
                            type="text" 
                            value={editingAgent.role}
                            onChange={(e) => updateAgentField(editingAgent.id, 'role', e.target.value)}
                            className="w-full bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">사용 엔진 (Model)</label>
                          <select 
                            value={editingAgent.model}
                            onChange={(e) => updateAgentField(editingAgent.id, 'model', e.target.value)}
                            className="w-full bg-slate-950/90 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] text-slate-300 focus:outline-none focus:border-indigo-500 transition"
                          >
                            <option value="gemini-3.5-flash">Gemini 3.5 Flash (초고속)</option>
                            <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (고성능 추론)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">비주얼 스타일 테마</label>
                          <select 
                            value={editingAgent.color}
                            onChange={(e) => updateAgentField(editingAgent.id, 'color', e.target.value)}
                            className="w-full bg-slate-950/90 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] text-slate-300 focus:outline-none focus:border-indigo-500 transition"
                          >
                            <option value="blue">Blue Sky (블루)</option>
                            <option value="purple">Purple Mist (퍼플)</option>
                            <option value="emerald">Emerald Zen (에메랄드)</option>
                            <option value="indigo">Indigo Depth (인디고)</option>
                            <option value="rose">Rose Quartz (로즈)</option>
                            <option value="cyan">Cyan Pulse (시안)</option>
                            <option value="pink">Pink Accent (핑크)</option>
                            <option value="amber">Amber Glow (앰버)</option>
                            <option value="violet">Violet Royal (바이올렛)</option>
                            <option value="orange">Orange Flare (오렌지)</option>
                            <option value="zinc">Zinc Tech (그레이)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">시스템 지시문 (System Instruction)</label>
                        <textarea 
                          value={editingAgent.systemInstruction}
                          onChange={(e) => updateAgentField(editingAgent.id, 'systemInstruction', e.target.value)}
                          rows={4}
                          className="w-full bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition leading-relaxed resize-none"
                          placeholder="당신은 특정한 미션을 수행하는 전문가입니다..."
                        />
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>

        </section>

        {/* RIGHT COLUMN: INTERACTIVE VISUAL CANVAS & WORKFLOW SIMULATOR (7 Columns) */}
        <section className="lg:col-span-7 flex flex-col space-y-6" id="right-workspace">
          
          {/* Visual Workspace Canvas */}
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-5 flex flex-col h-80 relative overflow-hidden" id="visual-workspace-canvas">
            <div className="flex items-center justify-between mb-4 z-10">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <Eye className="w-4 h-4 text-sky-400" />
                  <span>협업 매핑 및 자율 흐름 시각화</span>
                </h2>
                <p className="text-[10px] text-slate-500 mt-0.5">선택된 에이전트들의 정보 연계 아키텍처 다이어그램</p>
              </div>

              <div className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-md text-sky-400">
                {workflowType === 'sequential' && '순차적 전달 모델'}
                {workflowType === 'parallel' && '다자간 병렬 검토 & 취합 모델'}
                {workflowType === 'review' && '생성-감수 피드백 순환 모델'}
                {workflowType === 'routing' && '선별적 지능 분류 모델'}
              </div>
            </div>

            {/* Interactive Grid Canvas representation */}
            <div className="flex-1 flex items-center justify-center relative bg-slate-950/30 rounded-xl border border-slate-850/50 p-4" id="canvas-grid">
              
              {/* Dynamic SVGs for paths connecting nodes */}
              <div className="absolute inset-0 pointer-events-none" id="flow-arrows-overlay">
                <svg className="w-full h-full">
                  <defs>
                    <marker id="arrow-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="#6366f1" />
                    </marker>
                    <marker id="arrow-head-rose" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="#f43f5e" />
                    </marker>
                  </defs>
                  
                  {/* Draw connection lines dynamically based on flow models */}
                  {workflowType === 'sequential' && (
                    <g>
                      {/* Linear connections */}
                      <line x1="15%" y1="50%" x2="45%" y2="50%" stroke="#4f46e5" strokeWidth="2" strokeDasharray="5,5" className="animate-[dash_10s_linear_infinite]" />
                      <line x1="50%" y1="50%" x2="80%" y2="50%" stroke="#4f46e5" strokeWidth="2" strokeDasharray="5,5" />
                    </g>
                  )}

                  {workflowType === 'parallel' && (
                    <g>
                      {/* Converging onto final consolidator */}
                      <line x1="20%" y1="25%" x2="70%" y2="50%" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="3,3" />
                      <line x1="20%" y1="50%" x2="70%" y2="50%" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="3,3" />
                      <line x1="20%" y1="75%" x2="70%" y2="50%" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="3,3" />
                    </g>
                  )}

                  {workflowType === 'review' && (
                    <g>
                      {/* Dual directional arrows */}
                      <path d="M 220 110 Q 350 80 440 115" fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="4,4" markerEnd="url(#arrow-head)" />
                      <path d="M 440 145 Q 350 180 220 145" fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4,4" markerEnd="url(#arrow-head-rose)" />
                    </g>
                  )}

                  {workflowType === 'routing' && (
                    <g>
                      {/* Split roads */}
                      <line x1="20%" y1="50%" x2="50%" y2="30%" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4,4" />
                      <line x1="20%" y1="50%" x2="50%" y2="70%" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4,4" />
                    </g>
                  )}
                </svg>
              </div>

              {/* Graphical Nodes */}
              <div className="w-full h-full flex items-center justify-around z-10" id="nodes-container">
                {workflowType === 'sequential' && (
                  <div className="w-full flex items-center justify-between px-6">
                    {agents.map((agent, i) => {
                      const IconComponent = IconMap[agent.icon] || Cpu;
                      const isActive = activeAgentId === agent.id;
                      
                      return (
                        <div 
                          key={agent.id}
                          className={`flex flex-col items-center transition-all duration-300 ${isActive ? 'scale-110' : 'scale-100 opacity-90'}`}
                        >
                          <div className={`w-14 h-14 rounded-2xl bg-slate-900 border-2 flex items-center justify-center shadow-lg relative ${
                            isActive 
                              ? `border-indigo-500 shadow-indigo-500/20 ring-4 ring-indigo-500/10` 
                              : `border-${agent.color}-500/40 hover:border-${agent.color}-400`
                          }`}>
                            <IconComponent className={`w-6 h-6 text-${agent.color}-400 ${isActive ? 'animate-bounce' : ''}`} />
                            
                            {/* Sequence Badge */}
                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-850 text-slate-300 text-[10px] font-bold border border-slate-700 flex items-center justify-center">
                              {i + 1}
                            </span>
                          </div>
                          <span className="text-xs font-bold mt-2 text-slate-200">{agent.name.split(' ')[0]}</span>
                          <span className="text-[9px] text-slate-400 mt-0.5">{agent.role.slice(0, 10)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {workflowType === 'parallel' && (
                  <div className="w-full h-full flex items-center justify-between px-4">
                    {/* Left block: workers stacked vertically */}
                    <div className="flex flex-col space-y-3">
                      {agents.slice(0, -1).map((agent, i) => {
                        const IconComponent = IconMap[agent.icon] || Cpu;
                        const isActive = activeAgentId === agent.id;

                        return (
                          <div 
                            key={agent.id}
                            className={`flex items-center space-x-2.5 transition-all duration-300 ${isActive ? 'translate-x-2' : ''}`}
                          >
                            <div className={`w-10 h-10 rounded-xl bg-slate-900 border flex items-center justify-center relative ${
                              isActive ? 'border-indigo-400 ring-2 ring-indigo-500/20' : `border-${agent.color}-500/20`
                            }`}>
                              <IconComponent className={`w-4 h-4 text-${agent.color}-400`} />
                            </div>
                            <div>
                              <p className="text-[11px] font-bold text-slate-200">{agent.name.split(' ')[0]}</p>
                              <p className="text-[9px] text-slate-500">병렬 연구원</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Right block: CM0 Consolidator */}
                    {agents[agents.length - 1] && (() => {
                      const cmo = agents[agents.length - 1];
                      const IconComponent = IconMap[cmo.icon] || Cpu;
                      const isActive = activeAgentId === cmo.id;

                      return (
                        <div className="flex flex-col items-center">
                          <div className={`w-16 h-16 rounded-full bg-indigo-950/40 border-2 flex items-center justify-center relative ${
                            isActive ? 'border-indigo-400 animate-pulse ring-4 ring-indigo-500/10' : 'border-indigo-500/30'
                          }`}>
                            <IconComponent className={`w-7 h-7 text-indigo-400`} />
                            <span className="absolute -bottom-1 px-2 py-0.5 rounded bg-indigo-600 text-[8px] font-extrabold uppercase tracking-wider text-white">Consolidator</span>
                          </div>
                          <p className="text-xs font-extrabold text-indigo-300 mt-2">{cmo.name}</p>
                          <p className="text-[10px] text-slate-400">{cmo.role}</p>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {workflowType === 'review' && (
                  <div className="w-full flex items-center justify-around px-10">
                    {/* Creator */}
                    {agents[0] && (() => {
                      const agent = agents[0];
                      const IconComponent = IconMap[agent.icon] || Cpu;
                      const isActive = activeAgentId === agent.id;

                      return (
                        <div className="flex flex-col items-center">
                          <div className={`w-14 h-14 rounded-2xl bg-slate-900 border-2 flex items-center justify-center relative ${
                            isActive ? 'border-indigo-500 ring-4 ring-indigo-500/10' : 'border-indigo-500/30'
                          }`}>
                            <IconComponent className="w-6 h-6 text-indigo-400" />
                            <span className="absolute -top-1.5 -left-1.5 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[8px] font-bold text-slate-300">창작자</span>
                          </div>
                          <p className="text-xs font-bold text-slate-200 mt-2">{agent.name}</p>
                          <p className="text-[9px] text-slate-400">{agent.role}</p>
                        </div>
                      );
                    })()}

                    {/* Review Loop Visual Indicator */}
                    <div className="flex flex-col items-center space-y-1">
                      <span className="text-[10px] font-mono text-indigo-400 animate-pulse">상호 작용 루프</span>
                      <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" style={{ animationDuration: '8s' }} />
                    </div>

                    {/* Auditor */}
                    {agents[1] && (() => {
                      const agent = agents[1];
                      const IconComponent = IconMap[agent.icon] || Cpu;
                      const isActive = activeAgentId === agent.id;

                      return (
                        <div className="flex flex-col items-center">
                          <div className={`w-14 h-14 rounded-2xl bg-slate-900 border-2 flex items-center justify-center relative ${
                            isActive ? 'border-rose-500 ring-4 ring-rose-500/10' : 'border-rose-500/30'
                          }`}>
                            <IconComponent className="w-6 h-6 text-rose-400" />
                            <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[8px] font-bold text-slate-300">검토위원</span>
                          </div>
                          <p className="text-xs font-bold text-slate-200 mt-2">{agent.name}</p>
                          <p className="text-[9px] text-slate-400">{agent.role}</p>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {workflowType === 'routing' && (
                  <div className="w-full flex items-center justify-between px-6">
                    {/* Router */}
                    {agents[0] && (() => {
                      const r = agents[0];
                      const IconComponent = IconMap[r.icon] || Cpu;
                      const isActive = activeAgentId === r.id;

                      return (
                        <div className="flex flex-col items-center">
                          <div className={`w-14 h-14 rounded-2xl bg-slate-950 border-2 flex items-center justify-center relative ${
                            isActive ? 'border-indigo-400 ring-4 ring-indigo-500/10' : 'border-zinc-700'
                          }`}>
                            <IconComponent className="w-6 h-6 text-zinc-400" />
                            <span className="absolute -top-1.5 -left-1.5 px-1.5 py-0.5 rounded bg-slate-800 text-[8px] font-bold text-zinc-300">분류기</span>
                          </div>
                          <p className="text-xs font-bold text-slate-200 mt-2">{r.name}</p>
                        </div>
                      );
                    })()}

                    {/* Branch separator */}
                    <div className="flex-1 max-w-16 h-0.5 bg-gradient-to-r from-zinc-700 to-indigo-500 relative">
                      <ChevronRight className="w-4 h-4 text-indigo-400 absolute -top-1.5 right-0 animate-ping" />
                    </div>

                    {/* Specialized Dest nodes */}
                    <div className="flex flex-col space-y-4">
                      {agents.slice(1).map((agent) => {
                        const IconComponent = IconMap[agent.icon] || Cpu;
                        const isActive = activeAgentId === agent.id;

                        return (
                          <div 
                            key={agent.id}
                            className={`flex items-center space-x-3 p-2 bg-slate-950/40 rounded-xl border transition-all ${
                              isActive ? 'border-indigo-400 shadow-md translate-x-1' : 'border-slate-800'
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-lg bg-${agent.color}-500/10 border border-${agent.color}-500/20 flex items-center justify-center`}>
                              <IconComponent className={`w-4 h-4 text-${agent.color}-400`} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-200">{agent.name}</p>
                              <p className="text-[8px] uppercase tracking-wider text-slate-500 font-mono">{agent.role.slice(0, 15)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Simulated Live Action Controls Overlay */}
            <div className="mt-4 flex items-center justify-between z-10" id="simulation-panel">
              <div className="flex items-center space-x-2">
                {isRunning ? (
                  <span className="flex items-center text-xs text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full">
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    에이전트들이 통신 및 업무 분석 중...
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {simulationDuration ? (
                      <span>마지막 협업 완료: <strong className="text-emerald-400">{(simulationDuration / 1000).toFixed(2)}s</strong></span>
                    ) : (
                      <span>설계 완료. 시뮬레이션을 개시할 수 있습니다.</span>
                    )}
                  </span>
                )}
              </div>

              <button
                onClick={handleStartSimulation}
                disabled={isRunning}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer ${
                  isRunning 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 active:scale-95 shadow-indigo-500/10'
                }`}
                id="btn-trigger-simulation"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>시뮬레이션 가동</span>
              </button>
            </div>
          </div>

          {/* Interactive Output Tabs & Console screen */}
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-5 flex-1 flex flex-col min-h-96" id="simulation-console-tabs">
            
            {/* Tab Headers */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4" id="console-header">
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('logs')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
                    activeTab === 'logs' 
                      ? 'bg-slate-800 text-indigo-400 border border-slate-700' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>실시간 모니터 로그</span>
                  {logs.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-indigo-950 text-indigo-300 text-[9px] font-mono">
                      {logs.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('artifact')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
                    activeTab === 'artifact' 
                      ? 'bg-slate-800 text-indigo-400 border border-slate-700' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>최종 협업 산출물 (Result)</span>
                  {finalArtifact && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  )}
                </button>
              </div>

              {activeTab === 'artifact' && finalArtifact && (
                <button
                  onClick={copyToClipboard}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition active:scale-95 cursor-pointer"
                  id="btn-copy-result"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? '복사 완료!' : '클립보드 복사'}</span>
                </button>
              )}
            </div>

            {/* Tab Body Contents */}
            <div className="flex-1 flex flex-col min-h-0" id="console-body">
              {activeTab === 'logs' ? (
                /* Live Interactive Console Logger */
                <div className="flex-1 flex flex-col min-h-0 bg-slate-950 rounded-xl border border-slate-850 p-4 font-mono text-xs" id="logs-viewport">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-3 text-slate-500 text-[10px]">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <span className="ml-2 font-semibold">CONSOLE MONITOR</span>
                    </div>
                    <span>UTC-LOGS FEED</span>
                  </div>

                  <div 
                    id="terminal-viewport"
                    className="flex-1 overflow-y-auto space-y-3.5 pr-1 max-h-[400px] leading-relaxed scrollbar-thin scrollbar-thumb-slate-800"
                  >
                    {logs.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-2 py-10" id="empty-logs-view">
                        <Terminal className="w-8 h-8 text-slate-700 animate-pulse" />
                        <p className="text-slate-500">대기 중... 상단의 시뮬레이션 가동 버튼을 누르면 에이전트들의 실시간 협업 과정과 속마음(Thought)이 이곳에 출력됩니다.</p>
                      </div>
                    ) : (
                      logs.map((log) => {
                        return (
                          <div key={log.id} className="border-b border-slate-900/50 pb-3" id={`log-item-${log.id}`}>
                            {/* Log Header */}
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center space-x-2">
                                <span className="text-[10px] text-slate-500 font-mono">[{log.timestamp}]</span>
                                
                                {log.type === 'system' && (
                                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold text-[9px]">SYSTEM</span>
                                )}
                                {log.type === 'thought' && (
                                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold text-[9px]">
                                    THOUGHT : {log.agentName}
                                  </span>
                                )}
                                {log.type === 'output' && (
                                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold text-[9px]">
                                    OUTPUT : {log.agentName}
                                  </span>
                                )}
                                {log.type === 'error' && (
                                  <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-bold text-[9px]">ERROR</span>
                                )}
                              </div>
                            </div>

                            {/* Log Content */}
                            <div className="text-slate-300 pl-2 border-l-2 border-slate-800">
                              <p className={`whitespace-pre-wrap leading-relaxed ${log.type === 'error' ? 'text-rose-400 font-bold' : ''}`}>
                                {log.message}
                              </p>

                              {/* Nested Rich Code/Markdown Content if exists */}
                              {log.content && (
                                <div className="mt-2.5 bg-slate-900 p-3 rounded-lg border border-slate-800 max-h-48 overflow-y-auto text-[11px] text-slate-300">
                                  <pre className="whitespace-pre-wrap font-mono">{log.content}</pre>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                /* Rich Markdown Deliverable View */
                <div className="flex-1 bg-slate-950 rounded-xl border border-slate-850 p-6 overflow-y-auto max-h-[480px]" id="artifact-viewport">
                  {finalArtifact ? (
                    <article className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed space-y-4 font-sans">
                      <ReactMarkdown>{finalArtifact}</ReactMarkdown>
                    </article>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-2 py-10" id="empty-artifact-view">
                      <FileText className="w-8 h-8 text-slate-700 animate-pulse" />
                      <p className="text-slate-500">생성된 산출물이 존재하지 않습니다. 시뮬레이션을 가동하여 전격적인 결과물을 받아 보세요!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </section>

      </main>

      {/* Mini Help Section */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 space-y-2 sm:space-y-0" id="app-footer">
        <p>© 2026 AI Agent Workflow Designer. All rights reserved.</p>
        <div className="flex items-center space-x-4">
          <span className="flex items-center"><HelpCircle className="w-3.5 h-3.5 mr-1" />순차, 병렬, 루프, 라우팅의 4가지 협동 패턴 지원</span>
        </div>
      </footer>

    </div>
  );
}
